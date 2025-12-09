"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { apiService } from "../services/apiService"
import { useAuth } from "./AuthContext"
import { toast } from "react-toastify"

// Interfaces for type safety
interface Product {
  _id: string
  name: string
  price: number
  category: string
  image?: string
  description?: string
  brand?: string
  tag?: string
}

interface CartItem {
  _id: string // This is the cart item's unique ID, not the product ID
  product: Product
  quantity: number
}

interface CartData {
  _id: string // Cart ID
  user: string // User ID
  items: CartItem[]
  createdAt: string
  updatedAt: string
}

interface CartContextType {
  cart: CartItem[]
  loading: boolean
  fetchCart: () => Promise<void>
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateQuantity: (productId: string, newQuantity: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  getCartTotal: () => number
  getCartItemsCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCart = useCallback(async () => {
    if (!user?._id) {
      setCart([])
      setLoading(false)
      console.log("CartContext: No user ID, clearing cart and skipping fetch.")
      return
    }

    try {
      setLoading(true)
      console.log(`CartContext: Fetching cart for user: ${user._id}`)
      const response = await apiService.getCart(user._id)
      console.log("CartContext: getCart API response:", response)

      if (response.success && response.cart?.items) {
        setCart(response.cart.items)
        console.log(`CartContext: Fetched cart successfully, items: ${response.cart.items.length}`)
      } else {
        setCart([])
        console.warn("CartContext: Failed to fetch cart or no items:", response.message)
      }
    } catch (error) {
      console.error("CartContext: Error fetching cart:", error)
      setCart([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) {
      console.log("CartContext: Auth loading finished, attempting to fetch cart.")
      fetchCart()
    }
  }, [authLoading, fetchCart])

  useEffect(() => {
    console.log("CartContext State Updated:")
    console.log("  Cart items count:", cart.length)
    console.log("  Loading:", loading)
  }, [cart, loading])

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user?._id) {
      toast.error("Please log in to add items to your cart.")
      return
    }

    try {
      console.log(`CartContext: Adding product ${productId} to cart for user ${user._id} with quantity ${quantity}`)
      const response = await apiService.addToCart(user._id, productId, quantity)
      console.log("CartContext: addToCart API response:", response)

      if (response.success) {
        toast.success("Product added to cart!")
        console.log("CartContext: Product added successfully, re-fetching cart...")
        await fetchCart()
      } else {
        toast.error(response.message || "Failed to add product to cart.")
        console.error("CartContext: Failed to add product to cart:", response.message)
      }
    } catch (error) {
      console.error("CartContext: Error adding to cart:", error)
      toast.error("Failed to add product to cart.")
    }
  }

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (!user?._id) {
      toast.error("Please log in to update your cart.")
      return
    }

    if (newQuantity < 1) {
      toast.error("Quantity cannot be less than 1. Please remove the item instead.")
      return
    }

    try {
      console.log(`CartContext: Updating quantity for product ${productId} to ${newQuantity} for user ${user._id}`)
      const response = await apiService.updateCartItem(user._id, productId, newQuantity)
      console.log("CartContext: updateCartItem API response:", response)

      if (response.success) {
        toast.success("Cart quantity updated!")
        console.log("CartContext: Quantity updated successfully, re-fetching cart...")
        await fetchCart()
      } else {
        toast.error(response.message || "Failed to update cart quantity.")
        console.error("CartContext: Failed to update cart quantity:", response.message)
      }
    } catch (error) {
      console.error("CartContext: Error updating cart quantity:", error)
      toast.error("Failed to update cart quantity.")
    }
  }

  const removeFromCart = async (productId: string) => {
    if (!user?._id) {
      toast.error("Please log in to modify your cart.")
      return
    }

    try {
      console.log(`CartContext: Removing product ${productId} from cart for user ${user._id}.`)
      const response = await apiService.removeFromCart(user._id, productId)
      console.log("CartContext: removeFromCart API response:", response)

      if (response.success) {
        toast.success("Item removed from cart!")
        console.log("CartContext: Item removed successfully, re-fetching cart...")
        await fetchCart()
      } else {
        toast.error(response.message || "Failed to remove item from cart.")
        console.error("CartContext: Failed to remove item from cart:", response.message)
      }
    } catch (error) {
      console.error("CartContext: Error removing from cart:", error)
      toast.error("Failed to remove item from cart.")
    }
  }

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }, [cart])

  const getCartItemsCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }, [cart])

  const value = {
    cart,
    loading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getCartItemsCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

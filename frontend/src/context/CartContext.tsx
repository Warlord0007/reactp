"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react"
import axios from "axios"
import { useAuth } from "./AuthContext"

// Define the type for CartItem and Cart
interface CartItem {
  productId: string
  quantity: number
  // Add other product details if needed (e.g., title, price)
}

interface CartType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
}

// Define the context value type
interface CartContextType {
  cart: CartType | null
  loading: boolean
  fetchCart: () => Promise<void>
  addToCart: (productId: string, quantity?: number) => Promise<boolean>
  updateQuantity: (productId: string, newQuantity: number) => Promise<boolean>
  removeItem: (productId: string) => Promise<boolean>
  clearCart: () => Promise<boolean>
}

// Define the props for CartProvider
interface CartProviderProps {
  children: ReactNode
}

// Initialize the context with undefined
const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: CartProviderProps) => {
  const { user, token, loading: authLoading } = useAuth()
  const [cart, setCart] = useState<CartType | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCart = useCallback(async () => {
    if (!user || !token) {
      setCart(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/cart/${user.id}`,
        config
      )
      if (response.data.success) {
        setCart(response.data.cart)
      } else {
        setCart(null)
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [user, token])

  useEffect(() => {
    if (!authLoading) {
      fetchCart()
    }
  }, [authLoading, fetchCart])

  const addToCart = async (
    productId: string,
    quantity: number = 1
  ): Promise<boolean> => {
    if (!user || !token) {
      alert("Please login to add items to cart")
      return false
    }
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/cart`,
        {
          userId: user.id,
          productId,
          quantity,
        },
        config
      )
      if (response.data.success) {
        setCart(response.data.cart)
        return true
      }
      return false
    } catch (error) {
      console.error("Error adding to cart:", error)
      alert("Failed to add to cart")
      return false
    }
  }

  const updateQuantity = async (
    productId: string,
    newQuantity: number
  ): Promise<boolean> => {
    if (!user || !token || newQuantity < 1) return false
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
      const response = await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/cart/${user.id}/${productId}`,
        { quantity: newQuantity },
        config
      )
      if (response.data.success) {
        setCart(response.data.cart)
        return true
      }
      return false
    } catch (error) {
      console.error("Error updating quantity:", error)
      alert("Failed to update quantity")
      return false
    }
  }

  const removeItem = async (productId: string): Promise<boolean> => {
    if (!user || !token) return false
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      const response = await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/api/cart/${user.id}/${productId}`,
        config
      )
      if (response.data.success) {
        setCart(response.data.cart)
        return true
      }
      return false
    } catch (error) {
      console.error("Error removing item:", error)
      alert("Failed to remove item")
      return false
    }
  }

  const clearCart = async (): Promise<boolean> => {
    if (!user || !token) return false
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      const response = await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/api/cart/${user.id}`,
        config
      )
      if (response.data.success) {
        setCart(null)
        return true
      }
      return false
    } catch (error) {
      console.error("Error clearing cart:", error)
      alert("Failed to clear cart")
      return false
    }
  }

  const value: CartContextType = {
    cart,
    loading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// useCart hook
export const useCart = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

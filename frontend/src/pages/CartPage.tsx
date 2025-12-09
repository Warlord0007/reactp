"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Heart, Share2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-toastify"

// Interfaces
interface Product {
  _id: string
  name: string
  price: number
  category: string
  image?: string
  description?: string
  brand?: string
}

interface CartItem {
  _id: string
  product: Product
  quantity: number
}

const CartPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const { cart, loading, fetchCart, updateQuantity, removeFromCart, getCartTotal, getCartItemsCount } = useCart()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())
  const [promoCode, setPromoCode] = useState<string>("")
  const [promoDiscount, setPromoDiscount] = useState<number>(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading) {
      fetchCart()
    }
  }, [authLoading, fetchCart])

  const handleUpdateQuantity = async (productId: string, newQuantity: number): Promise<void> => {
    if (newQuantity < 1) return
    setIsUpdating(productId)
    try {
      await updateQuantity(productId, newQuantity)
      toast.success("Quantity updated successfully")
    } catch (error) {
      toast.error("Failed to update quantity")
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveItem = async (productId: string): Promise<void> => {
    setRemovingItems((prev) => new Set(prev).add(productId))
    try {
      await removeFromCart(productId)
      toast.success("Item removed from cart")
    } catch (error) {
      toast.error("Failed to remove item")
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleApplyPromoCode = (): void => {
    const validCodes: Record<string, number> = {
      SAVE10: 0.1,
      WELCOME20: 0.2,
      STUDENT15: 0.15,
    }
    if (validCodes[promoCode.toUpperCase()]) {
      setPromoDiscount(validCodes[promoCode.toUpperCase()])
      toast.success(`Promo code applied! ${validCodes[promoCode.toUpperCase()] * 100}% discount`)
    } else if (promoCode) {
      toast.error("Invalid promo code")
    }
  }

  const handleCheckout = (): void => {
    if (!user) {
      toast.error("Please login to proceed to checkout")
      navigate("/login")
      return
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty!")
      return
    }
    navigate("/checkout", {
    state: { finalTotal },
  });
  }

  const totalPrice: number = getCartTotal()
  const discountAmount: number = totalPrice * promoDiscount
  const subtotalAfterDiscount: number = totalPrice - discountAmount
  const taxAmount: number = Math.round(subtotalAfterDiscount * 0.13)
  const finalTotal: number = subtotalAfterDiscount + taxAmount
  const totalItems: number = getCartItemsCount()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            to="/products"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
              {totalItems > 0 && (
                <span className="bg-purple-100 text-purple-800 text-lg px-3 py-1 rounded-full font-medium">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <Heart className="w-4 h-4" />
                <span>Save for later</span>
                <span>•</span>
                <Share2 className="w-4 h-4" />
                <span>Share cart</span>
              </div>
            )}
          </div>
        </motion.div>

        {cart.length === 0 ? (
          /* Empty Cart */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="mx-auto w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <div className="space-y-4">
              <Link
                to="/products"
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-white px-8 py-4 rounded-lg font-medium text-lg"
              >
                Start Shopping
              </Link>
              <div className="flex justify-center space-x-6 text-sm text-gray-500">
                <Link to="/products?category=electronics" className="hover:text-purple-600 transition-colors">
                  Electronics
                </Link>
                <Link to="/products?category=clothing" className="hover:text-purple-600 transition-colors">
                  Clothing
                </Link>
                <Link to="/products?category=books" className="hover:text-purple-600 transition-colors">
                  Books
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 space-y-4"
            >
              <AnimatePresence>
                {cart.map((item: CartItem) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
                      removingItems.has(item.product._id) ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex space-x-4">
                      <div className="relative group">
                        <img
                          src={
                            item.product.image
                              ? `http://localhost:5000${item.product.image}`
                              : "/placeholder.svg?height=120&width=120"
                          }
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded-lg group-hover:scale-105 transition-transform"
                          crossOrigin="anonymous"
                        />
                        <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full capitalize">
                          {item.product.category}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{item.product.name}</h3>
                            {item.product.brand && <p className="text-sm text-gray-600">{item.product.brand}</p>}
                            {item.product.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.product.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.product._id)}
                            disabled={removingItems.has(item.product._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors disabled:opacity-50"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isUpdating === item.product._id}
                              className="w-8 h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-medium text-lg min-w-[2rem] text-center">
                              {isUpdating === item.product._id ? (
                                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              ) : (
                                item.quantity
                              )}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                              disabled={isUpdating === item.product._id}
                              className="w-8 h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">
                              Rs{(item.product.price * item.quantity).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">Rs{item.product.price.toLocaleString()} each</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>Rs{totalPrice.toLocaleString()}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({promoDiscount * 100}%)</span>
                      <span>-Rs{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax (13%)</span>
                    <span>Rs{taxAmount.toLocaleString()}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">Rs{finalTotal.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                  <p className="text-xs text-gray-500 text-center">Secure checkout powered by ZIIIP</p>
                </div>
              </div>

              {/* Promo Code */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Promo Code</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter code (try SAVE10)"
                      value={promoCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPromoCode(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                    <button
                      onClick={handleApplyPromoCode}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">Try: SAVE10, WELCOME20, STUDENT15</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage

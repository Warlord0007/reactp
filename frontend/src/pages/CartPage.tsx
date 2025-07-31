"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import { motion } from "framer-motion"
import { toast } from "react-toastify"

const CartPage = () => {
  const { user, loading: authLoading } = useAuth()
  const { cart, loading, fetchCart, updateQuantity, removeFromCart, getCartTotal, getCartItemsCount } = useCart()
  const [isUpdating, setIsUpdating] = useState(null) // Stores itemId being updated
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && user) {
      fetchCart()
    }
  }, [user, authLoading, fetchCart])

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return
    setIsUpdating(itemId)
    await updateQuantity(itemId, newQuantity)
    setIsUpdating(null)
  }

  const handleRemoveItem = async (itemId) => {
    await removeFromCart(itemId)
  }

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please login to proceed to checkout")
      navigate("/login")
      return
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty!")
      return
    }
    navigate("/checkout")
  }

  const totalPrice = getCartTotal()
  const totalItems = getCartItemsCount()

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-center">
        <div>
          <p className="text-lg text-gray-600 mb-4">Please log in to view your cart.</p>
          <Link
            to="/login"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            to="/products"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
            {totalItems > 0 && (
              <span className="bg-gray-100 text-gray-800 text-lg px-3 py-1 rounded-full">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
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
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link
              to="/products"
              className="btn btn-primary btn-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-white px-6 py-3 rounded-lg font-medium"
            >
              Start Shopping
            </Link>
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
              {cart.map((item) => (
                <div key={item._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex space-x-4">
                    <div className="relative">
                      <img
                        src={
                          item.product.images && item.product.images.length > 0
                            ? `http://localhost:5000${item.product.images[0]}`
                            : "/placeholder.svg?height=120&width=120"
                        }
                        alt={item.product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                        crossOrigin="anonymous"
                      />
                      <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                        {item.product.category}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{item.product.name}</h3>
                          <p className="text-sm text-gray-600">{item.product.brand}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating === item._id}
                            className="w-8 h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-medium text-lg min-w-[2rem] text-center">
                            {isUpdating === item._id ? "..." : item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                            disabled={isUpdating === item._id}
                            className="w-8 h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
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
                </div>
              ))}
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>Rs{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (13%)</span>
                    <span>Rs{Math.round(totalPrice * 0.13).toLocaleString()}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">Rs{Math.round(totalPrice * 1.13).toLocaleString()}</span>
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
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                    <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                      Apply
                    </button>
                  </div>
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

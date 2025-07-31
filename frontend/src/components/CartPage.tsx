"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Heart } from "lucide-react"

interface CartItem {
  _id: string
  product: {
    _id: string
    name: string
    price: number
    brand: string
    tag: string
    image: string
  }
  quantity: number
}

interface Cart {
  _id: string
  items: CartItem[]
}

interface RecommendedProduct {
  _id: string
  name: string
  price: number
  brand: string
  tag: string
  image: string
}

const CartPage = () => {
  const [cart, setCart] = useState<Cart | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchCartData()
  }, [])

  const fetchCartData = async () => {
    try {
      const user = localStorage.getItem("user")
      if (!user) {
        setLoading(false)
        return
      }

      const userData = JSON.parse(user)

      // Fetch cart
      const cartResponse = await fetch(`http://localhost:5000/api/cart/${userData.id}`)
      const cartData = await cartResponse.json()
      if (cartData.success) {
        setCart(cartData.cart)
      }

      // Fetch recommendations
      const recsResponse = await fetch(`http://localhost:5000/api/products/recommendations/${userData.id}`)
      const recsData = await recsResponse.json()
      if (recsData.success) {
        setRecommendations(recsData.recommendations)
      }
    } catch (error) {
      console.error("Error fetching cart data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    const user = localStorage.getItem("user")
    if (!user) return

    const userData = JSON.parse(user)
    setIsUpdating(productId)

    try {
      const response = await fetch(`http://localhost:5000/api/cart/${userData.id}/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      })

      const data = await response.json()
      if (data.success) {
        setCart(data.cart)
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
    } finally {
      setIsUpdating(null)
    }
  }

  const removeItem = async (productId: string) => {
    const user = localStorage.getItem("user")
    if (!user) return

    const userData = JSON.parse(user)

    try {
      const response = await fetch(`http://localhost:5000/api/cart/${userData.id}/${productId}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (data.success) {
        setCart(data.cart)
      }
    } catch (error) {
      console.error("Error removing item:", error)
    }
  }

  const addToCart = async (product: RecommendedProduct) => {
    const user = localStorage.getItem("user")
    if (!user) {
      alert("Please login to add items to cart")
      return
    }

    const userData = JSON.parse(user)

    try {
      const response = await fetch("http://localhost:5000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.id,
          productId: product._id,
          quantity: 1,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setCart(data.cart)
        alert(`${product.name} added to cart!`)
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }

  const totalPrice = cart?.items.reduce((total, item) => total + item.product.price * item.quantity, 0) || 0
  const totalItems = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6">
                    <div className="flex space-x-4">
                      <div className="bg-gray-200 h-24 w-24 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                        <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                        <div className="bg-gray-200 h-4 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg p-6 h-fit">
                <div className="space-y-4">
                  <div className="bg-gray-200 h-6 rounded w-1/2"></div>
                  <div className="bg-gray-200 h-4 rounded"></div>
                  <div className="bg-gray-200 h-10 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center text-purple-600 hover:text-purple-500 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
            {totalItems > 0 && (
              <span className="bg-gray-100 text-gray-800 text-lg px-3 py-1 rounded-full">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            )}
          </div>
        </div>

        {!cart || cart.items.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link href="/products">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Start Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div key={item._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex space-x-4">
                    <div className="relative">
                      <img
                        src={`/placeholder.svg?height=120&width=120`}
                        alt={item.product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                        {item.product.tag}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{item.product.name}</h3>
                          <p className="text-sm text-gray-600">{item.product.brand}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating === item.product._id}
                            className="w-8 h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-medium text-lg min-w-[2rem] text-center">
                            {isUpdating === item.product._id ? "..." : item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                            disabled={isUpdating === item.product._id}
                            className="w-8 h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">
                            ₹{(item.product.price * item.quantity).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">₹{item.product.price.toLocaleString()} each</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>₹{Math.round(totalPrice * 0.18).toLocaleString()}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">₹{Math.round(totalPrice * 1.18).toLocaleString()}</span>
                  </div>
                  <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-medium transition-colors">
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center space-x-2 mb-8">
              <Heart className="w-6 h-6" />
              <h2 className="text-2xl font-bold text-gray-900">You might also like</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="relative">
                    <img
                      src={`/placeholder.svg?height=200&width=300`}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      {product.tag}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{product.brand}</p>
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-purple-600">₹{product.price.toLocaleString()}</span>
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage

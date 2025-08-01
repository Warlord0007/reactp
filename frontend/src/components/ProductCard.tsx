"use client"

import { useState } from "react"
import type React from "react"
import { Link } from "react-router-dom"
import { ShoppingCart, Heart, X, Star } from "lucide-react"
import { useCart } from "../context/CartContext"
import { toast } from "react-toastify"

interface Product {
  _id: string
  name: string
  price: number
  brand: string
  tag: string
  image?: string
  description: string
  rating: number
  reviews: number
  stock: number
}

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Use the cart context
  const { addToCart } = useCart()

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation() // Prevent navigation when clicking the button

    if (product.stock === 0) {
      toast.error("Product is out of stock!")
      return
    }

    setIsLoading(true)
    try {
      await addToCart(product._id, 1)
      toast.success(`${product.name} added to cart!`)
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add to cart. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    toast.info("Wishlist functionality coming soon!")
  }

  // Use the single image path
  const productImage = product.image ? `http://localhost:5000${product.image}` : "/placeholder.svg?height=200&width=100"

  const handleImageError = () => {
    setImageError(true)
  }

  const handleModalImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.onerror = null
    target.src = "/placeholder.svg?height=400&width=300"
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowModal(true)
  }

  return (
    <>
      {/* Compact Product Card */}
      <div className="flex-shrink-0 w-[180px] bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group">
        <Link to={`/products/${product._id}`} className="block">
          <div className="relative p-2">
            <div className="w-[100px] h-[120px] mx-auto mb-2 overflow-hidden rounded-md">
              {!imageError && product.image ? (
                <img
                  src={productImage || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">No Image</span>
                </div>
              )}
            </div>
          </div>
        </Link>

        <div className="p-3 text-center">
          <p className="text-xs text-gray-500 mb-1 capitalize">{product.tag}</p>
          <Link to={`/products/${product._id}`}>
            <h3 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-gray-600 mb-2">{product.brand}</p>

          {/* Rating */}
          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-1">
              {product.rating || 0} ({product.reviews || 0})
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-purple-600">Rs{product.price.toLocaleString()}</span>
            <button onClick={handleAddToWishlist} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
          </div>

          {/* Stock indicator */}
          <p className="text-xs text-gray-500 mb-2">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          <div className="flex gap-1">
            <button
              onClick={handleAddToCart}
              disabled={isLoading || product.stock === 0}
              className="flex-1 flex items-center justify-center space-x-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 py-2 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-3 h-3" />
              <span>{isLoading ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}</span>
            </button>
            <button
              onClick={handleQuickView}
              className="px-2 py-2 border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-md text-xs transition-colors"
            >
              Quick View
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Detailed View */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-[700px] h-[400px] flex overflow-hidden relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-[300px] h-full flex-shrink-0 relative">
              <img
                src={productImage || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={handleModalImageError}
              />
            </div>

            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1 capitalize">{product.tag}</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h2>
                <p className="text-sm text-gray-600 mb-3">{product.brand}</p>

                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(product.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    {product.rating || 0} ({product.reviews || 0} reviews)
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.description || "High-quality product with excellent features and durability."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Category:</span>
                    <span className="text-gray-600 ml-2 capitalize">{product.tag}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Stock:</span>
                    <span className={`ml-2 ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                      {product.stock > 0 ? `${product.stock} In Stock` : "Out of Stock"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-purple-600">Rs{product.price.toLocaleString()}</span>
                  <button
                    onClick={handleAddToWishlist}
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Heart className="w-6 h-6 text-gray-400 hover:text-red-500" />
                  </button>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={isLoading || product.stock === 0}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-md font-medium transition-colors disabled:opacity-50"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{isLoading ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}</span>
                  </button>
                  <Link
                    to={`/products/${product._id}`}
                    className="px-6 py-3 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white rounded-md font-medium transition-colors disabled:opacity-50 text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProductCard

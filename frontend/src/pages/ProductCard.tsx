"use client"
import { useState } from "react"
import { Link } from "react-router-dom"
import { ShoppingCart, Heart, X, Star } from "lucide-react"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { toast } from "react-toastify"

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleAddToCart = async (e) => {
    e.preventDefault() // Prevent navigating to product detail page
    if (!user) {
      toast.error("Please login to add items to cart")
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          productId: product._id,
          quantity: 1,
        }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success(`${product.name} added to cart!`)
      } else {
        toast.error("Failed to add to cart")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add to cart")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToWishlist = (e) => {
    e.preventDefault() // Prevent navigating to product detail page
    if (!user) {
      toast.error("Please login to add items to wishlist")
      return
    }
    toast.info("Wishlist functionality coming soon!") // Placeholder for wishlist
  }

  const productImage =
    product.images && product.images.length > 0
      ? `${process.env.REACT_APP_API_BASE_URL}${product.images[0]}`
      : "/placeholder.svg?height=200&width=100"

  return (
    <>
      {/* Compact Product Card */}
      <Link
        to={`/products/${product._id}`}
        className="flex-shrink-0 w-[180px] bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
      >
        <div className="relative p-2">
          <div className="w-[100px] h-[120px] mx-auto mb-2 overflow-hidden rounded-md">
            <img
              src={productImage || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              crossOrigin="anonymous"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = "/placeholder.svg?height=120&width=100"
              }}
            />
          </div>
          {product.isNew && (
            <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">New</span>
          )}
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">{product.category}</p>
          <h3 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(product.rating || 4) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-1">
              {product.rating || 4} ({product.reviews || product.numReviews || 25})
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-purple-600">Rs{product.price.toLocaleString()}</span>
            <button onClick={handleAddToWishlist} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 py-2 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
          >
            <ShoppingCart className="w-3 h-3" />
            <span>{isLoading ? "Adding..." : "Add to Cart"}</span>
          </button>
        </div>
      </Link>

      {/* Modal for Detailed View */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-[700px] h-[400px] flex overflow-hidden relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image Section - Modal */}
            <div className="w-[300px] h-full flex-shrink-0 relative">
              <img
                src={productImage || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = "/placeholder.svg?height=400&width=300"
                }}
              />
              {product.isNew && (
                <span className="absolute top-4 left-4 bg-purple-600 text-white text-sm px-3 py-1 rounded-full font-medium">
                  New
                </span>
              )}
            </div>

            {/* Content Section - Modal */}
            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">{product.category}</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h2>

                {/* Rating - Modal */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(product.rating || 4) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    {product.rating || 4} ({product.reviews || product.numReviews || 25} reviews)
                  </span>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.description ||
                      "High-quality product with excellent features and durability. Perfect for everyday use with modern design and functionality."}
                  </p>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Category:</span>
                    <span className="text-gray-600 ml-2">{product.category || "General"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Stock:</span>
                    <span className="text-green-600 ml-2">{product.stock > 0 ? "In Stock" : "Out of Stock"}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-3xl font-bold text-purple-600">Rs{product.price.toLocaleString()}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-lg text-gray-500 line-through ml-2">
                        Rs{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
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
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-md font-medium transition-colors disabled:opacity-50"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{isLoading ? "Adding..." : "Add to Cart"}</span>
                  </button>
                  <button className="px-6 py-3 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white rounded-md font-medium transition-colors">
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProductCard;

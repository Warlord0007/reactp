"use client"

import { useState } from "react"
import { Heart, ShoppingCart } from "lucide-react"

interface Product {
  _id: string
  name: string
  price: number
  brand: string
  tag: string
  image: string
  description: string
  rating: number
  reviews: number
}

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const addToCart = async () => {
    const user = localStorage.getItem("user")
    if (!user) {
      alert("Please login to add items to cart")
      return
    }

    const userData = JSON.parse(user)
    setIsLoading(true)

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
        alert(`${product.name} added to cart!`)
      } else {
        alert("Failed to add to cart")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      alert("Failed to add to cart")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative">
        <img
          src={`/placeholder.svg?height=250&width=300`}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">{product.tag}</span>
        </div>
        <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
          <Heart className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <div className="mb-2">
          <p className="text-sm text-gray-600">{product.brand}</p>
          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{product.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
        </div>
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-2">
            {product.rating} ({product.reviews})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-purple-600">₹{product.price.toLocaleString()}</span>
          <button
            onClick={addToCart}
            disabled={isLoading}
            className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isLoading ? "Adding..." : "Add to Cart"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

// SVG Icon Components (re-used from ProductPage for consistency)
const HeartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
)

const ShoppingCartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18"
    />
  </svg>
)

interface ProductProps {
  product: {
    _id: string // Changed from id to _id for MongoDB convention
    name: string
    price: number
    brand: string
    tag: string
    image: string
    description: string
    rating: number
    reviews: number
  }
}

export const ProductCard = ({ product }: ProductProps) => {
  const addToCart = (product: ProductProps["product"]) => {
    // TODO: Replace with actual API call to add product to cart in MongoDB
    // Example: await fetch('/api/cart', { method: 'POST', body: JSON.stringify(product) });
    alert(`${product.name} added to cart! (Simulated)`)
  }

  return (
    <div
      key={product._id}
      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group"
    >
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
          <HeartIcon />
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
            onClick={() => addToCart(product)}
            className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <ShoppingCartIcon />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  )
}

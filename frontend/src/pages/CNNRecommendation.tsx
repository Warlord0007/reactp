"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import ProductCard from "../components/ProductCard"
import axios from "axios"

interface Product {
  _id: string
  name: string
  price: number
  category: string
  images?: string[]
  description?: string
  brand?: string
  rating?: number
  reviews?: number
}

interface DebugInfo {
  cartItemsCount: number
  candidateProductsCount: number
  topSimilarityScore: number
  averageSimilarity: number
}

interface EmbeddingInfo {
  product: Product
  embedding: {
    imageEmbeddingDimensions: number
    textEmbeddingDimensions: number
    combinedEmbeddingDimensions: number
    imageEmbeddingPreview: number[]
    textEmbeddingPreview: number[]
    combinedEmbeddingPreview: number[]
    lastUpdated: string
  }
}

const CNNRecommendations = () => {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [similarity, setSimilarity] = useState<number | null>(null)
  const [embeddingInfo, setEmbeddingInfo] = useState<EmbeddingInfo | null>(null)
  const [batchProcessing, setBatchProcessing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchCNNRecommendations()
    }
  }, [user])

  const fetchCNNRecommendations = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:5000/api/cnn-recommendations/${user?._id}?limit=8`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.data.success) {
        setRecommendations(response.data.recommendations)
        setDebugInfo(response.data.debug)
      } else {
        setError("Failed to fetch recommendations")
      }
    } catch (err) {
      console.error("Error fetching CNN recommendations:", err)
      setError("Error loading recommendations")
    } finally {
      setLoading(false)
    }
  }

  const calculateSimilarity = async () => {
    if (selectedProducts.length !== 2) {
      alert("Please select exactly 2 products to compare")
      return
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/cnn-recommendations/similarity/${selectedProducts[0]}/${selectedProducts[1]}`,
      )
      if (response.data.success) {
        setSimilarity(response.data.similarity)
      }
    } catch (err) {
      console.error("Error calculating similarity:", err)
      alert("Error calculating similarity")
    }
  }

  const getEmbeddingInfo = async (productId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/cnn-recommendations/embedding/${productId}`)
      if (response.data.success) {
        setEmbeddingInfo(response.data)
      }
    } catch (err) {
      console.error("Error fetching embedding info:", err)
      alert("Error fetching embedding information")
    }
  }

  const batchGenerateEmbeddings = async () => {
    try {
      setBatchProcessing(true)
      const token = localStorage.getItem("token")
      const response = await axios.post(
        "http://localhost:5000/api/cnn-recommendations/batch-generate",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      if (response.data.success) {
        alert(`Successfully processed ${response.data.processed} products`)
        fetchCNNRecommendations() // Refresh recommendations
      }
    } catch (err) {
      console.error("Error in batch processing:", err)
      alert("Error in batch processing")
    } finally {
      setBatchProcessing(false)
    }
  }

  const handleProductSelect = (productId: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      } else if (prev.length < 2) {
        return [...prev, productId]
      } else {
        return [prev[1], productId] // Replace first with new selection
      }
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600">You need to be logged in to view CNN recommendations</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">CNN-Enhanced Recommendations</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Advanced product recommendations powered by Convolutional Neural Networks, analyzing both visual features
            and textual content using mathematical similarity algorithms.
          </p>
        </div>

        {/* Algorithm Explanation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Image Processing</h3>
              <p className="text-gray-700 mb-4">
                Uses MobileNetV2 CNN to extract 512-dimensional feature vectors from product images:
              </p>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm">f_image = CNN(resize(image, 224×224))</div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-2">Text Processing</h3>
              <p className="text-gray-700 mb-4">
                Extracts 256-dimensional TF-IDF vectors from product names and descriptions:
              </p>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                f_text = TF-IDF(tokenize(name + description))
              </div>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">Combined Embedding</h3>
            <p className="text-gray-700 mb-4">Weighted combination and L2 normalization:</p>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm">
              f_combined = normalize([α × f_image, β × f_text]) where α=0.7, β=0.3
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Enhanced Cosine Similarity</h3>
            <p className="text-gray-700 mb-4">Similarity calculation with confidence scoring:</p>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm">
              similarity = 0.8 × cos(θ) + 0.2 × confidence
              <br />
              where cos(θ) = (A·B) / (||A|| × ||B||)
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <button
                onClick={fetchCNNRecommendations}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh Recommendations"}
              </button>
              {user.role === "admin" && (
                <button
                  onClick={batchGenerateEmbeddings}
                  disabled={batchProcessing}
                  className="ml-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {batchProcessing ? "Processing..." : "Generate All Embeddings"}
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={calculateSimilarity}
                disabled={selectedProducts.length !== 2}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Calculate Similarity
              </button>
              <span className="text-sm text-gray-600">Selected: {selectedProducts.length}/2</span>
            </div>
          </div>
          {similarity !== null && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800">Similarity Score</h4>
              <p className="text-2xl font-bold text-purple-600">{(similarity * 100).toFixed(2)}%</p>
              <p className="text-sm text-purple-700">
                Higher scores indicate more similar products based on visual and textual features
              </p>
            </div>
          )}
        </div>

        {/* Debug Information */}
        {debugInfo && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Algorithm Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{debugInfo.cartItemsCount}</div>
                <div className="text-sm text-gray-600">Cart Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{debugInfo.candidateProductsCount}</div>
                <div className="text-sm text-gray-600">Products Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(debugInfo.topSimilarityScore * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Top Similarity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{(debugInfo.averageSimilarity * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Avg Similarity</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Recommendations Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your CNN-Enhanced Recommendations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommendations.map((product) => (
                <div key={product._id} className="relative">
                  <div
                    className={`border-2 rounded-lg p-2 cursor-pointer transition-all ${
                      selectedProducts.includes(product._id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-transparent hover:border-gray-300"
                    }`}
                    onClick={() => handleProductSelect(product._id)}
                  >
                    <ProductCard product={product} />
                  </div>
                  <button
                    onClick={() => getEmbeddingInfo(product._id)}
                    className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded hover:bg-gray-700"
                  >
                    View Embedding
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Embedding Information Modal */}
        {embeddingInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Embedding Information</h3>
                <button onClick={() => setEmbeddingInfo(null)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Product: {embeddingInfo.product.name}</h4>
                  <p className="text-gray-600">Category: {embeddingInfo.product.category}</p>
                  <p className="text-gray-600">Brand: {embeddingInfo.product.brand}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {embeddingInfo.embedding.imageEmbeddingDimensions}
                    </div>
                    <div className="text-sm text-gray-600">Image Features</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {embeddingInfo.embedding.textEmbeddingDimensions}
                    </div>
                    <div className="text-sm text-gray-600">Text Features</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">
                      {embeddingInfo.embedding.combinedEmbeddingDimensions}
                    </div>
                    <div className="text-sm text-gray-600">Combined Features</div>
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">Sample Feature Values:</h5>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    Image: [{embeddingInfo.embedding.imageEmbeddingPreview.map((v: number) => v.toFixed(3)).join(", ")}
                    ...]
                    <br />
                    Text: [{embeddingInfo.embedding.textEmbeddingPreview.map((v: number) => v.toFixed(3)).join(", ")}
                    ...]
                    <br />
                    Combined: [
                    {embeddingInfo.embedding.combinedEmbeddingPreview.map((v: number) => v.toFixed(3)).join(", ")}
                    ...]
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Last Updated: {new Date(embeddingInfo.embedding.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CNNRecommendations

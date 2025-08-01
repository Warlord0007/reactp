// Frontend API service - makes requests to your backend
import axios, { type AxiosResponse, type AxiosError } from "axios"

// Ensure your API_BASE_URL is correctly configured for your environment.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

// API endpoints - Updated to match your existing backend routes
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  VERIFY_TOKEN: `${API_BASE_URL}/auth/verify`,

  // Product endpoints
  PRODUCTS: `${API_BASE_URL}/products`,
  PRODUCT_BY_ID: (id: string) => `${API_BASE_URL}/products/${id}`,
  FILTER_OPTIONS: `${API_BASE_URL}/products/filter-options`,

  // Cart endpoints - Updated to match your existing backend
  CART: (userId: string) => `${API_BASE_URL}/cart/${userId}`,
  ADD_TO_CART: `${API_BASE_URL}/cart`, // Updated to match your backend POST /
  UPDATE_CART_ITEM: (userId: string, productId: string) => `${API_BASE_URL}/cart/${userId}/${productId}`, // Updated
  REMOVE_FROM_CART: (userId: string, productId: string) => `${API_BASE_URL}/cart/${userId}/${productId}`, // Updated

  // CNN Recommendation endpoints
  CNN_RECOMMENDATIONS: (userId: string, params: Record<string, any> = {}) =>
    `${API_BASE_URL}/cnn-recommendations/${userId}?${new URLSearchParams(params).toString()}`,
  TRACK_INTERACTION: `${API_BASE_URL}/cnn-recommendations/track-interaction`,
  CNN_SERVICE_STATUS: `${API_BASE_URL}/cnn-recommendations/service-status`,
  CNN_BATCH_GENERATE: `${API_BASE_URL}/cnn-recommendations/batch-generate`,
  CNN_SIMILARITY: (productId1: string, productId2: string) =>
    `${API_BASE_URL}/cnn-recommendations/similarity/${productId1}/${productId2}`,
  CNN_EMBEDDING: (productId: string) => `${API_BASE_URL}/cnn-recommendations/embedding/${productId}`,
  CNN_INITIALIZE: `${API_BASE_URL}/cnn-recommendations/initialize`,
  CNN_ANALYTICS: (userId: string) => `${API_BASE_URL}/cnn-recommendations/analytics/${userId}`,

  // Health check
  HEALTH: `${API_BASE_URL}/health`,
}

// Interfaces for type safety
interface User {
  _id: string
  name?: string
  email: string
  role?: string
}

interface Product {
  _id: string
  name: string
  price: number
  category: string
  images: string[]
  description?: string
  brand?: string
  tag?: string
  rating?: number
  reviews?: number
  stock?: number
}

interface CartItem {
  _id: string
  product: Product
  quantity: number
}

interface Cart {
  _id: string
  user: string
  items: CartItem[]
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  totalProducts: number
  totalPages: number
  currentPage: number
  limit: number
}

interface RecommendationData {
  recommendations: Product[]
  method: string
  confidence: number
  debug?: {
    cartItemsCount: number
    averageSimilarity: number
    diversityScore: number
    topCategories: Array<{ category: string; count: number }>
  }
  serviceStatus?: any
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  user?: User
  token?: string
  cart?: Cart
  products?: Product[]
  recommendations?: Product[]
  status?: any
  serviceStatus?: any
  pagination?: PaginationInfo
  requestId?: string
  timestamp?: string
  options?: any
}

// Create axios instance
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor - adds auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

// Response interceptor - handles auth errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      console.warn("Authentication expired")
    }
    return Promise.reject(error)
  },
)

// API service methods
export const apiService = {
  // Health check
  async checkHealth(): Promise<ApiResponse> {
    const response = await apiClient.get(API_ENDPOINTS.HEALTH)
    return response.data
  },

  // Auth methods
  async login(credentials: { email: string; password: string }): Promise<ApiResponse> {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials)
    return response.data
  },

  async register(userData: {
    name?: string
    email: string
    password: string
  }): Promise<ApiResponse> {
    const response = await apiClient.post(API_ENDPOINTS.REGISTER, userData)
    return response.data
  },

  async logout(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGOUT)
      return response.data
    } catch (error) {
      return { success: true, message: "Logged out locally" }
    } finally {
      localStorage.removeItem("token")
    }
  },

  async verifyToken(): Promise<ApiResponse> {
    const response = await apiClient.get(API_ENDPOINTS.VERIFY_TOKEN)
    return response.data
  },

  // Product methods
  async getProducts(
    params: Record<string, any> = {},
  ): Promise<ApiResponse<{ products: Product[]; pagination: PaginationInfo }>> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS, { params })
    return response.data
  },

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCT_BY_ID(id))
    return response.data
  },

  async getFilterOptions(): Promise<ApiResponse<{ tags: string[]; categories: string[]; brands: string[] }>> {
    const response = await apiClient.get(API_ENDPOINTS.FILTER_OPTIONS)
    return response.data
  },

  // Cart methods - Updated to match your existing backend
  async getCart(userId: string): Promise<ApiResponse<Cart>> {
    const response = await apiClient.get(API_ENDPOINTS.CART(userId))
    return response.data
  },

  async addToCart(userId: string, productId: string, quantity = 1): Promise<ApiResponse> {
    const response = await apiClient.post(API_ENDPOINTS.ADD_TO_CART, {
      userId,
      productId,
      quantity,
    })
    return response.data
  },

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<ApiResponse> {
    const response = await apiClient.put(API_ENDPOINTS.UPDATE_CART_ITEM(userId, productId), {
      quantity,
    })
    return response.data
  },

  async removeFromCart(userId: string, productId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(API_ENDPOINTS.REMOVE_FROM_CART(userId, productId))
    return response.data
  },

  // CNN Recommendation methods
  async getCNNRecommendations(
    userId: string,
    params: Record<string, any> = {},
  ): Promise<ApiResponse<RecommendationData>> {
    const response = await apiClient.get(API_ENDPOINTS.CNN_RECOMMENDATIONS(userId, params))
    return response.data
  },

  async trackInteraction(interactionData: {
    productId: string
    type: string
    metadata?: Record<string, any>
  }): Promise<ApiResponse> {
    const response = await apiClient.post(API_ENDPOINTS.TRACK_INTERACTION, interactionData)
    return response.data
  },

  async getCNNServiceStatus(): Promise<ApiResponse> {
    const response = await apiClient.get(API_ENDPOINTS.CNN_SERVICE_STATUS)
    return response.data
  },

  async batchGenerateEmbeddings(): Promise<ApiResponse> {
    const response = await apiClient.post(API_ENDPOINTS.CNN_BATCH_GENERATE)
    return response.data
  },

  async getProductSimilarity(productId1: string, productId2: string, metric?: string): Promise<ApiResponse> {
    const params = metric ? { metric } : {}
    const response = await apiClient.get(API_ENDPOINTS.CNN_SIMILARITY(productId1, productId2), { params })
    return response.data
  },

  async getProductEmbedding(productId: string, includeFullEmbedding?: boolean): Promise<ApiResponse> {
    const params = includeFullEmbedding ? { full: "true" } : {}
    const response = await apiClient.get(API_ENDPOINTS.CNN_EMBEDDING(productId), { params })
    return response.data
  },

  async initializeCNNService(): Promise<ApiResponse> {
    const response = await apiClient.post(API_ENDPOINTS.CNN_INITIALIZE)
    return response.data
  },

  async getUserAnalytics(userId: string, days?: number): Promise<ApiResponse> {
    const params = days ? { days } : {}
    const response = await apiClient.get(API_ENDPOINTS.CNN_ANALYTICS(userId), { params })
    return response.data
  },
}

export default apiService

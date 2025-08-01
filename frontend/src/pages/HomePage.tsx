"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import ProductCard from "../components/ProductCard"
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Star,
  TrendingUp,
  Sparkles,
  Heart,
  ArrowRight,
  Gift,
  Brain,
  Target,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import { toast } from "react-toastify"
import { apiService } from "../services/apiService"
import styles from "./HomePage.module.scss"

interface Product {
  _id: string
  name: string
  price: number
  image?: string
  category: string
  brand: string
  tag: string
  rating: number
  reviews: number
  stock: number
  description: string
}

interface Category {
  name: string
  image: string
  count: number
  gradient: string
}

interface CNNRecommendationData {
  success: boolean
  recommendations: Product[]
  method: string
  confidence: number
  serviceStatus?: any
  debug?: {
    cartItemsCount: number
    candidateProductsCount: number
    averageSimilarity: number
    diversityScore: number
    topCategories: Array<{ category: string; count: number }>
  }
}

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cnnRecommendations, setCnnRecommendations] = useState<Product[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cnnLoading, setCnnLoading] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [cnnRecommendationData, setCnnRecommendationData] = useState<CNNRecommendationData | null>(null)

  const { user, loading: authLoading } = useAuth()
  const { addToCart, fetchCart, cart, getCartItemsCount } = useCart()

  const heroSlides = [
    {
      title: "AI-Powered Fashion Discovery",
      subtitle: "Experience personalized shopping with our advanced CNN recommendation engine",
      image: "/placeholder.svg?height=600&width=1200&text=AI+Fashion+Discovery",
      cta: "Discover Now",
      link: "/products",
      gradient: "from-purple-600 via-pink-600 to-red-500",
    },
    {
      title: "Smart CNN Recommendations",
      subtitle: "Get product suggestions tailored using deep learning and visual similarity",
      image: "/placeholder.svg?height=600&width=1200&text=Smart+CNN+Recommendations",
      cta: "Shop Smart",
      link: "/products?sort=recommended",
      gradient: "from-blue-600 via-purple-600 to-pink-500",
    },
    {
      title: "Trending Now",
      subtitle: "Discover what's hot and trending in fashion right now",
      image: "/placeholder.svg?height=600&width=1200&text=Trending+Fashion",
      cta: "See Trends",
      link: "/products?sort=trending",
      gradient: "from-green-500 via-teal-500 to-blue-500",
    },
  ]

  const categoryGradients = [
    "from-pink-500 to-rose-500",
    "from-purple-500 to-indigo-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-yellow-500 to-orange-500",
    "from-red-500 to-pink-500",
    "from-indigo-500 to-purple-500",
    "from-teal-500 to-green-500",
  ]

  // Fetch CNN Recommendations
  const fetchCNNRecommendations = useCallback(async () => {
    if (!user?._id || authLoading) {
      setCnnRecommendations([])
      setCnnRecommendationData(null)
      return
    }

    try {
      setCnnLoading(true)
      console.log("Fetching CNN recommendations for user:", user._id)
      console.log("Current cart items:", getCartItemsCount())

      const response = await apiService.getCNNRecommendations(user._id, {
        limit: 8,
        diversityFactor: 0.4,
        similarityThreshold: 0.2,
        includeViewed: false,
      })

      console.log("CNN Recommendation response:", response)

      if (response.success && response.data?.recommendations) {
        setCnnRecommendations(response.data.recommendations)
        setCnnRecommendationData({
          success: response.success,
          recommendations: response.data.recommendations,
          method: response.data.method,
          confidence: response.data.confidence,
          debug: response.data.debug,
        })

        // Track recommendation request
        try {
          await apiService.trackInteraction({
            productId: cart?.items?.[0]?.product?._id || "homepage",
            type: "view_recommendations",
            metadata: {
              source: "homepage_cnn_recommendations",
              cartItemsCount: getCartItemsCount(),
              recommendationMethod: response.data.method,
              confidence: response.data.confidence,
            },
          })
        } catch (trackError) {
          console.warn("Failed to track recommendation view:", trackError)
        }
      } else {
        console.warn("No CNN recommendations received:", response)
        console.log("Response structure:", JSON.stringify(response, null, 2))
        setCnnRecommendations([])
        setCnnRecommendationData(null)
      }
    } catch (err) {
      console.error("CNN Recommendation error:", err)
      setCnnRecommendations([])
      setCnnRecommendationData(null)

      // Fallback to featured products if CNN fails
      try {
        const fallbackRes = await apiService.getProducts({
          limit: 8,
          sortBy: "rating",
          order: "-1",
        })
        if (fallbackRes.success && fallbackRes.products) {
          setCnnRecommendations(fallbackRes.products.slice(0, 8))
          setCnnRecommendationData({
            success: true,
            recommendations: fallbackRes.products.slice(0, 8),
            method: "fallback_featured",
            confidence: 0.3,
          })
        }
      } catch (fallbackErr) {
        console.error("Fallback recommendation error:", fallbackErr)
      }
    } finally {
      setCnnLoading(false)
    }
  }, [user, authLoading, cart, getCartItemsCount])

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch Featured Products
      const featuredResponse = await apiService.getProducts({ isFeatured: "true", limit: "8" })
      if (featuredResponse.success && featuredResponse.products) {
        setFeaturedProducts(featuredResponse.products)
      }

      // Fetch New Arrivals
      const newArrivalsResponse = await apiService.getProducts({ sortBy: "createdAt", order: "-1", limit: "6" })
      if (newArrivalsResponse.success && newArrivalsResponse.products) {
        setNewArrivals(newArrivalsResponse.products)
      }

      // Fetch Trending Products
      const trendingResponse = await apiService.getProducts({ sortBy: "rating", order: "-1", limit: "6" })
      if (trendingResponse.success && trendingResponse.products) {
        setTrendingProducts(trendingResponse.products)
      }

      // Fetch Categories
      const filterOptionsResponse = await apiService.getFilterOptions()
      if (filterOptionsResponse.success && filterOptionsResponse.tags) {
        const categoryPromises = filterOptionsResponse.tags.slice(0, 8).map(async (tag: string, index: number) => {
          const countResponse = await apiService.getProducts({ tag })
          const count = countResponse.pagination?.totalProducts || countResponse.products?.length || 0
          return {
            name: tag.charAt(0).toUpperCase() + tag.slice(1),
            image: `/placeholder.svg?height=300&width=300&text=${tag.charAt(0).toUpperCase() + tag.slice(1)}`,
            count: count,
            gradient: categoryGradients[index % categoryGradients.length],
          }
        })
        const fetchedCategories = await Promise.all(categoryPromises)
        setCategories(fetchedCategories.filter((cat) => cat.count > 0))
      } else {
        // Fallback categories
        setCategories([
          {
            name: "Sneakers",
            image: "/placeholder.svg?height=300&width=300&text=Sneakers",
            count: 0,
            gradient: "from-pink-500 to-rose-500",
          },
          {
            name: "T-Shirts",
            image: "/placeholder.svg?height=300&width=300&text=T-Shirts",
            count: 0,
            gradient: "from-purple-500 to-indigo-500",
          },
          {
            name: "Hoodies",
            image: "/placeholder.svg?height=300&width=300&text=Hoodies",
            count: 0,
            gradient: "from-blue-500 to-cyan-500",
          },
          {
            name: "Jackets",
            image: "/placeholder.svg?height=300&width=300&text=Jackets",
            count: 0,
            gradient: "from-green-500 to-emerald-500",
          },
        ])
      }
    } catch (err) {
      console.error("Home data fetch error:", err)
      toast.error("Failed to load homepage data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHomeData()
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [fetchHomeData, heroSlides.length])

  // Fetch CNN recommendations when cart changes or user logs in
  useEffect(() => {
    if (!authLoading && user) {
      const timeoutId = setTimeout(() => {
        fetchCNNRecommendations()
      }, 1000) // Debounce to avoid too many requests
      return () => clearTimeout(timeoutId)
    }
  }, [fetchCNNRecommendations, authLoading, user, cart])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)

  const handleAddToCartFromCNN = async (product: Product) => {
    console.log("HomePage: Adding to cart from CNN recommendations. Current user:", user)
    if (!user) {
      toast.error("Please login to add items to cart")
      return
    }

    try {
      await addToCart(product._id, 1)
      toast.success(`${product.name} added to cart!`)

      // Track the interaction
      try {
        await apiService.trackInteraction({
          productId: product._id,
          type: "add_to_cart",
          metadata: {
            source: "homepage_cnn_recommendations",
            recommendationMethod: cnnRecommendationData?.method,
            confidence: cnnRecommendationData?.confidence,
            cartItemsBefore: getCartItemsCount() - 1,
          },
        })
      } catch (trackError) {
        console.warn("Failed to track cart addition:", trackError)
      }

      // Refresh CNN recommendations after adding to cart (real-time update)
      setTimeout(() => {
        fetchCNNRecommendations()
      }, 1500)
    } catch (err) {
      console.error("Add to cart error:", err)
      toast.error("Failed to add item to cart.")
    }
  }

  const handleProductView = async (productId: string) => {
    if (!user) return
    try {
      await apiService.trackInteraction({
        productId,
        type: "view",
        metadata: {
          source: "homepage",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (err) {
      console.error("Track view error:", err)
    }
  }

  if (loading) {
    return (
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner}></div>
        <p className={styles.spinnerMessage}>Loading your personalized experience...</p>
      </div>
    )
  }

  return (
    <div className={styles.homeWrapper}>
      {/* Enhanced Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroSlider}>
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`${styles.heroSlide} ${index === currentSlide ? styles.active : ""}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className={`${styles.heroOverlay} bg-gradient-to-r ${slide.gradient}`}>
                <div className={styles.heroContent}>
                  <div className={styles.heroIcon}>
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h1 className={styles.heroTitle}>{slide.title}</h1>
                  <p className={styles.heroSubtitle}>{slide.subtitle}</p>
                  <Link to={slide.link} className={styles.ctaButton}>
                    <span>{slide.cta}</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={prevSlide} className={`${styles.navButton} ${styles.left}`} aria-label="Previous slide">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={nextSlide} className={`${styles.navButton} ${styles.right}`} aria-label="Next slide">
          <ChevronRight className="w-6 h-6" />
        </button>
        <div className={styles.slideIndicators}>
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`${styles.slideIndicator} ${index === currentSlide ? styles.active : ""}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <div className={styles.sectionContainer}>
        {/* CNN-Powered Recommendations Section - Above Featured Products */}
        {user && (cnnRecommendations.length > 0 || cnnLoading) && (
          <section className={`${styles.section} ${styles.cnnRecommendationSection}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrapper}>
                <div className={styles.sectionIcon}>
                  <Brain className="w-6 h-6" />
                </div>
                <h2 className={styles.sectionTitle}>
                  CNN-Powered Recommendations
                  <span className={styles.sectionBadge}>
                    <Target className="w-4 h-4" />
                    AI
                  </span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Personalized suggestions based on visual similarity and your cart items
                </p>
              </div>
              {cnnRecommendationData && (
                <div className={styles.cnnStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Confidence</span>
                    <span className={styles.statValue}>
                      {Math.round((cnnRecommendationData.confidence || 0) * 100)}%
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Method</span>
                    <span className={styles.statValue}>
                      {cnnRecommendationData.method?.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  {cnnRecommendationData.debug && (
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Diversity</span>
                      <span className={styles.statValue}>
                        {Math.round((cnnRecommendationData.debug.diversityScore || 0) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {cnnLoading ? (
              <div className={styles.cnnLoading}>
                <div className={styles.loadingSpinner}></div>
                <p>Analyzing your preferences with CNN...</p>
                <div className={styles.loadingDetails}>
                  <span>Processing visual features and cart similarity</span>
                </div>
              </div>
            ) : (
              <div className={styles.cnnRecommendationGrid}>
                {cnnRecommendations.map((product, index) => (
                  <div key={product._id} className={styles.cnnRecommendationCard}>
                    <div className={styles.cnnRecommendationBadge}>
                      <Brain className="w-3 h-3" />
                      <span>#{index + 1}</span>
                    </div>
                    <div onClick={() => handleProductView(product._id)}>
                      <ProductCard product={product} />
                    </div>
                    <div className={styles.cnnRecommendationActions}>
                      <button onClick={() => handleAddToCartFromCNN(product)} className={styles.cnnQuickAddButton}>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Quick Add</span>
                      </button>
                      <button className={styles.wishlistButton}>
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CNN Debug Information (for development) */}
            {cnnRecommendationData?.debug && process.env.NODE_ENV === "development" && (
              <div className={styles.cnnDebugInfo}>
                <h4>CNN Debug Info:</h4>
                <div className={styles.debugGrid}>
                  <div>Cart Items: {cnnRecommendationData.debug.cartItemsCount}</div>
                  <div>Candidates: {cnnRecommendationData.debug.candidateProductsCount}</div>
                  <div>Avg Similarity: {(cnnRecommendationData.debug.averageSimilarity * 100).toFixed(1)}%</div>
                  <div>
                    Top Categories: {cnnRecommendationData.debug.topCategories?.map((c) => c.category).join(", ")}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Enhanced Categories Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionIcon}>
                <Gift className="w-6 h-6" />
              </div>
              <h2 className={styles.sectionTitle}>Shop by Category</h2>
            </div>
          </div>
          {categories.length > 0 ? (
            <div className={styles.categoryGrid}>
              {categories.map((cat, index) => (
                <Link key={cat.name} to={`/products?tag=${cat.name.toLowerCase()}`} className={styles.categoryCard}>
                  <div className={styles.categoryImageWrapper}>
                    <img src={cat.image || "/placeholder.svg"} alt={cat.name} className={styles.categoryImage} />
                    <div className={`${styles.categoryOverlay} bg-gradient-to-t ${cat.gradient}`} />
                  </div>
                  <div className={styles.categoryContent}>
                    <h3 className={styles.categoryTitle}>{cat.name}</h3>
                    <p className={styles.categoryCount}>{cat.count} items</p>
                    <div className={styles.categoryArrow}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.noResults}>No categories available.</p>
          )}
        </section>

        {/* Featured Products */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionIcon}>
                <Star className="w-6 h-6" />
              </div>
              <h2 className={styles.sectionTitle}>Featured Products</h2>
            </div>
            <Link to="/products?featured=true" className={styles.viewAllButton}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {featuredProducts.length > 0 ? (
            <div className={styles.productGrid}>
              {featuredProducts.map((product) => (
                <div key={product._id} onClick={() => handleProductView(product._id)}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noResults}>No featured products available.</p>
          )}
        </section>

        {/* Trending Products */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionIcon}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <h2 className={styles.sectionTitle}>Trending Now</h2>
            </div>
            <Link to="/products?sort=trending" className={styles.viewAllButton}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {trendingProducts.length > 0 ? (
            <div className={styles.trendingGrid}>
              {trendingProducts.map((product, index) => (
                <div key={product._id} className={styles.trendingCard}>
                  <div className={styles.trendingRank}>#{index + 1}</div>
                  <div onClick={() => handleProductView(product._id)}>
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noResults}>No trending products available.</p>
          )}
        </section>

        {/* New Arrivals */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionIcon}>
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className={styles.sectionTitle}>New Arrivals</h2>
            </div>
            <Link to="/products?sort=newest" className={styles.viewAllButton}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {newArrivals.length > 0 ? (
            <div className={styles.newArrivalsGrid}>
              {newArrivals.map((product) => (
                <div key={product._id} onClick={() => handleProductView(product._id)}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noResults}>No new arrivals at the moment.</p>
          )}
        </section>
      </div>
    </div>
  )
}

export default Home

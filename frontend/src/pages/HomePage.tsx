"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import ProductCard from "./ProductCard"
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import { toast } from "react-toastify"
import styles from "./HomePage.module.scss"

type Product = {
  _id: string
  name: string
  price: number
  image: string
  category: string
}

type Category = {
  name: string
  image: string
  count: number
}

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  const { user, loading: authLoading } = useAuth()
  const { cart, fetchCart } = useCart()

  const heroSlides = [
    {
      title: "Summer Collection 2024",
      subtitle: "Discover the latest trends in summer fashion",
      image: "/placeholder.svg?height=600&width=800",
      cta: "Shop Collection",
      link: "/products?category=summer",
    },
    {
      title: "New Arrivals",
      subtitle: "Be the first to get our newest products",
      image: "/placeholder.svg?height=600&width=800",
      cta: "Shop Now",
      link: "/products?sort=newest",
    },
    {
      title: "Special Offers",
      subtitle: "Up to 50% off on selected items",
      image: "/placeholder.svg?height=600&width=800",
      cta: "View Offers",
      link: "/products?discount=true",
    },
  ]

  const sampleCategories: Category[] = [
    { name: "Sneakers", image: "/placeholder.svg?height=300&width=300", count: 42 },
    { name: "T-Shirts", image: "/placeholder.svg?height=300&width=300", count: 38 },
    { name: "Hoodies", image: "/placeholder.svg?height=300&width=300", count: 24 },
    { name: "Jackets", image: "/placeholder.svg?height=300&width=300", count: 16 },
  ]

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true)
      const featured = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/products?featured=true&limit=8`)
      if (featured.data.products) setFeaturedProducts(featured.data.products)

      const arrivals = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/products?sort=newest&limit=4`)
      if (arrivals.data.products) setNewArrivals(arrivals.data.products)

      setCategories(sampleCategories)
    } catch (err) {
      console.error("Home fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRecommendations = useCallback(async () => {
    if (!user || authLoading) {
      setRecommendations([])
      return
    }
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/products/recommendations/${user.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )
      if (res.data.success) setRecommendations(res.data.recommendations)
    } catch (err) {
      console.error("Recommendation error:", err)
    }
  }, [user, authLoading])

  useEffect(() => {
    fetchHomeData()
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchHomeData])

  useEffect(() => {
    fetchRecommendations()
  }, [user, cart, fetchRecommendations])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)

  const handleAddToCartFromRecs = async (product: Product) => {
    if (!user) {
      toast.error("Please login to add items to cart")
      return
    }
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/cart`,
        {
          userId: user.id,
          productId: product._id,
          quantity: 1,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      )
      if (res.data.success) {
        fetchCart()
        toast.success(`${product.name} added to cart!`)
      } else {
        toast.error(res.data.message || "Failed to add item to cart.")
      }
    } catch (err) {
      toast.error("Failed to add item to cart.")
    }
  }

  if (loading) {
    return (
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner}></div>
      </div>
    )
  }

  return (
    <div className={styles.homeWrapper}>
      <div className={styles.hero}>
        <button onClick={prevSlide} className={styles.navButton}>
          <ChevronLeft />
        </button>
        <div className={styles.slide}>
          <h2>{heroSlides[currentSlide].title}</h2>
          <p>{heroSlides[currentSlide].subtitle}</p>
          <Link to={heroSlides[currentSlide].link} className={styles.ctaButton}>
            {heroSlides[currentSlide].cta}
          </Link>
        </div>
        <button onClick={nextSlide} className={styles.navButton}>
          <ChevronRight />
        </button>
      </div>

      <section className={styles.section}>
        <h2>Featured Products</h2>
        <div className={styles.grid}>
          {featuredProducts.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Categories</h2>
        <div className={styles.grid}>
          {categories.map((cat) => (
            <div key={cat.name} className={styles.categoryCard}>
              <img src={cat.image} alt={cat.name} />
              <h3>{cat.name}</h3>
              <p>{cat.count} items</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>New Arrivals</h2>
        <div className={styles.grid}>
          {newArrivals.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </section>

      {user && recommendations.length > 0 && (
        <section className={styles.section}>
          <h2>Recommended For You</h2>
          <div className={styles.grid}>
            {recommendations.map((p) => (
              <div key={p._id} className={styles.recommendationCard}>
                <ProductCard product={p} />
                <button onClick={() => handleAddToCartFromRecs(p)} className={styles.addToCartButton}>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Home

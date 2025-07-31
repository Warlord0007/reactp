"use client"
import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import Homepage from "./pages/HomePage"
import ProductPage from "./pages/ProductPage"
import AdminPage from "./pages/AdminPage"
import CartPage from "./pages/CartPage"
import ProfileSettings from "./pages/ProfileSettings"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"

const About = () => (
  <div className="min-h-screen bg-gray-50 pt-20 pb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About ZIIIP</h1>
        <p className="text-xl text-gray-600">Your premier destination for fashion and style</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-8">
        <p className="text-gray-700 leading-relaxed">
          Welcome to ZIIIP, where fashion meets innovation. We are dedicated to providing you with the latest trends and
          timeless classics that define your unique style. Our carefully curated collection ensures that you always look
          your best, whether you're dressing for work, play, or special occasions.
        </p>
      </div>
    </div>
  </div>
)

// Placeholder pages for footer links
const Coupons = () => (
  <div className="min-h-screen bg-gray-50 pt-20 pb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Coupons & Offers</h1>
      <p className="text-gray-600">Check back soon for amazing deals and discounts!</p>
    </div>
  </div>
)

const Blog = () => (
  <div className="min-h-screen bg-gray-50 pt-20 pb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog</h1>
      <p className="text-gray-600">Fashion tips, trends, and style guides coming soon!</p>
    </div>
  </div>
)

const Community = () => (
  <div className="min-h-screen bg-gray-50 pt-20 pb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Community</h1>
      <p className="text-gray-600">Join our fashion community and connect with style enthusiasts!</p>
    </div>
  </div>
)

const SizeGuide = () => (
  <div className="min-h-screen bg-gray-50 pt-20 pb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Size Guide</h1>
      <p className="text-gray-600">Find your perfect fit with our comprehensive size guide!</p>
    </div>
  </div>
)

const Shipping = () => (
  <div className="min-h-screen bg-gray-50 pt-20 pb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Shipping Information</h1>
      <p className="text-gray-600">Learn about our shipping policies and delivery options!</p>
    </div>
  </div>
)

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-gray-50 pt-20 pb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
      <p className="text-gray-600">Your privacy is important to us. Learn how we protect your data.</p>
    </div>
  </div>
)

const TermsOfService = () => (
  <div className="min-h-screen bg-gray-50 pt-20 pb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
      <p className="text-gray-600">Read our terms and conditions for using ZIIIP services.</p>
    </div>
  </div>
)

const CookiePolicy = () => (
  <div className="min-h-screen bg-gray-50 pt-20 pb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
      <p className="text-gray-600">Learn about how we use cookies to improve your experience.</p>
    </div>
  </div>
)

const ReturnPolicy = () => (
  <div className="min-h-screen bg-gray-50 pt-20 pb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Return Policy</h1>
      <p className="text-gray-600">Easy returns and exchanges. Your satisfaction is guaranteed!</p>
    </div>
  </div>
)

interface User {
  fullName: string
  email?: string
  role?: string
}

const App = () => {
  // Initialize user and cartItemCount to null/0, data will come from backend
  const [user, setUser] = useState<User | null>(null)
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    // Simulate getting user from localStorage or API after login
    const loggedInFullName = localStorage.getItem("fullName")
    const userEmail = localStorage.getItem("userEmail")
    const userRole = localStorage.getItem("userRole")
    if (loggedInFullName) {
      setUser({
        fullName: loggedInFullName,
        email: userEmail || undefined,
        role: userRole || "user",
      })
    }
    // Simulate getting cart count
    const savedCartCount = localStorage.getItem("cartCount")
    if (savedCartCount) {
      setCartItemCount(Number.parseInt(savedCartCount, 10))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("fullName")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userRole")
    localStorage.removeItem("cartCount")
    setUser(null)
    setCartItemCount(0)
    // Redirect to homepage after logout
    window.location.href = "/"
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem("fullName", updatedUser.fullName)
    if (updatedUser.email) {
      localStorage.setItem("userEmail", updatedUser.email)
    }
    if (updatedUser.role) {
      localStorage.setItem("userRole", updatedUser.role)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} cartItemCount={cartItemCount} onLogout={handleLogout} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/cart" element={<CartPage />} />
          {/* Footer Link Routes */}
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/community" element={<Community />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App

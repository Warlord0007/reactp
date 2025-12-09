import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { CartProvider } from "./context/CartContext"
import Navbar from "./components/Navbar" // Corrected path to components/Navbar
import HomePage from "./pages/HomePage" // Corrected path to pages/HomePage
import "react-toastify/dist/ReactToastify.css"
import ProductPage from "./pages/ProductPage"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import AdminPage from "./pages/AdminPage"
import About from "./pages/AboutPage" // Corrected path to pages/About
import CartPage from "./pages/CartPage"
import ProfileSettings from "./pages/ProfileSettings"
import Footer from "./components/Footer" // Corrected path to components/Footer
import Checkout from "./pages/Checkout"

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div>
          <Navbar />
          <main className="pt-16 flex-1">
            {/* Add padding-top to account for fixed navbar */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/profile-settings" element={<ProfileSettings />} />
              <Route path="/checkout" element={<Checkout />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  )
}

export default App

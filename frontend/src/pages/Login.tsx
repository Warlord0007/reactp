"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Lock, Eye, EyeOff } from "lucide-react"
import "./Login.scss"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        alert("Login successful!")

        navigate(data.user.role === "admin" ? "/admin" : "/")
      } else {
        setError(data.message || "Login failed. Please try again.")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Network error. Please check if the server is running.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="login-container">
      <div className="logo-container">
        <div className="logo-box">
          <span className="logo-text">Z</span>
        </div>
      </div>
      <h2 className="heading">Sign In To Your Account</h2>
      <p className="text-center text-sm text-gray-600 mt-2">
        Or{" "}
        <Link to="/register" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
          create a new account
        </Link>
      </p>

      <div className="form-wrapper">
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address:</label>
            <div className="input-wrapper">
              <div className="icon">
                <User className="w-5 h-5" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <div className="input-wrapper">
              <div className="icon">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
              <div
                className="eye-icon"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
            </div>
          </div>

          <div className="options">
            <Link to="/forgot-password" className="forgot-password">
              Forgot Your Password?
            </Link>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <div className="demo-credentials">
            Admin User: email: "admin@gmail.com", password: "admin123"
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login

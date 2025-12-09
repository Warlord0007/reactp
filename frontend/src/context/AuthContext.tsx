"use client"
import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { apiService } from "../services/apiService"
import { toast } from "react-toastify"

// Interfaces
interface User {
  _id: string
  name?: string // Updated from name: string to name?: string
  email: string
  role?: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  name?: string // Updated from name: string to name?: string
  email: string
  password: string
  confirmPassword?: string
}

interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  message?: string
  error?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<AuthResponse>
  register: (userData: RegisterData) => Promise<AuthResponse>
  logout: () => Promise<void>
  updateUser: (updatedUser: User) => void
  checkAuthStatus: () => Promise<void>
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      const storedToken = localStorage.getItem("token")
      if (!storedToken) {
        console.log("AuthContext: No token found in localStorage.")
        setToken(null)
        setUser(null)
        setIsAuthenticated(false)
        return // Exit early if no token
      }

      const response = await apiService.verifyToken()
      if (response.success && response.user) {
        setToken(storedToken)
        setUser(response.user)
        setIsAuthenticated(true)
        console.log("AuthContext: Token verified, user authenticated.")
      } else {
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
        setIsAuthenticated(false)
        console.log("AuthContext: Token invalid or verification failed.")
      }
    } catch (error) {
      console.error("AuthContext: Auth check failed:", error)
      localStorage.removeItem("token")
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false) // Always set loading to false after check
    }
  }, [])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  useEffect(() => {
    console.log("AuthContext State Updated:")
    console.log("  User:", user ? user.name : "null") // Updated to use name
    console.log("  isAuthenticated:", isAuthenticated)
    console.log("  Loading:", loading)
  }, [user, isAuthenticated, loading])

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setLoading(true) // Set loading at the start of the operation
    try {
      const response = await apiService.login(credentials)
      if (response.success && response.token && response.user) {
        localStorage.setItem("token", response.token) // Save token first
        setToken(response.token)
        setUser(response.user)
        setIsAuthenticated(true)
        toast.success(`Welcome back, ${response.user.name}!`)
        console.log("AuthContext: Login successful, user and token set.")
        return { success: true, user: response.user, token: response.token }
      } else {
        throw new Error(response.message || "Login failed")
      }
    } catch (error: any) {
      console.error("AuthContext: Login error:", error)
      toast.error(error.message || "Login failed")
      return { success: false, error: error.message }
    } finally {
      setLoading(false) // Always set loading to false at the end
    }
  }

  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    setLoading(true) // Set loading at the start of the operation
    try {
      const response = await apiService.register(userData)
      if (response.success && response.token && response.user) {
        localStorage.setItem("token", response.token) // Save token first
        setToken(response.token)
        setUser(response.user)
        setIsAuthenticated(true)
        toast.success(`Welcome to ZIIIP, ${response.user.name}!`)
        console.log("AuthContext: Registration successful, user and token set.")
        return { success: true, user: response.user, token: response.token }
      } else {
        throw new Error(response.message || "Registration failed")
      }
    } catch (error: any) {
      console.error("AuthContext: Registration error:", error)
      toast.error(error.message || "Registration failed")
      return { success: false, error: error.message }
    } finally {
      setLoading(false) // Always set loading to false at the end
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout()
    } catch (error) {
      console.error("AuthContext: Logout API error:", error)
    } finally {
      localStorage.removeItem("token")
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
      toast.success("Logged out successfully")
      console.log("AuthContext: User logged out.")
    }
  }

  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser)
    console.log("AuthContext: User data updated.")
  }

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

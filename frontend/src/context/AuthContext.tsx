"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { jwtDecode } from "jwt-decode"
import { AuthContextType, DecodedUser } from "../types/types"

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<DecodedUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      try {
        const decodedUser: DecodedUser = jwtDecode(storedToken)
        if (decodedUser.exp * 1000 < Date.now()) {
          localStorage.removeItem("token")
          setUser(null)
          setToken(null)
        } else {
          setUser(decodedUser)
          setToken(storedToken)
        }
      } catch (error) {
        console.error("Failed to decode token:", error)
        localStorage.removeItem("token")
        setUser(null)
        setToken(null)
      }
    }
    setLoading(false)
  }, [])

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken)
    setToken(newToken)
    try {
      const decodedUser: DecodedUser = jwtDecode(newToken)
      setUser(decodedUser)
    } catch (error) {
      console.error("Failed to decode token after login:", error)
      setUser(null)
      localStorage.removeItem("token")
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

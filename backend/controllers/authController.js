const User = require("../models/User")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
    }

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      })
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
    })

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "30d" })

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    console.error("Registration error:", err)
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    })
  }
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  try {
    // Check for admin credentials
    if (email === "admin@gmail.com" && password === "admin123") {
      const token = jwt.sign({ id: "admin", role: "admin" }, process.env.JWT_SECRET || "your-secret-key", {
        expiresIn: "30d",
      })
      return res.json({
        success: true,
        token,
        user: {
          id: "admin",
          name: "Admin",
          email: "admin@gmail.com",
          role: "admin",
        },
      })
    }

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "30d" })

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({
      success: false,
      message: "Server error during login",
    })
  }
}

exports.forgotPassword = async (req, res) => {
  const { email } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User with this email does not exist",
      })
    }

    // Here you would typically send an email with reset link
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: "Password reset link sent to your email (mock)",
    })
  } catch (err) {
    console.error("Forgot password error:", err)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

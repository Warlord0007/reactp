const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files (for uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ziiip", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("MongoDB Connected to ziiip database")
  } catch (err) {
    console.error("MongoDB connection error:", err.message)
    process.exit(1)
  }
}

// Initialize Enhanced CNN Recommendation Service
const initializeRecommendationService = async () => {
  try {
    console.log("Initializing Enhanced CNN Recommendation Service...")
    const enhancedCnnRecommendationService = require("./services/enhancedCNNRecommendationService")
    await enhancedCnnRecommendationService.initialize()
    console.log("✓ Enhanced CNN Recommendation Service initialized successfully")
  } catch (error) {
    console.error("Failed to initialize recommendation service:", error.message)
    console.log("⚠ Recommendation service will use fallback mode")
  }
}

// Connect to database and initialize services
const initializeApp = async () => {
  await connectDB()
  await initializeRecommendationService()
}

initializeApp()

// Routes
app.use("/api/auth", require("./routes/authRoutes"))
app.use("/api/users", require("./routes/userRoutes"))
app.use("/api/products", require("./routes/productRoutes"))
app.use("/api/cart", require("./routes/cartRoutes"))
app.use("/api/checkout", require("./routes/checkoutRoutes"))
app.use("/api/payment", require("./routes/paymentRoutes"))
app.use("/api/orders", require("./routes/orderRoutes"))
app.use("/api/cnn-recommendations", require("./routes/cnnRecommendationRoutes"))

// Health check endpoint with service status
app.get("/api/health", async (req, res) => {
  try {
    const enhancedCnnRecommendationService = require("./services/enhancedCNNRecommendationService")
    const serviceStatus = enhancedCnnRecommendationService.getServiceStatus()

    res.json({
      success: true,
      message: "ZIIIP E-commerce API is running",
      timestamp: new Date().toISOString(),
      services: {
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        recommendationService: serviceStatus,
      },
    })
  } catch (error) {
    res.json({
      success: true,
      message: "ZIIIP E-commerce API is running",
      timestamp: new Date().toISOString(),
      services: {
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        recommendationService: "not available",
      },
    })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})

module.exports = app

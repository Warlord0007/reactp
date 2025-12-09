const EnhancedCNNRecommendationService = require("../services/enhancedCNNRecommendationService")
const UserInteraction = require("../models/UserInteraction")

// Your existing middleware (keeping it as is)
const trackPageView = async (req, res, next) => {
  try {
    if (req.user && req.params.productId) {
      const productId = req.params.productId
      const recentView = await UserInteraction.findOne({
        user: req.user.id,
        product: productId,
        type: "view",
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      })
      if (!recentView) {
        const Product = require("../models/Product")
        const product = await Product.findById(productId)
        if (product) {
          const interaction = new UserInteraction({
            user: req.user.id,
            product: productId,
            type: "view",
            metadata: {
              timestamp: new Date(),
              referrer: req.get("Referrer"),
              userAgent: req.get("User-Agent"),
              duration: 0,
              productName: product.name,
              productCategory: product.category,
              productPrice: product.price,
              viewSource: req.query.source || "direct",
            },
            sessionId: req.sessionID || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            deviceInfo: {
              userAgent: req.get("User-Agent"),
              platform: req.get("X-Platform") || "web",
              ip: req.ip,
            },
          })
          await interaction.save()
          console.log(`Tracked page view: User ${req.user.id} viewed product ${productId}`)
        }
      }
    }
  } catch (error) {
    console.error("Error tracking page view:", error)
  }
  next()
}

// Enhanced cart addition tracking middleware
const trackCartAddition = async (req, res, next) => {
  try {
    // Check for both userId in body and user in req (from auth middleware)
    const userId = req.user?.id || req.body.userId
    const productId = req.body.productId

    if (userId && productId) {
      const interaction = new UserInteraction({
        user: userId,
        product: productId,
        type: "add_to_cart",
        metadata: {
          timestamp: new Date(),
          quantity: req.body.quantity || 1,
          size: req.body.size,
          color: req.body.color,
          source: "cart_page",
        },
        sessionId: req.sessionID || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deviceInfo: {
          userAgent: req.get("User-Agent"),
          platform: req.get("X-Platform") || "web",
          ip: req.ip,
        },
      })
      await interaction.save()
      console.log(`Tracked cart addition: User ${userId} added product ${productId}`)
    }
  } catch (error) {
    console.error("Error tracking cart addition:", error)
  }
  next()
}

// Request logging middleware for debugging
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request Body:", req.body)
  }
  next()
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  })
}

// 404 handler
const notFoundHandler = (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      "GET /api/health",
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/auth/verify",
      "GET /api/cart/:userId",
      "POST /api/cart",
      "PUT /api/cart/:userId/:productId",
      "DELETE /api/cart/:userId/:productId",
    ],
  })
}

const initializeEnhancedRecommendationService = async () => {
  try {
    console.log("Initializing Enhanced CNN Recommendation Service...")
    await EnhancedCNNRecommendationService.initialize()
    console.log("✓ Enhanced CNN Recommendation Service initialized successfully")
    const status = EnhancedCNNRecommendationService.getServiceStatus()
    console.log("Service Status:", {
      initialized: status.isInitialized,
      modelType: status.modelType,
      backend: status.tensorflowBackend,
    })
  } catch (error) {
    console.error("Failed to initialize enhanced recommendation service:", error)
    console.log("⚠ Recommendation service will use fallback mode")
  }
}

const addRecommendationContext = async (req, res, next) => {
  res.addRecommendations = async (userId, options = {}) => {
    try {
      const recommendations = await EnhancedCNNRecommendationService.getAdvancedCNNRecommendations(userId, {
        limit: 4,
        ...options,
      })
      return recommendations.recommendations
    } catch (error) {
      console.error("Error adding recommendations to context:", error)
      return []
    }
  }
  next()
}

module.exports = {
  trackPageView,
  trackCartAddition,
  requestLogger,
  errorHandler,
  notFoundHandler,
  initializeEnhancedRecommendationService,
  addRecommendationContext,
}

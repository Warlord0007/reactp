const EnhancedCNNRecommendationService = require("../services/enhancedCNNRecommendationService")
const UserInteraction = require("../models/UserInteraction")

// Enhanced middleware to automatically track page views with better logic
const trackPageView = async (req, res, next) => {
  try {
    // Only track if user is authenticated and viewing a product
    if (req.user && req.params.productId) {
      const productId = req.params.productId

      // Check if we already tracked this view recently (within 5 minutes)
      const recentView = await UserInteraction.findOne({
        user: req.user.id,
        product: productId,
        type: "view",
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      })

      if (!recentView) {
        // Get product information
        const Product = require("../models/Product")
        const product = await Product.findById(productId)

        if (product) {
          // Track the view with enhanced metadata
          const interaction = new UserInteraction({
            user: req.user.id,
            product: productId,
            type: "view",
            metadata: {
              timestamp: new Date(),
              referrer: req.get("Referrer"),
              userAgent: req.get("User-Agent"),
              duration: 0, // Will be updated by frontend
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
    // Don't block the request if tracking fails
  }

  next()
}

// Enhanced middleware to track cart additions
const trackCartAddition = async (req, res, next) => {
  try {
    if (req.user && req.body.productId) {
      const interaction = new UserInteraction({
        user: req.user.id,
        product: req.body.productId,
        type: "add_to_cart",
        metadata: {
          timestamp: new Date(),
          quantity: req.body.quantity || 1,
          size: req.body.size,
          color: req.body.color,
        },
        sessionId: req.sessionID,
        deviceInfo: {
          userAgent: req.get("User-Agent"),
          platform: req.get("X-Platform") || "web",
          ip: req.ip,
        },
      })

      await interaction.save()
      console.log(`Tracked cart addition: User ${req.user.id} added product ${req.body.productId}`)
    }
  } catch (error) {
    console.error("Error tracking cart addition:", error)
  }

  next()
}

// Middleware to initialize recommendation service on app start
const initializeEnhancedRecommendationService = async () => {
  try {
    console.log("Initializing Enhanced CNN Recommendation Service...")
    await EnhancedCNNRecommendationService.initialize()
    console.log("✓ Enhanced CNN Recommendation Service initialized successfully")

    // Optionally run a health check
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

// Middleware to add recommendation context to responses
const addRecommendationContext = async (req, res, next) => {
  // Add helper function to response object
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
  initializeEnhancedRecommendationService,
  addRecommendationContext,
}

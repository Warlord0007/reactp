const EnhancedCNNRecommendationService = require("../services/enhancedCNNRecommendationService")
const UserInteraction = require("../models/UserInteraction")

class RecommendationController {
  async getRecommendations(req, res) {
    try {
      const userId = req.user.id
      const {
        limit = 6,
        includeViewed = false,
        categoryFilter = null,
        priceRange = null,
        similarityThreshold = 0.1,
        diversityFactor = 0.3,
      } = req.query

      // Parse price range if provided
      let parsedPriceRange = null
      if (priceRange) {
        try {
          parsedPriceRange = JSON.parse(priceRange)
        } catch (error) {
          console.warn("Invalid price range format:", priceRange)
        }
      }

      const options = {
        limit: Number.parseInt(limit),
        includeViewed: includeViewed === "true",
        categoryFilter,
        priceRange: parsedPriceRange,
        similarityThreshold: Number.parseFloat(similarityThreshold),
        diversityFactor: Number.parseFloat(diversityFactor),
      }

      const recommendations = await EnhancedCNNRecommendationService.getAdvancedCNNRecommendations(userId, options)

      res.json({
        success: true,
        data: recommendations,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Recommendation controller error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to get recommendations",
        error: error.message,
      })
    }
  }

  async trackInteraction(req, res) {
    try {
      const userId = req.user.id
      const { productId, type, metadata = {} } = req.body

      // Validate interaction type
      const validTypes = ["view", "like", "add_to_cart", "purchase", "review", "search"]
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid interaction type",
        })
      }

      // Get product embedding for storage
      const Product = require("../models/Product")
      const ProductEmbedding = require("../models/ProductEmbedding")

      const product = await Product.findById(productId)
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        })
      }

      let productEmbedding = null
      const embedding = await ProductEmbedding.findOne({ productId })
      if (embedding) {
        productEmbedding = embedding.combinedEmbedding
      }

      // Create interaction record
      const interaction = new UserInteraction({
        user: userId,
        product: productId,
        type,
        metadata: {
          ...metadata,
          timestamp: new Date(),
        },
        productEmbedding,
        sessionId: req.sessionID,
        deviceInfo: {
          userAgent: req.get("User-Agent"),
          platform: req.get("X-Platform") || "web",
        },
      })

      await interaction.save()

      res.json({
        success: true,
        message: "Interaction tracked successfully",
        interactionId: interaction._id,
      })
    } catch (error) {
      console.error("Track interaction error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to track interaction",
        error: error.message,
      })
    }
  }

  async getServiceStatus(req, res) {
    try {
      const status = EnhancedCNNRecommendationService.getServiceStatus()
      res.json({
        success: true,
        status,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Service status error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to get service status",
        error: error.message,
      })
    }
  }

  async initializeService(req, res) {
    try {
      await EnhancedCNNRecommendationService.initialize()
      res.json({
        success: true,
        message: "Service initialized successfully",
        status: EnhancedCNNRecommendationService.getServiceStatus(),
      })
    } catch (error) {
      console.error("Service initialization error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to initialize service",
        error: error.message,
      })
    }
  }

  async generateEmbeddings(req, res) {
    try {
      const result = await EnhancedCNNRecommendationService.batchGenerateAdvancedEmbeddings()
      res.json({
        success: true,
        message: "Embeddings generated successfully",
        data: result,
      })
    } catch (error) {
      console.error("Generate embeddings error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to generate embeddings",
        error: error.message,
      })
    }
  }
}

module.exports = new RecommendationController()

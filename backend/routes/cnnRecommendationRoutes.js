const express = require("express")
const mongoose = require("mongoose")
const router = express.Router()
const enhancedCnnRecommendationService = require("../services/enhancedCNNRecommendationService")
const UserInteraction = require("../models/UserInteraction")
const { protect } = require("../middleware/authMiddleware")

// Initialize Enhanced CNN service
enhancedCnnRecommendationService.initialize()

// @route   GET /api/cnn-recommendations/:userId
// @desc    Get enhanced CNN recommendations for a user with advanced options
// @access  Private
router.get("/:userId", protect, async (req, res) => {
  try {
    const userId = req.params.userId

    // Parse query parameters with defaults
    const options = {
      limit: Number.parseInt(req.query.limit) || 6,
      includeViewed: req.query.includeViewed === "true",
      categoryFilter: req.query.categoryFilter || null,
      priceRange: req.query.priceRange ? JSON.parse(req.query.priceRange) : null,
      similarityThreshold: Number.parseFloat(req.query.similarityThreshold) || 0.1,
      diversityFactor: Number.parseFloat(req.query.diversityFactor) || 0.3,
    }

    // Validate user authorization
    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only get your own recommendations.",
      })
    }

    console.log(`Getting enhanced recommendations for user: ${userId}`, options)

    const result = await enhancedCnnRecommendationService.getAdvancedCNNRecommendations(userId, options)

    // Track recommendation request
    await trackRecommendationRequest(userId, options, result.recommendations.length)

    res.json({
      success: true,
      data: result,
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      options: options,
    })
  } catch (error) {
    console.error("Enhanced CNN recommendation route error:", error)
    res.status(500).json({
      success: false,
      message: "Error generating enhanced CNN recommendations",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      timestamp: new Date().toISOString(),
    })
  }
})

// @route   POST /api/cnn-recommendations/track-interaction
// @desc    Track user interactions with products
// @access  Private
router.post("/track-interaction", protect, async (req, res) => {
  try {
    const userId = req.user.id
    const { productId, type, metadata = {} } = req.body

    // Validate required fields
    if (!productId || !type) {
      return res.status(400).json({
        success: false,
        message: "Product ID and interaction type are required",
      })
    }

    // Validate interaction type
    const validTypes = ["view", "like", "add_to_cart", "purchase", "review", "search", "share", "wishlist"]
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid interaction type. Valid types: ${validTypes.join(", ")}`,
      })
    }

    // Get product and embedding information
    const Product = require("../models/Product")
    const ProductEmbedding = require("../models/ProductEmbedding")

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    // Get or generate product embedding
    let productEmbedding = null
    let embedding = await ProductEmbedding.findOne({ productId })

    if (!embedding) {
      console.log(`Generating embedding for product ${productId} during interaction tracking`)
      const embeddingData = await enhancedCnnRecommendationService.generateAdvancedProductEmbedding(product)
      embedding = new ProductEmbedding({
        productId: product._id,
        ...embeddingData,
      })
      await embedding.save()
    }

    productEmbedding = embedding.combinedEmbedding

    // Create interaction record
    const interaction = new UserInteraction({
      user: userId,
      product: productId,
      type,
      metadata: {
        ...metadata,
        timestamp: new Date(),
        productName: product.name,
        productCategory: product.category,
        productPrice: product.price,
      },
      productEmbedding,
      sessionId: req.sessionID || generateSessionId(),
      deviceInfo: {
        userAgent: req.get("User-Agent"),
        platform: req.get("X-Platform") || "web",
        ip: req.ip,
      },
    })

    await interaction.save()

    res.json({
      success: true,
      message: "Interaction tracked successfully",
      data: {
        interactionId: interaction._id,
        type: interaction.type,
        productId: productId,
        timestamp: interaction.createdAt,
      },
    })
  } catch (error) {
    console.error("Track interaction error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to track interaction",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// @route   GET /api/cnn-recommendations/user-interactions/:userId
// @desc    Get user interaction history
// @access  Private
router.get("/user-interactions/:userId", protect, async (req, res) => {
  try {
    const userId = req.params.userId
    const limit = Number.parseInt(req.query.limit) || 50
    const type = req.query.type // Optional filter by interaction type

    // Validate user authorization
    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own interactions.",
      })
    }

    const query = { user: userId }
    if (type) {
      query.type = type
    }

    const interactions = await UserInteraction.find(query)
      .populate("product", "name category price images")
      .sort({ createdAt: -1 })
      .limit(limit)

    // Generate interaction statistics
    const stats = await generateInteractionStats(userId)

    res.json({
      success: true,
      data: {
        interactions,
        stats,
        total: interactions.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Get user interactions error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get user interactions",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// @route   POST /api/cnn-recommendations/batch-generate
// @desc    Batch generate embeddings for all products (Admin only)
// @access  Private/Admin
router.post("/batch-generate", protect, async (req, res) => {
  try {
    // Check admin privileges
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      })
    }

    console.log(`Admin ${req.user.id} initiated batch embedding generation`)

    const result = await enhancedCnnRecommendationService.batchGenerateAdvancedEmbeddings()

    res.json({
      success: true,
      message: "Batch embedding generation completed",
      data: result,
      timestamp: new Date().toISOString(),
      initiatedBy: req.user.id,
    })
  } catch (error) {
    console.error("Batch generation error:", error)
    res.status(500).json({
      success: false,
      message: "Error in batch embedding generation",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// @route   GET /api/cnn-recommendations/similarity/:productId1/:productId2
// @desc    Calculate advanced similarity between two products
// @access  Public
router.get("/similarity/:productId1/:productId2", async (req, res) => {
  try {
    const { productId1, productId2 } = req.params
    const metric = req.query.metric || "cosine" // cosine, euclidean, pearson, jaccard

    const ProductEmbedding = require("../models/ProductEmbedding")
    const Product = require("../models/Product")

    // Get embeddings and product info
    const [embedding1, embedding2, product1, product2] = await Promise.all([
      ProductEmbedding.findOne({ productId: productId1 }),
      ProductEmbedding.findOne({ productId: productId2 }),
      Product.findById(productId1, "name category price"),
      Product.findById(productId2, "name category price"),
    ])

    if (!embedding1 || !embedding2) {
      return res.status(404).json({
        success: false,
        message: "One or both product embeddings not found",
        missing: {
          product1: !embedding1,
          product2: !embedding2,
        },
      })
    }

    if (!product1 || !product2) {
      return res.status(404).json({
        success: false,
        message: "One or both products not found",
      })
    }

    // Calculate similarity using different metrics
    const similarities = {
      cosine: enhancedCnnRecommendationService.calculateAdvancedCosineSimilarity(
        embedding1.combinedEmbedding,
        embedding2.combinedEmbedding,
        "cosine",
      ),
      euclidean: enhancedCnnRecommendationService.calculateAdvancedCosineSimilarity(
        embedding1.combinedEmbedding,
        embedding2.combinedEmbedding,
        "euclidean",
      ),
      pearson: enhancedCnnRecommendationService.calculateAdvancedCosineSimilarity(
        embedding1.combinedEmbedding,
        embedding2.combinedEmbedding,
        "pearson",
      ),
    }

    // Calculate component similarities
    const imageSimilarity = enhancedCnnRecommendationService.calculateAdvancedCosineSimilarity(
      embedding1.imageEmbedding,
      embedding2.imageEmbedding,
      "cosine",
    )

    const textSimilarity = enhancedCnnRecommendationService.calculateAdvancedCosineSimilarity(
      embedding1.textEmbedding,
      embedding2.textEmbedding,
      "cosine",
    )

    // Category and price similarity
    const categoryMatch = product1.category === product2.category
    const priceSimilarity = calculatePriceSimilarity(product1.price, product2.price)

    res.json({
      success: true,
      data: {
        products: {
          product1: { id: productId1, name: product1.name, category: product1.category, price: product1.price },
          product2: { id: productId2, name: product2.name, category: product2.category, price: product2.price },
        },
        similarities: {
          overall: similarities,
          components: {
            image: imageSimilarity,
            text: textSimilarity,
            category: categoryMatch ? 1 : 0,
            price: priceSimilarity,
          },
        },
        primaryMetric: similarities[metric] || similarities.cosine,
        recommendation:
          similarities.cosine > 0.7
            ? "highly_similar"
            : similarities.cosine > 0.4
              ? "moderately_similar"
              : "not_similar",
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Similarity calculation error:", error)
    res.status(500).json({
      success: false,
      message: "Error calculating similarity",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// @route   GET /api/cnn-recommendations/embedding/:productId
// @desc    Get detailed embedding information for a product
// @access  Public
router.get("/embedding/:productId", async (req, res) => {
  try {
    const { productId } = req.params
    const includeFullEmbedding = req.query.full === "true"

    const ProductEmbedding = require("../models/ProductEmbedding")
    const Product = require("../models/Product")

    const [embedding, product] = await Promise.all([
      ProductEmbedding.findOne({ productId }),
      Product.findById(productId),
    ])

    if (!embedding || !product) {
      return res.status(404).json({
        success: false,
        message: "Product or embedding not found",
        found: {
          product: !!product,
          embedding: !!embedding,
        },
      })
    }

    // Calculate embedding statistics
    const stats = {
      image: calculateEmbeddingStats(embedding.imageEmbedding),
      text: calculateEmbeddingStats(embedding.textEmbedding),
      combined: calculateEmbeddingStats(embedding.combinedEmbedding),
    }

    const response = {
      success: true,
      data: {
        product: {
          id: product._id,
          name: product.name,
          category: product.category,
          brand: product.brand,
          price: product.price,
          images: product.images,
        },
        embedding: {
          dimensions: {
            image: embedding.imageEmbedding.length,
            text: embedding.textEmbedding.length,
            category: embedding.categoryEmbedding?.length || 0,
            combined: embedding.combinedEmbedding.length,
          },
          statistics: stats,
          metadata: embedding.metadata,
          lastUpdated: embedding.updatedAt,
          // Preview (first 10 values) or full embedding based on query
          preview: includeFullEmbedding
            ? {
                imageEmbedding: embedding.imageEmbedding,
                textEmbedding: embedding.textEmbedding,
                combinedEmbedding: embedding.combinedEmbedding,
              }
            : {
                imageEmbeddingPreview: embedding.imageEmbedding.slice(0, 10),
                textEmbeddingPreview: embedding.textEmbedding.slice(0, 10),
                combinedEmbeddingPreview: embedding.combinedEmbedding.slice(0, 10),
              },
        },
      },
      timestamp: new Date().toISOString(),
    }

    res.json(response)
  } catch (error) {
    console.error("Embedding retrieval error:", error)
    res.status(500).json({
      success: false,
      message: "Error retrieving embedding",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// @route   GET /api/cnn-recommendations/service-status
// @desc    Get enhanced CNN service status and health
// @access  Public
router.get("/service-status", async (req, res) => {
  try {
    const status = enhancedCnnRecommendationService.getServiceStatus()

    // Add additional health metrics
    const ProductEmbedding = require("../models/ProductEmbedding")
    const Product = require("../models/Product")

    const [totalProducts, totalEmbeddings, recentInteractions] = await Promise.all([
      Product.countDocuments(),
      ProductEmbedding.countDocuments(),
      UserInteraction.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    ])

    const healthMetrics = {
      ...status,
      database: {
        totalProducts,
        totalEmbeddings,
        embeddingCoverage: totalProducts > 0 ? ((totalEmbeddings / totalProducts) * 100).toFixed(2) + "%" : "0%",
      },
      activity: {
        recentInteractions24h: recentInteractions,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }

    res.json({
      success: true,
      status: "healthy",
      data: healthMetrics,
    })
  } catch (error) {
    console.error("Service status error:", error)
    res.status(500).json({
      success: false,
      status: "unhealthy",
      message: "Error retrieving service status",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// @route   POST /api/cnn-recommendations/initialize
// @desc    Initialize or reinitialize the enhanced CNN service
// @access  Private/Admin
router.post("/initialize", protect, async (req, res) => {
  try {
    // Check admin privileges
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      })
    }

    console.log(`Admin ${req.user.id} initiated service reinitialization`)

    await enhancedCnnRecommendationService.initialize()

    const status = enhancedCnnRecommendationService.getServiceStatus()

    res.json({
      success: true,
      message: "Enhanced CNN service initialized successfully",
      data: status,
      timestamp: new Date().toISOString(),
      initiatedBy: req.user.id,
    })
  } catch (error) {
    console.error("Service initialization error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to initialize service",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// @route   GET /api/cnn-recommendations/analytics/:userId
// @desc    Get recommendation analytics for a user
// @access  Private
router.get("/analytics/:userId", protect, async (req, res) => {
  try {
    const userId = req.params.userId
    const days = Number.parseInt(req.query.days) || 30

    // Validate user authorization
    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own analytics.",
      })
    }

    const analytics = await generateUserAnalytics(userId, days)

    res.json({
      success: true,
      data: analytics,
      period: `${days} days`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Analytics error:", error)
    res.status(500).json({
      success: false,
      message: "Error generating analytics",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// Helper Functions

async function trackRecommendationRequest(userId, options, resultCount) {
  try {
    // This could be stored in a separate RecommendationRequest model
    console.log(`Recommendation request: User ${userId}, Options: ${JSON.stringify(options)}, Results: ${resultCount}`)
  } catch (error) {
    console.error("Error tracking recommendation request:", error)
  }
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function calculatePriceSimilarity(price1, price2) {
  if (!price1 || !price2) return 0
  const maxPrice = Math.max(price1, price2)
  const minPrice = Math.min(price1, price2)
  return maxPrice > 0 ? minPrice / maxPrice : 1
}

function calculateEmbeddingStats(embedding) {
  if (!embedding || embedding.length === 0) return null

  const sum = embedding.reduce((a, b) => a + b, 0)
  const mean = sum / embedding.length
  const variance = embedding.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / embedding.length
  const stdDev = Math.sqrt(variance)

  return {
    mean: Number(mean.toFixed(6)),
    variance: Number(variance.toFixed(6)),
    standardDeviation: Number(stdDev.toFixed(6)),
    min: Number(Math.min(...embedding).toFixed(6)),
    max: Number(Math.max(...embedding).toFixed(6)),
    nonZeroCount: embedding.filter((val) => val !== 0).length,
    sparsity: Number(
      (((embedding.length - embedding.filter((val) => val !== 0).length) / embedding.length) * 100).toFixed(2),
    ),
  }
}

async function generateInteractionStats(userId) {
  try {
    const stats = await UserInteraction.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          lastInteraction: { $max: "$createdAt" },
        },
      },
    ])

    const categoryStats = await UserInteraction.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: "products", localField: "product", foreignField: "_id", as: "productInfo" } },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])

    return {
      byType: stats,
      byCategory: categoryStats,
      totalInteractions: stats.reduce((sum, stat) => sum + stat.count, 0),
    }
  } catch (error) {
    console.error("Error generating interaction stats:", error)
    return { byType: [], byCategory: [], totalInteractions: 0 }
  }
}

async function generateUserAnalytics(userId, days) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const interactions = await UserInteraction.find({
      user: userId,
      createdAt: { $gte: startDate },
    }).populate("product", "name category price")

    const analytics = {
      totalInteractions: interactions.length,
      interactionsByType: {},
      interactionsByCategory: {},
      dailyActivity: {},
      averageSessionLength: 0,
      topProducts: {},
      priceRangePreference: { min: 0, max: 0, average: 0 },
    }

    // Process interactions
    interactions.forEach((interaction) => {
      // By type
      analytics.interactionsByType[interaction.type] = (analytics.interactionsByType[interaction.type] || 0) + 1

      // By category
      if (interaction.product?.category) {
        analytics.interactionsByCategory[interaction.product.category] =
          (analytics.interactionsByCategory[interaction.product.category] || 0) + 1
      }

      // Daily activity
      const day = interaction.createdAt.toISOString().split("T")[0]
      analytics.dailyActivity[day] = (analytics.dailyActivity[day] || 0) + 1

      // Top products
      if (interaction.product) {
        const productKey = interaction.product._id.toString()
        analytics.topProducts[productKey] = {
          product: interaction.product,
          count: (analytics.topProducts[productKey]?.count || 0) + 1,
        }
      }
    })

    // Calculate price preferences
    const prices = interactions.filter((i) => i.product?.price).map((i) => i.product.price)

    if (prices.length > 0) {
      analytics.priceRangePreference = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
      }
    }

    // Convert topProducts to array and sort
    analytics.topProducts = Object.values(analytics.topProducts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return analytics
  } catch (error) {
    console.error("Error generating user analytics:", error)
    return {}
  }
}

module.exports = router

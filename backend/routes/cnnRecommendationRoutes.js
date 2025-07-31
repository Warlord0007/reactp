const express = require("express")
const router = express.Router()
const cnnRecommendationService = require("../services/cnnRecommendationService")
const { protect } = require("../middleware/authMiddleware")

// Initialize CNN service
cnnRecommendationService.initialize()

// @route   GET /api/cnn-recommendations/:userId
// @desc    Get CNN-enhanced recommendations for a user
// @access  Private
router.get("/:userId", protect, async (req, res) => {
  try {
    const userId = req.params.userId
    const limit = Number.parseInt(req.query.limit) || 6

    const result = await cnnRecommendationService.getCNNRecommendations(userId, limit)

    res.json(result)
  } catch (error) {
    console.error("CNN recommendation route error:", error)
    res.status(500).json({
      success: false,
      message: "Error generating CNN recommendations",
      error: error.message,
    })
  }
})

// @route   POST /api/cnn-recommendations/batch-generate
// @desc    Batch generate embeddings for all products (Admin only)
// @access  Private/Admin
router.post("/batch-generate", protect, async (req, res) => {
  try {
    const result = await cnnRecommendationService.batchGenerateEmbeddings()
    res.json(result)
  } catch (error) {
    console.error("Batch generation error:", error)
    res.status(500).json({
      success: false,
      message: "Error in batch embedding generation",
      error: error.message,
    })
  }
})

// @route   GET /api/cnn-recommendations/similarity/:productId1/:productId2
// @desc    Calculate similarity between two products
// @access  Public
router.get("/similarity/:productId1/:productId2", async (req, res) => {
  try {
    const ProductEmbedding = require("../models/ProductEmbedding")

    const embedding1 = await ProductEmbedding.findOne({ productId: req.params.productId1 })
    const embedding2 = await ProductEmbedding.findOne({ productId: req.params.productId2 })

    if (!embedding1 || !embedding2) {
      return res.status(404).json({
        success: false,
        message: "Product embeddings not found",
      })
    }

    const similarity = cnnRecommendationService.calculateEnhancedCosineSimilarity(
      embedding1.combinedEmbedding,
      embedding2.combinedEmbedding,
    )

    res.json({
      success: true,
      similarity,
      productId1: req.params.productId1,
      productId2: req.params.productId2,
    })
  } catch (error) {
    console.error("Similarity calculation error:", error)
    res.status(500).json({
      success: false,
      message: "Error calculating similarity",
      error: error.message,
    })
  }
})

// @route   GET /api/cnn-recommendations/embedding/:productId
// @desc    Get embedding details for a product
// @access  Public
router.get("/embedding/:productId", async (req, res) => {
  try {
    const ProductEmbedding = require("../models/ProductEmbedding")
    const Product = require("../models/Product")

    const embedding = await ProductEmbedding.findOne({ productId: req.params.productId })
    const product = await Product.findById(req.params.productId)

    if (!embedding || !product) {
      return res.status(404).json({
        success: false,
        message: "Product or embedding not found",
      })
    }

    res.json({
      success: true,
      product: {
        id: product._id,
        name: product.name,
        category: product.category,
        brand: product.brand,
      },
      embedding: {
        imageEmbeddingDimensions: embedding.imageEmbedding.length,
        textEmbeddingDimensions: embedding.textEmbedding.length,
        combinedEmbeddingDimensions: embedding.combinedEmbedding.length,
        lastUpdated: embedding.lastUpdated,
        // Only return first 10 values for preview
        imageEmbeddingPreview: embedding.imageEmbedding.slice(0, 10),
        textEmbeddingPreview: embedding.textEmbedding.slice(0, 10),
        combinedEmbeddingPreview: embedding.combinedEmbedding.slice(0, 10),
      },
    })
  } catch (error) {
    console.error("Embedding retrieval error:", error)
    res.status(500).json({
      success: false,
      message: "Error retrieving embedding",
      error: error.message,
    })
  }
})

module.exports = router

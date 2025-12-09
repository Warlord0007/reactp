// Utility functions for recommendation system

const mongoose = require("mongoose")

/**
 * Generate recommendation request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate session ID
 */
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Calculate price similarity between two products
 */
function calculatePriceSimilarity(price1, price2) {
  if (!price1 || !price2) return 0
  const maxPrice = Math.max(price1, price2)
  const minPrice = Math.min(price1, price2)
  return maxPrice > 0 ? minPrice / maxPrice : 1
}

/**
 * Calculate embedding statistics
 */
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

/**
 * Validate recommendation options
 */
function validateRecommendationOptions(options) {
  const validated = { ...options }

  // Validate limit
  if (validated.limit && (validated.limit < 1 || validated.limit > 50)) {
    validated.limit = 6
  }

  // Validate similarity threshold
  if (validated.similarityThreshold && (validated.similarityThreshold < 0 || validated.similarityThreshold > 1)) {
    validated.similarityThreshold = 0.1
  }

  // Validate diversity factor
  if (validated.diversityFactor && (validated.diversityFactor < 0 || validated.diversityFactor > 1)) {
    validated.diversityFactor = 0.3
  }

  // Validate price range
  if (validated.priceRange) {
    if (typeof validated.priceRange === "string") {
      try {
        validated.priceRange = JSON.parse(validated.priceRange)
      } catch (error) {
        validated.priceRange = null
      }
    }

    if (validated.priceRange && (!validated.priceRange.min || !validated.priceRange.max)) {
      validated.priceRange = null
    }
  }

  return validated
}

/**
 * Format recommendation response
 */
function formatRecommendationResponse(result, options, requestId) {
  return {
    success: true,
    data: {
      recommendations: result.recommendations,
      method: result.method,
      confidence: result.confidence,
      debug: result.debug,
    },
    metadata: {
      requestId,
      options,
      timestamp: new Date().toISOString(),
      totalResults: result.recommendations.length,
    },
  }
}

/**
 * Generate interaction weight based on type
 */
function getInteractionWeight(interactionType) {
  const weights = {
    view: 1,
    like: 2,
    share: 2,
    wishlist: 3,
    add_to_cart: 4,
    review: 4,
    purchase: 5,
  }
  return weights[interactionType] || 1
}

/**
 * Calculate recommendation confidence score
 */
function calculateConfidenceScore(similarities, diversityScore, userProfileStrength) {
  if (!similarities || similarities.length === 0) return 0

  const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length
  const minSimilarity = Math.min(...similarities)
  const maxSimilarity = Math.max(...similarities)

  // Factors that contribute to confidence
  const similarityScore = avgSimilarity * 0.4
  const consistencyScore = (1 - (maxSimilarity - minSimilarity)) * 0.2
  const diversityContribution = diversityScore * 0.2
  const profileStrength = userProfileStrength * 0.2

  return Math.min(1, Math.max(0, similarityScore + consistencyScore + diversityContribution + profileStrength))
}

/**
 * Parse and validate user ID
 */
function validateUserId(userId) {
  if (!userId) {
    throw new Error("User ID is required")
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID format")
  }

  return userId
}

/**
 * Parse and validate product ID
 */
function validateProductId(productId) {
  if (!productId) {
    throw new Error("Product ID is required")
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID format")
  }

  return productId
}

/**
 * Generate error response
 */
function generateErrorResponse(message, error = null, statusCode = 500) {
  return {
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error?.message || error : "Internal server error",
    timestamp: new Date().toISOString(),
    statusCode,
  }
}

/**
 * Log recommendation performance metrics
 */
function logPerformanceMetrics(startTime, operation, userId, resultCount) {
  const duration = Date.now() - startTime
  console.log(`[PERF] ${operation} - User: ${userId}, Results: ${resultCount}, Duration: ${duration}ms`)

  // You could send this to a monitoring service
  if (duration > 5000) {
    console.warn(`[PERF WARNING] Slow ${operation} operation: ${duration}ms`)
  }
}

module.exports = {
  generateRequestId,
  generateSessionId,
  calculatePriceSimilarity,
  calculateEmbeddingStats,
  validateRecommendationOptions,
  formatRecommendationResponse,
  getInteractionWeight,
  calculateConfidenceScore,
  validateUserId,
  validateProductId,
  generateErrorResponse,
  logPerformanceMetrics,
}

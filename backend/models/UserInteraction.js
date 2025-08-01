const mongoose = require("mongoose")

const userInteractionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    type: {
      type: String,
      enum: ["view", "like", "add_to_cart", "purchase", "review", "search"],
      required: true,
    },
    metadata: {
      duration: Number, // For view interactions
      rating: Number, // For review interactions
      searchQuery: String, // For search interactions
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    productEmbedding: [Number], // Store embedding at time of interaction
    sessionId: String,
    deviceInfo: {
      userAgent: String,
      platform: String,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient querying
userInteractionSchema.index({ user: 1, createdAt: -1 })
userInteractionSchema.index({ product: 1, type: 1 })
userInteractionSchema.index({ user: 1, type: 1, createdAt: -1 })

module.exports = mongoose.model("UserInteraction", userInteractionSchema)

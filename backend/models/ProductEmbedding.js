const mongoose = require("mongoose")

const ProductEmbeddingSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
    },
    imageEmbedding: {
      type: [Number], // 512-dimensional vector from CNN
      required: true,
    },
    textEmbedding: {
      type: [Number], // 256-dimensional vector from text processing
      required: true,
    },
    combinedEmbedding: {
      type: [Number], // 768-dimensional combined vector
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

// Index for faster similarity searches
ProductEmbeddingSchema.index({ productId: 1 })

module.exports = mongoose.model("ProductEmbedding", ProductEmbeddingSchema)

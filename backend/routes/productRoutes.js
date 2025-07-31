const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const { protect, authorize } = require("../middleware/authMiddleware")
const multer = require("multer")
const path = require("path")

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/") // Files will be stored in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({ storage: storage })

// @route   GET /api/products
// @desc    Get all products with filters, search, and pagination
// @access  Public
router.get("/", async (req, res) => {
  try {
    const pageSize = Number.parseInt(req.query.pageSize) || 10
    const page = Number.parseInt(req.query.pageNumber) || 1
    const searchTerm = req.query.searchTerm ? req.query.searchTerm.toLowerCase() : ""
    const category = req.query.category ? req.query.category.toLowerCase() : ""
    const brand = req.query.brand ? req.query.brand.toLowerCase() : ""
    const minPrice = Number.parseFloat(req.query.minPrice) || 0
    const maxPrice = Number.parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER
    const isFeatured = req.query.featured === "true"
    const sort = req.query.sort // e.g., 'price_asc', 'price_desc', 'newest', 'rating_desc'

    const query = {}

    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ]
    }

    if (category) {
      query.category = { $regex: category, $options: "i" }
    }

    if (brand) {
      query.brand = { $regex: brand, $options: "i" }
    }

    if (isFeatured) {
      query.isFeatured = true
    }

    query.price = { $gte: minPrice, $lte: maxPrice }

    const count = await Product.countDocuments(query)
    let productsQuery = Product.find(query)

    // Sorting
    if (sort === "price_asc") {
      productsQuery = productsQuery.sort({ price: 1 })
    } else if (sort === "price_desc") {
      productsQuery = productsQuery.sort({ price: -1 })
    } else if (sort === "newest") {
      productsQuery = productsQuery.sort({ createdAt: -1 })
    } else if (sort === "rating_desc") {
      productsQuery = productsQuery.sort({ rating: -1 })
    } else {
      productsQuery = productsQuery.sort({ createdAt: -1 }) // Default sort
    }

    productsQuery = productsQuery.limit(pageSize).skip(pageSize * (page - 1))

    const products = await productsQuery

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      totalProducts: count,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(500).json({ message: "Server Error" })
  }
})

// @route   GET /api/products/categories
// @desc    Get all unique product categories
// @access  Public
router.get("/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category")
    res.json({ categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    res.status(500).json({ message: "Server Error" })
  }
})

// GET recommendations based on cosine similarity
router.get("/recommendations/:userId", async (req, res) => {
  try {
    const Cart = require("../models/Cart")
    const cart = await Cart.findOne({ user: req.params.userId }).populate("items.product")

    if (!cart || cart.items.length === 0) {
      // Return featured or random products if no cart
      const products = await Product.find({ isFeatured: true }).limit(6)
      if (products.length < 6) {
        const additionalProducts = await Product.find({ isFeatured: { $ne: true } }).limit(6 - products.length)
        products.push(...additionalProducts)
      }
      return res.json({ success: true, recommendations: products })
    }

    // Get all products for similarity calculation
    const allProducts = await Product.find()
    const cartProductIds = cart.items.map((item) => item.product._id.toString())
    const cartProducts = cart.items.map((item) => item.product)

    // Create feature mappings for categorical data
    const allBrands = [...new Set(allProducts.map((p) => p.brand))]
    const allCategories = [...new Set(allProducts.map((p) => p.category))]
    const allTags = [...new Set(allProducts.flatMap((p) => p.tags || []))]

    // Function to create feature vector for a product
    const createFeatureVector = (product) => {
      const vector = []

      // Price feature (normalized to 0-1 range)
      const maxPrice = Math.max(...allProducts.map((p) => p.price))
      const minPrice = Math.min(...allProducts.map((p) => p.price))
      const normalizedPrice = (product.price - minPrice) / (maxPrice - minPrice || 1)
      vector.push(normalizedPrice)

      // Brand features (one-hot encoding)
      allBrands.forEach((brand) => {
        vector.push(product.brand === brand ? 1 : 0)
      })

      // Category features (one-hot encoding)
      allCategories.forEach((category) => {
        vector.push(product.category === category ? 1 : 0)
      })

      // Tag features (multi-hot encoding)
      allTags.forEach((tag) => {
        vector.push((product.tags || []).includes(tag) ? 1 : 0)
      })

      // Rating feature (normalized)
      vector.push((product.rating || 0) / 5)

      // Stock availability feature
      vector.push(product.countInStock > 0 ? 1 : 0)

      // Featured product feature
      vector.push(product.isFeatured ? 1 : 0)

      return vector
    }

    // Calculate cosine similarity between two vectors
    const calculateCosineSimilarity = (vectorA, vectorB) => {
      if (vectorA.length !== vectorB.length) return 0

      // Calculate dot product (A · B)
      let dotProduct = 0
      for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i]
      }

      // Calculate magnitude of vector A (||A||)
      let magnitudeA = 0
      for (let i = 0; i < vectorA.length; i++) {
        magnitudeA += vectorA[i] * vectorA[i]
      }
      magnitudeA = Math.sqrt(magnitudeA)

      // Calculate magnitude of vector B (||B||)
      let magnitudeB = 0
      for (let i = 0; i < vectorB.length; i++) {
        magnitudeB += vectorB[i] * vectorB[i]
      }
      magnitudeB = Math.sqrt(magnitudeB)

      // Avoid division by zero
      if (magnitudeA === 0 || magnitudeB === 0) return 0

      // Cosine similarity formula: (A · B) / (||A|| * ||B||)
      return dotProduct / (magnitudeA * magnitudeB)
    }

    // Create feature vectors for cart products
    const cartVectors = cartProducts.map(createFeatureVector)

    // Calculate average cart vector (user profile)
    const userProfileVector = new Array(cartVectors[0].length).fill(0)
    for (let i = 0; i < userProfileVector.length; i++) {
      let sum = 0
      for (let j = 0; j < cartVectors.length; j++) {
        sum += cartVectors[j][i]
      }
      userProfileVector[i] = sum / cartVectors.length
    }

    // Calculate similarity scores for all products not in cart
    const productSimilarities = []

    for (const product of allProducts) {
      if (!cartProductIds.includes(product._id.toString())) {
        const productVector = createFeatureVector(product)
        const similarity = calculateCosineSimilarity(userProfileVector, productVector)

        productSimilarities.push({
          product: product,
          similarity: similarity,
        })
      }
    }

    // Sort by similarity score (descending) and get top 6
    productSimilarities.sort((a, b) => b.similarity - a.similarity)
    const recommendations = productSimilarities.slice(0, 6).map((item) => item.product)

    res.json({
      success: true,
      recommendations,
      debug: {
        cartItemsCount: cartProducts.length,
        totalProductsAnalyzed: allProducts.length,
        topSimilarityScore: productSimilarities[0]?.similarity || 0,
      },
    })
  } catch (err) {
    console.error("Recommendation error:", err)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (product) {
      res.json(product)
    } else {
      res.status(404).json({ message: "Product not found" })
    }
  } catch (error) {
    console.error("Error fetching product by ID:", error)
    res.status(500).json({ message: "Server Error" })
  }
})

// @route   POST /api/products
// @desc    Create a new product (Admin only)
// @access  Private/Admin
router.post("/", protect, authorize(["admin"]), upload.array("images", 5), async (req, res) => {
  const { name, description, price, category, brand, countInStock, isFeatured } = req.body

  // Get image paths from multer
  const imagePaths = req.files.map((file) => `/uploads/${file.filename}`)

  try {
    const product = new Product({
      name,
      description,
      price,
      category,
      brand,
      countInStock: Number(countInStock),
      images: imagePaths,
      isFeatured: isFeatured === "true", // Convert string to boolean
    })

    const createdProduct = await product.save()
    res.status(201).json(createdProduct)
  } catch (error) {
    console.error("Error creating product:", error)
    res.status(500).json({ message: "Server Error", error: error.message })
  }
})

// @route   PUT /api/products/:id
// @desc    Update a product (Admin only)
// @access  Private/Admin
router.put("/:id", protect, authorize(["admin"]), upload.array("images", 5), async (req, res) => {
  const { name, description, price, category, brand, countInStock, isFeatured, existingImages } = req.body

  try {
    const product = await Product.findById(req.params.id)

    if (product) {
      product.name = name || product.name
      product.description = description || product.description
      product.price = price !== undefined ? Number(price) : product.price
      product.category = category || product.category
      product.brand = brand || product.brand
      product.countInStock = countInStock !== undefined ? Number(countInStock) : product.countInStock
      product.isFeatured = isFeatured !== undefined ? isFeatured === "true" : product.isFeatured

      // Handle images: combine existing images with new uploads
      let updatedImages = []
      if (existingImages) {
        // existingImages might be a string if only one, or array if multiple
        updatedImages = Array.isArray(existingImages) ? existingImages : [existingImages]
      }
      const newImagePaths = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : []
      product.images = [...updatedImages, ...newImagePaths]

      const updatedProduct = await product.save()
      res.json(updatedProduct)
    } else {
      res.status(404).json({ message: "Product not found" })
    }
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ message: "Server Error", error: error.message })
  }
})

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin only)
// @access  Private/Admin
router.delete("/:id", protect, authorize(["admin"]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (product) {
      await product.deleteOne()
      res.json({ message: "Product removed" })
    } else {
      res.status(404).json({ message: "Product not found" })
    }
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ message: "Server Error" })
  }
})

module.exports = router

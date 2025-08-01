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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"), false)
    }
  },
})

// @route   GET /api/products
// @desc    Get all products with filters, search, and pagination
// @access  Public
router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 12
    const searchTerm = req.query.search ? req.query.search.toLowerCase() : ""
    const brand = req.query.brand ? req.query.brand.toLowerCase() : ""
    const tag = req.query.tag ? req.query.tag.toLowerCase() : ""
    const minPrice = Number.parseFloat(req.query.minPrice) || 0
    const maxPrice = Number.parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER
    const sortBy = req.query.sortBy || "name"

    const query = {}

    // Search functionality
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ]
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: brand, $options: "i" }
    }

    // Tag filter
    if (tag) {
      query.tag = { $regex: tag, $options: "i" }
    }

    // Price range filter
    query.price = { $gte: minPrice, $lte: maxPrice }

    const totalProducts = await Product.countDocuments(query)
    const totalPages = Math.ceil(totalProducts / limit)
    const skip = (page - 1) * limit

    let productsQuery = Product.find(query)

    // Sorting
    switch (sortBy) {
      case "price-low":
        productsQuery = productsQuery.sort({ price: 1 })
        break
      case "price-high":
        productsQuery = productsQuery.sort({ price: -1 })
        break
      case "rating":
        productsQuery = productsQuery.sort({ rating: -1 })
        break
      case "name":
      default:
        productsQuery = productsQuery.sort({ name: 1 })
        break
    }

    productsQuery = productsQuery.limit(limit).skip(skip)

    const products = await productsQuery

    // Return the structure that your frontend expects
    res.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(500).json({ success: false, message: "Server Error" })
  }
})

// New route for filter options
// @route   GET /api/products/filter-options
// @desc    Get distinct categories, tags, and brands for filtering
// @access  Public
router.get("/filter-options", async (req, res) => {
  try {
    const brands = await Product.distinct("brand")
    const tags = await Product.distinct("tag")
    const categories = await Product.distinct("category") // Add this line to fetch categories

    res.json({
      success: true,
      brands: brands.filter(Boolean), // Remove empty values
      tags: tags.filter(Boolean), // Remove empty values
      categories: categories.filter(Boolean), // Include categories in the response
    })
  } catch (error) {
    console.error("Error fetching filter options:", error)
    res.status(500).json({ success: false, message: "Server Error" })
  }
})
// @route   POST /api/products
// @desc    Create a new product (Admin only)
// @access  Private/Admin
router.post("/", upload.single("image"), async (req, res) => {
  try {
    console.log("=== PRODUCT CREATION DEBUG ===")
    console.log("Request body:", req.body)
    console.log("File received:", req.file) // Changed to req.file for single upload

    const { name, description, price, category, brand, countInStock, isFeatured, tag } = req.body

    // Validate required fields
    if (!name || !price || !brand || !tag) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["name", "price", "brand", "tag"],
        received: { name, price, brand, tag },
      })
    }

    // Process single image
    const imagePath = req.file ? `/uploads/${req.file.filename}` : "" // Changed to single image path

    console.log("Image path created:", imagePath)
    console.log("Stock value received:", countInStock)
    console.log("Stock value parsed:", Number(countInStock) || 0)

    // Create product with the exact field names your schema expects
    const productData = {
      name: name.trim(),
      description: description ? description.trim() : "",
      price: Number(price),
      brand: brand.trim(),
      tag: tag.trim(),
      category: category ? category.trim() : tag.trim(), // Use tag as category if not provided
      stock: Number(countInStock) || 0, // Map countInStock to stock for your schema
      image: imagePath, // Store as single string
      rating: 0,
      reviews: 0,
      isFeatured: isFeatured === "true" || isFeatured === true,
      createdAt: new Date(),
    }

    console.log("Product data to save:", productData)

    const product = new Product(productData)
    const createdProduct = await product.save()

    console.log("Product saved successfully:", createdProduct)
    console.log("=== END DEBUG ===")

    res.status(201).json(createdProduct)
  } catch (error) {
    console.error("=== PRODUCT CREATION ERROR ===")
    console.error("Error creating product:", error)
    console.error("Error details:", error.message)
    if (error.errors) {
      console.error("Validation errors:", error.errors)
    }
    console.error("=== END ERROR DEBUG ===")

    res.status(500).json({
      message: "Server Error",
      error: error.message,
      details: error.errors
        ? Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message,
          }))
        : null,
    })
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

// @route   PUT /api/products/:id
// @desc    Update a product (Admin only)
// @access  Private/Admin
router.put("/:id", upload.single("image"), async (req, res) => {
  const { name, description, price, category, brand, countInStock, isFeatured } = req.body

  try {
    const product = await Product.findById(req.params.id)

    if (product) {
      product.name = name || product.name
      product.description = description || product.description
      product.price = price !== undefined ? Number(price) : product.price
      product.category = category || product.category
      product.brand = brand || product.brand
      product.stock = countInStock !== undefined ? Number(countInStock) : product.stock
      product.isFeatured = isFeatured !== undefined ? isFeatured === "true" : product.isFeatured

      // Handle single image update
      if (req.file) {
        product.image = `/uploads/${req.file.filename}`
      } else if (req.body.clearImage === "true") {
        // Optional: allow clearing the image if a flag is sent
        product.image = ""
      }

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
router.delete("/:id", async (req, res) => {
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

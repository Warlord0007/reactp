const express = require("express")
const router = express.Router()
const Cart = require("../models/Cart")
const Product = require("../models/Product")
const { protect } = require("../middleware/authMiddleware")

// @route   POST /api/checkout/validate
// @desc    Validate checkout data and calculate totals
// @access  Private
router.post("/validate", async (req, res) => {
  try {
    const { shippingAddress } = req.body
    const userId = req.user.id

    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate("items.productId", "name price images brand tag stock")

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      })
    }

    // Validate all products are still available and in stock
    const unavailableItems = []
    let subtotal = 0

    for (const item of cart.items) {
      const product = item.productId
      if (!product || product.stock < item.quantity) {
        unavailableItems.push({
          name: item.name,
          requestedQuantity: item.quantity,
          availableStock: product ? product.stock : 0,
        })
      } else {
        subtotal += product.price * item.quantity
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some items are no longer available",
        unavailableItems,
      })
    }

    // Calculate shipping cost (free shipping over Rs 2000)
    const shippingCost = subtotal >= 2000 ? 0 : 150

    // Calculate VAT (13% in Nepal)
    const vatAmount = Math.round(subtotal * 0.13)

    // Calculate total
    const totalAmount = subtotal + shippingCost + vatAmount

    // Validate shipping address
    const requiredFields = ["fullName", "email", "phone", "address", "city", "province", "postalCode"]
    const missingFields = requiredFields.filter((field) => !shippingAddress[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required shipping information",
        missingFields,
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(shippingAddress.email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      })
    }

    // Phone validation (Nepal format)
    const phoneRegex = /^(\+977)?[0-9]{10}$/
    if (!phoneRegex.test(shippingAddress.phone.replace(/\s/g, ""))) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number. Please use Nepal format (10 digits)",
      })
    }

    res.json({
      success: true,
      checkout: {
        items: cart.items.map((item) => ({
          productId: item.productId._id,
          name: item.productId.name,
          image: item.productId.images[0],
          price: item.productId.price,
          quantity: item.quantity,
          brand: item.productId.brand,
          tag: item.productId.tag,
        })),
        shippingAddress,
        orderSummary: {
          subtotal,
          shippingCost,
          vatAmount,
          totalAmount,
        },
      },
    })
  } catch (error) {
    console.error("Checkout validation error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during checkout validation",
    })
  }
})

// @route   GET /api/checkout/shipping-rates
// @desc    Get shipping rates for different provinces
// @access  Private
router.get("/shipping-rates", async (req, res) => {
  try {
    const shippingRates = {
      "Province 1": { standard: 150, express: 300 },
      "Madhesh Province": { standard: 180, express: 350 },
      "Bagmati Province": { standard: 100, express: 200 },
      "Gandaki Province": { standard: 200, express: 400 },
      "Lumbini Province": { standard: 220, express: 450 },
      "Karnali Province": { standard: 300, express: 600 },
      "Sudurpashchim Province": { standard: 280, express: 550 },
    }

    res.json({
      success: true,
      shippingRates,
      freeShippingThreshold: 2000,
    })
  } catch (error) {
    console.error("Error fetching shipping rates:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching shipping rates",
    })
  }
})

module.exports = router

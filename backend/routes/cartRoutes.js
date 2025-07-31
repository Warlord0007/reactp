const express = require("express")
const router = express.Router()
const Cart = require("../models/Cart")
const Product = require("../models/Product")

// GET user's cart
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId }).populate("items.product")
    if (!cart) {
      return res.json({ success: true, cart: { items: [] } })
    }
    res.json({ success: true, cart })
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// POST add item to cart
router.post("/", async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body

    let cart = await Cart.findOne({ user: userId })

    if (!cart) {
      cart = new Cart({ user: userId, items: [] })
    }

    const existingItemIndex = cart.items.findIndex((item) => item.product.toString() === productId)

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity
    } else {
      cart.items.push({ product: productId, quantity })
    }

    cart.updatedAt = new Date()
    await cart.save()

    const populatedCart = await Cart.findById(cart._id).populate("items.product")
    res.json({ success: true, cart: populatedCart })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// PUT update item quantity
router.put("/:userId/:productId", async (req, res) => {
  try {
    const { quantity } = req.body
    const cart = await Cart.findOne({ user: req.params.userId })

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" })
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === req.params.productId)

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found in cart" })
    }

    cart.items[itemIndex].quantity = quantity
    cart.updatedAt = new Date()
    await cart.save()

    const populatedCart = await Cart.findById(cart._id).populate("items.product")
    res.json({ success: true, cart: populatedCart })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// DELETE remove item from cart
router.delete("/:userId/:productId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId })

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" })
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId)

    cart.updatedAt = new Date()
    await cart.save()

    const populatedCart = await Cart.findById(cart._id).populate("items.product")
    res.json({ success: true, cart: populatedCart })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

module.exports = router

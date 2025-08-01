const express = require("express")
const router = express.Router()
const Cart = require("../models/Cart")
const Product = require("../models/Product")
const { trackCartAddition } = require("../middleware")

// GET user's cart
router.get("/:userId", async (req, res) => {
  try {
    console.log(`[CART] Getting cart for user: ${req.params.userId}`)
    const cart = await Cart.findOne({ user: req.params.userId }).populate("items.product")
    if (!cart) {
      console.log(`[CART] No cart found, returning empty cart`)
      return res.json({ success: true, cart: { items: [] } })
    }
    console.log(`[CART] Found cart with ${cart.items.length} items`)
    res.json({ success: true, cart })
  } catch (err) {
    console.error("[CART] Get cart error:", err)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// POST add item to cart - FIXED to match frontend expectation
router.post("/", async (req, res) => {
  try {
    console.log("[CART] POST / - Add to cart request received")
    console.log("[CART] Request body:", req.body)

    const { userId, productId, quantity = 1 } = req.body

    if (!userId || !productId) {
      console.log("[CART] Missing required fields")
      return res.status(400).json({
        success: false,
        message: "userId and productId are required",
      })
    }

    // Validate product exists
    console.log(`[CART] Validating product ${productId}`)
    const product = await Product.findById(productId)
    if (!product) {
      console.log(`[CART] Product ${productId} not found`)
      return res.status(404).json({ success: false, message: "Product not found" })
    }

    console.log(`[CART] Adding product ${productId} to cart for user ${userId}`)

    let cart = await Cart.findOne({ user: userId })
    if (!cart) {
      console.log("[CART] Creating new cart")
      cart = new Cart({ user: userId, items: [] })
    }

    const existingItemIndex = cart.items.findIndex((item) => item.product.toString() === productId)

    if (existingItemIndex > -1) {
      console.log("[CART] Product exists, updating quantity")
      cart.items[existingItemIndex].quantity += quantity
    } else {
      console.log("[CART] Adding new product to cart")
      cart.items.push({ product: productId, quantity })
    }

    cart.updatedAt = new Date()
    await cart.save()

    const populatedCart = await Cart.findById(cart._id).populate("items.product")
    console.log(`[CART] Success! Cart now has ${populatedCart.items.length} items`)

    res.json({ success: true, cart: populatedCart, message: "Item added to cart" })
  } catch (err) {
    console.error("[CART] Add to cart error:", err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// PUT update item quantity - Using productId instead of itemId
router.put("/:userId/:productId", async (req, res) => {
  try {
    console.log(`[CART] Updating quantity for user ${req.params.userId}, product ${req.params.productId}`)
    const { quantity } = req.body
    const { userId, productId } = req.params

    const cart = await Cart.findOne({ user: userId })
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" })
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId)
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found in cart" })
    }

    if (quantity <= 0) {
      console.log("[CART] Removing item (quantity <= 0)")
      cart.items.splice(itemIndex, 1)
    } else {
      console.log(`[CART] Updating quantity to ${quantity}`)
      cart.items[itemIndex].quantity = quantity
    }

    cart.updatedAt = new Date()
    await cart.save()

    const populatedCart = await Cart.findById(cart._id).populate("items.product")
    console.log("[CART] Quantity updated successfully")
    res.json({ success: true, cart: populatedCart, message: "Cart updated" })
  } catch (err) {
    console.error("[CART] Update cart error:", err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE remove item from cart - Using productId instead of itemId
router.delete("/:userId/:productId", async (req, res) => {
  try {
    console.log(`[CART] Removing product ${req.params.productId} from user ${req.params.userId} cart`)
    const { userId, productId } = req.params

    const cart = await Cart.findOne({ user: userId })
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" })
    }

    const initialLength = cart.items.length
    cart.items = cart.items.filter((item) => item.product.toString() !== productId)

    if (cart.items.length === initialLength) {
      return res.status(404).json({ success: false, message: "Item not found in cart" })
    }

    cart.updatedAt = new Date()
    await cart.save()

    const populatedCart = await Cart.findById(cart._id).populate("items.product")
    console.log(`[CART] Item removed! Cart now has ${populatedCart.items.length} items`)
    res.json({ success: true, cart: populatedCart, message: "Item removed from cart" })
  } catch (err) {
    console.error("[CART] Remove from cart error:", err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE clear entire cart
router.delete("/:userId", async (req, res) => {
  try {
    console.log(`[CART] Clearing cart for user ${req.params.userId}`)
    const userId = req.params.userId

    const cart = await Cart.findOne({ user: userId })
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" })
    }

    cart.items = []
    cart.updatedAt = new Date()
    await cart.save()

    console.log("[CART] Cart cleared successfully")
    res.json({ success: true, cart, message: "Cart cleared" })
  } catch (err) {
    console.error("[CART] Clear cart error:", err)
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router

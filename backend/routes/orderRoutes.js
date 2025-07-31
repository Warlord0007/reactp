const express = require("express")
const router = express.Router()
const Order = require("../models/Order")
const { protect, authorize } = require("../middleware/authMiddleware")

// @route   GET /api/orders/my-orders
// @desc    Get logged in user's orders
// @access  Private
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("items.productId", "name images")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      orders,
    })
  } catch (error) {
    console.error("Error fetching user orders:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    })
  }
})

// @route   GET /api/orders/:orderId
// @desc    Get order by ID
// @access  Private
router.get("/:orderId", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("items.productId", "name images")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if user owns this order or is admin
    if (order.userId.toString() !== req.user.id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      })
    }

    res.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching order",
    })
  }
})

// @route   GET /api/orders
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get("/", protect, authorize(["admin"]), async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status
    const startDate = req.query.startDate
    const endDate = req.query.endDate

    // Build query
    const query = {}
    if (status && status !== "all") {
      query.status = status
    }
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    const orders = await Order.find(query)
      .populate("userId", "username email")
      .populate("items.productId", "name images")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Order.countDocuments(query)

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching all orders:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    })
  }
})

// @route   PUT /api/orders/:orderId/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put("/:orderId/status", protect, authorize(["admin"]), async (req, res) => {
  try {
    const { status, trackingNumber, notes } = req.body
    const order = await Order.findById(req.params.orderId)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      })
    }

    order.status = status
    if (trackingNumber) order.trackingNumber = trackingNumber
    if (notes) order.notes = notes

    // Update estimated delivery for shipped orders
    if (status === "shipped" && !order.estimatedDelivery) {
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + 3) // 3 days from shipping
      order.estimatedDelivery = deliveryDate
    }

    await order.save()

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    res.status(500).json({
      success: false,
      message: "Error updating order status",
    })
  }
})

// @route   POST /api/orders/:orderId/cancel
// @desc    Cancel order (User can cancel pending/confirmed orders)
// @access  Private
router.post("/:orderId/cancel", protect, async (req, res) => {
  try {
    const { reason } = req.body
    const order = await Order.findById(req.params.orderId)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if user owns this order
    if (order.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      })
    }

    // Check if order can be cancelled
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      })
    }

    order.status = "cancelled"
    order.notes = reason || "Cancelled by customer"

    // Restore product stock
    const Product = require("../models/Product")
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      })
    }

    await order.save()

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    })
  } catch (error) {
    console.error("Error cancelling order:", error)
    res.status(500).json({
      success: false,
      message: "Error cancelling order",
    })
  }
})

// @route   GET /api/orders/track/:orderNumber
// @desc    Track order by order number
// @access  Public
router.get("/track/:orderNumber", async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber }).select(
      "orderNumber status trackingNumber estimatedDelivery createdAt shippingAddress items",
    )

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Create tracking timeline
    const timeline = [
      {
        status: "pending",
        title: "Order Placed",
        description: "Your order has been placed successfully",
        date: order.createdAt,
        completed: true,
      },
      {
        status: "confirmed",
        title: "Order Confirmed",
        description: "Your order has been confirmed and is being prepared",
        completed: ["confirmed", "processing", "shipped", "delivered"].includes(order.status),
      },
      {
        status: "processing",
        title: "Processing",
        description: "Your order is being processed and packed",
        completed: ["processing", "shipped", "delivered"].includes(order.status),
      },
      {
        status: "shipped",
        title: "Shipped",
        description: "Your order has been shipped",
        completed: ["shipped", "delivered"].includes(order.status),
      },
      {
        status: "delivered",
        title: "Delivered",
        description: "Your order has been delivered",
        completed: order.status === "delivered",
      },
    ]

    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        timeline,
        itemCount: order.items.length,
        shippingCity: order.shippingAddress.city,
      },
    })
  } catch (error) {
    console.error("Error tracking order:", error)
    res.status(500).json({
      success: false,
      message: "Error tracking order",
    })
  }
})

module.exports = router

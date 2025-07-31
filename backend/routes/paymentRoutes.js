const express = require("express")
const router = express.Router()
const Order = require("../models/Order")
const Cart = require("../models/Cart")
const Product = require("../models/Product")
const { protect } = require("../middleware/authMiddleware")

// @route   POST /api/payment/process
// @desc    Process payment and create order
// @access  Private
router.post("/process", protect, async (req, res) => {
  try {
    const { paymentMethod, paymentDetails, shippingAddress, orderSummary } = req.body
    const userId = req.user.id

    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate("items.productId")

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      })
    }

    // Validate payment method
    const validPaymentMethods = ["card", "upi", "netbanking", "esewa", "khalti", "fonepay", "banktransfer", "cod"]
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      })
    }

    // Process payment based on method
    let paymentResult = {
      method: paymentMethod,
      status: "pending",
      transactionId: generateTransactionId(),
    }

    switch (paymentMethod) {
      case "card":
        paymentResult = await processCardPayment(paymentDetails)
        break
      case "esewa":
        paymentResult = await processEsewaPayment(paymentDetails)
        break
      case "khalti":
        paymentResult = await processKhaltiPayment(paymentDetails)
        break
      case "fonepay":
        paymentResult = await processFonepayPayment(paymentDetails)
        break
      case "banktransfer":
        paymentResult = await processBankTransfer(paymentDetails)
        break
      case "netbanking":
        paymentResult = await processNetBanking(paymentDetails)
        break
      case "cod":
        paymentResult = {
          method: "cod",
          status: "pending",
          transactionId: generateTransactionId(),
        }
        break
    }

    // Create order
    const orderItems = cart.items.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      image: item.productId.images[0],
      price: item.productId.price,
      quantity: item.quantity,
      brand: item.productId.brand,
      tag: item.productId.tag,
    }))

    const order = new Order({
      userId,
      items: orderItems,
      shippingAddress,
      paymentDetails: paymentResult,
      orderSummary,
      status: paymentResult.status === "completed" ? "confirmed" : "pending",
      estimatedDelivery: calculateEstimatedDelivery(shippingAddress.province),
    })

    await order.save()

    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId._id, {
        $inc: { stock: -item.quantity },
      })
    }

    // Clear cart
    cart.items = []
    await cart.save()

    res.json({
      success: true,
      message: "Order placed successfully",
      order: {
        orderNumber: order.orderNumber,
        _id: order._id,
        status: order.status,
        totalAmount: order.orderSummary.totalAmount,
        estimatedDelivery: order.estimatedDelivery,
        paymentStatus: paymentResult.status,
      },
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    res.status(500).json({
      success: false,
      message: "Payment processing failed",
      error: error.message,
    })
  }
})

// @route   GET /api/payment/methods
// @desc    Get available payment methods
// @access  Private
router.get("/methods", protect, async (req, res) => {
  try {
    const paymentMethods = {
      digitalWallets: [
        {
          id: "esewa",
          name: "eSewa",
          description: "Pay with eSewa digital wallet",
          icon: "esewa",
          fees: "No additional fees",
        },
        {
          id: "khalti",
          name: "Khalti",
          description: "Pay with Khalti digital wallet",
          icon: "khalti",
          fees: "No additional fees",
        },
        {
          id: "fonepay",
          name: "FonePay",
          description: "Pay with FonePay digital wallet",
          icon: "fonepay",
          fees: "No additional fees",
        },
      ],
      bankTransfer: {
        id: "banktransfer",
        name: "Bank Transfer",
        description: "Direct bank account transfer",
        fees: "Bank charges may apply",
      },
      netBanking: {
        id: "netbanking",
        name: "Net Banking",
        description: "Pay using your bank's online portal",
        fees: "No additional fees",
        banks: [
          "Siddhartha Bank Limited",
          "NIC Asia Bank",
          "Nabil Bank Limited",
          "Nepal Investment Bank",
          "Standard Chartered Bank Nepal",
          "Himalayan Bank Limited",
          "Nepal SBI Bank",
          "Everest Bank Limited",
          "Bank of Kathmandu",
          "Nepal Bangladesh Bank",
          "Laxmi Bank Limited",
          "Citizens Bank International",
          "Prime Commercial Bank",
          "Sunrise Bank Limited",
          "Century Commercial Bank",
          "Sanima Bank Limited",
          "Machhapuchchhre Bank Limited",
          "Kumari Bank Limited",
          "Prabhu Bank Limited",
          "Mega Bank Nepal Limited",
        ],
      },
      card: {
        id: "card",
        name: "Credit/Debit Card",
        description: "Pay with Visa, Mastercard, or local cards",
        fees: "No additional fees",
      },
      cod: {
        id: "cod",
        name: "Cash on Delivery",
        description: "Pay when your order is delivered",
        fees: "Rs 50 handling charge",
      },
    }

    res.json({
      success: true,
      paymentMethods,
    })
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching payment methods",
    })
  }
})

// @route   POST /api/payment/verify
// @desc    Verify payment status
// @access  Private
router.post("/verify", protect, async (req, res) => {
  try {
    const { transactionId, paymentMethod } = req.body

    // In a real application, you would verify with the actual payment gateway
    // For now, we'll simulate verification
    const verificationResult = {
      transactionId,
      status: "completed",
      verifiedAt: new Date(),
    }

    // Update order payment status
    const order = await Order.findOne({
      "paymentDetails.transactionId": transactionId,
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    order.paymentDetails.status = verificationResult.status
    order.paymentDetails.paidAt = verificationResult.verifiedAt
    order.status = "confirmed"
    await order.save()

    res.json({
      success: true,
      message: "Payment verified successfully",
      verificationResult,
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    })
  }
})

// Helper functions
function generateTransactionId() {
  return `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

async function processCardPayment(paymentDetails) {
  // Simulate card payment processing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        method: "card",
        status: "completed",
        transactionId: generateTransactionId(),
        paymentGateway: "Nepal Payment Gateway",
        cardLast4: paymentDetails.cardNumber.slice(-4),
        paidAt: new Date(),
      })
    }, 2000)
  })
}

async function processEsewaPayment(paymentDetails) {
  // Simulate eSewa payment processing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        method: "esewa",
        status: "completed",
        transactionId: generateTransactionId(),
        paymentGateway: "eSewa",
        walletId: paymentDetails.esewaId,
        paidAt: new Date(),
      })
    }, 1500)
  })
}

async function processKhaltiPayment(paymentDetails) {
  // Simulate Khalti payment processing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        method: "khalti",
        status: "completed",
        transactionId: generateTransactionId(),
        paymentGateway: "Khalti",
        walletId: paymentDetails.khaltiId,
        paidAt: new Date(),
      })
    }, 1500)
  })
}

async function processFonepayPayment(paymentDetails) {
  // Simulate FonePay payment processing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        method: "fonepay",
        status: "completed",
        transactionId: generateTransactionId(),
        paymentGateway: "FonePay",
        walletId: paymentDetails.fonepayId,
        paidAt: new Date(),
      })
    }, 1500)
  })
}

async function processBankTransfer(paymentDetails) {
  // Bank transfer requires manual verification
  return {
    method: "banktransfer",
    status: "pending",
    transactionId: generateTransactionId(),
    bankName: paymentDetails.bankName,
    accountNumber: paymentDetails.accountNumber,
  }
}

async function processNetBanking(paymentDetails) {
  // Simulate net banking processing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        method: "netbanking",
        status: "completed",
        transactionId: generateTransactionId(),
        paymentGateway: paymentDetails.selectedBank,
        bankName: paymentDetails.selectedBank,
        paidAt: new Date(),
      })
    }, 3000)
  })
}

function calculateEstimatedDelivery(province) {
  const deliveryDays = {
    "Bagmati Province": 2,
    "Province 1": 3,
    "Madhesh Province": 3,
    "Gandaki Province": 4,
    "Lumbini Province": 4,
    "Karnali Province": 7,
    "Sudurpashchim Province": 6,
  }

  const days = deliveryDays[province] || 5
  const estimatedDate = new Date()
  estimatedDate.setDate(estimatedDate.getDate() + days)
  return estimatedDate
}

module.exports = router

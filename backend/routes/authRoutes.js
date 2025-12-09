const express = require("express")
const { register, login, forgotPassword } = require("../controllers/authController")
const { protect } = require("../middleware/authMiddleware") // Import the protect middleware
const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.post("/forgot-password", forgotPassword)

// @route   GET /api/auth/verify
// @desc    Verify user token and get user data
// @access  Private
router.get("/verify", protect, (req, res) => {
  // The 'protect' middleware already attaches the user to req.user
  res.json({
    success: true,
    user: {
      _id: req.user.id,
      name: req.user.name, // Use 'name' as per your controller
      email: req.user.email,
      role: req.user.role,
    },
    message: "Token verified successfully",
  })
})

module.exports = router

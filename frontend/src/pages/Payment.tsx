"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Building, Shield, ArrowLeft, CheckCircle } from "lucide-react"

const Payment = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("esewa")
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const { shippingInfo, cartItems, total } = location.state || {}

  const [bankDetails, setBankDetails] = useState({
    selectedBank: "",
    accountNumber: "",
    accountHolder: "",
  })

  const [digitalWalletId, setDigitalWalletId] = useState("")

  useEffect(() => {
    if (!shippingInfo || !cartItems || !total) {
      navigate("/checkout")
    }
  }, [shippingInfo, cartItems, total, navigate])

  const nepalBanks = [
    "Siddhartha Bank Limited",
    "NIC Asia Bank",
    "Nabil Bank Limited",
    "Nepal Investment Bank",
    "Standard Chartered Bank Nepal",
    "Himalayan Bank Limited",
    "Nepal SBI Bank",
    "Everest Bank Limited",
    "Bank of Kathmandu",
    "Century Commercial Bank",
    "Prime Commercial Bank",
    "Sunrise Bank Limited",
    "NMB Bank Limited",
    "Global IME Bank",
    "Citizens Bank International",
    "Machhapuchchhre Bank Limited",
    "Kumari Bank Limited",
    "Laxmi Sunrise Bank",
    "Sanima Bank Limited",
    "NCC Bank Limited",
  ]

  const digitalWallets = [
    { id: "esewa", name: "eSewa", icon: "💳" },
    { id: "khalti", name: "Khalti", icon: "📱" },
    { id: "fonepay", name: "FonePay", icon: "💰" },
  ]

  const handleBankInputChange = (e) => {
    setBankDetails({
      ...bankDetails,
      [e.target.name]: e.target.value,
    })
  }

  const validateBankDetails = () => {
    const { selectedBank, accountNumber, accountHolder } = bankDetails
    return selectedBank !== "" && accountNumber.trim() !== "" && accountHolder.trim() !== ""
  }

  const validateDigitalWallet = () => {
    return digitalWalletId.trim() !== ""
  }

  const processPayment = async () => {
    setLoading(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Create order after successful payment
      const user = JSON.parse(localStorage.getItem("user"))
      const orderData = {
        userId: user.id,
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
        })),
        shippingAddress: shippingInfo,
        paymentMethod: "online",
        paymentDetails: {
          method: paymentMethod,
          ...(paymentMethod === "bank" ? bankDetails : { walletId: digitalWalletId }),
        },
        totalAmount: total,
        paymentResult: {
          id: `pay_${Date.now()}`,
          status: "completed",
          method: paymentMethod,
          timestamp: new Date().toISOString(),
        },
      }

      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (data.success) {
        setPaymentSuccess(true)
        setTimeout(() => {
          navigate("/orders")
        }, 3000)
      } else {
        throw new Error("Order creation failed")
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = () => {
    let isValid = false

    switch (paymentMethod) {
      case "bank":
        isValid = validateBankDetails()
        break
      case "esewa":
      case "khalti":
      case "fonepay":
        isValid = validateDigitalWallet()
        break
      default:
        isValid = false
    }

    if (!isValid) {
      alert("Please fill in all required payment details correctly.")
      return
    }

    processPayment()
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full mx-4">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">Your order has been placed successfully.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Order Total</p>
            <p className="text-2xl font-bold text-green-600">Rs{total?.toLocaleString()}</p>
          </div>

          <p className="text-sm text-gray-500 mb-4">Redirecting to your orders page in a few seconds...</p>

          <button
            onClick={() => navigate("/orders")}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            View Orders
          </button>
        </div>
      </div>
    )
  }

  if (!shippingInfo || !cartItems || !total) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid payment session</p>
          <button
            onClick={() => navigate("/checkout")}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Checkout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/checkout")}
            className="flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Checkout
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-gray-600 mt-2">Secure payment for Nepal</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <Shield className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Secure Payment</h2>
              </div>

              {/* Payment Method Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {digitalWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => setPaymentMethod(wallet.id)}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      paymentMethod === wallet.id
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{wallet.icon}</div>
                    <p className="font-medium">{wallet.name}</p>
                  </button>
                ))}

                <button
                  onClick={() => setPaymentMethod("bank")}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    paymentMethod === "bank"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Building className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">Bank Transfer</p>
                </button>
              </div>

              {/* Payment Forms */}
              {(paymentMethod === "esewa" || paymentMethod === "khalti" || paymentMethod === "fonepay") && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {paymentMethod === "esewa" && "eSewa Payment"}
                    {paymentMethod === "khalti" && "Khalti Payment"}
                    {paymentMethod === "fonepay" && "FonePay Payment"}
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {paymentMethod === "esewa" && "eSewa ID *"}
                      {paymentMethod === "khalti" && "Khalti Mobile Number *"}
                      {paymentMethod === "fonepay" && "FonePay Mobile Number *"}
                    </label>
                    <input
                      type="text"
                      value={digitalWalletId}
                      onChange={(e) => setDigitalWalletId(e.target.value)}
                      placeholder={paymentMethod === "esewa" ? "Enter your eSewa ID" : "Enter your mobile number"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> You will be redirected to{" "}
                      {paymentMethod === "esewa" ? "eSewa" : paymentMethod === "khalti" ? "Khalti" : "FonePay"} to
                      complete your payment securely.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === "bank" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Transfer Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Bank *</label>
                    <select
                      name="selectedBank"
                      value={bankDetails.selectedBank}
                      onChange={handleBankInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Choose your bank</option>
                      {nepalBanks.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name *</label>
                    <input
                      type="text"
                      name="accountHolder"
                      value={bankDetails.accountHolder}
                      onChange={handleBankInputChange}
                      placeholder="Enter account holder name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={bankDetails.accountNumber}
                      onChange={handleBankInputChange}
                      placeholder="Enter your account number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      You will be redirected to your bank's secure login page to complete the payment.
                    </p>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-800">
                    Your payment information is encrypted and secure. We never store your banking details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                {cartItems?.slice(0, 3).map((item) => (
                  <div key={item._id} className="flex items-center space-x-3">
                    <img
                      src={
                        item.image
                          ? `http://localhost:5000${item.image}`
                          : `/placeholder.svg?height=40&width=40&text=${item.name}`
                      }
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium">Rs{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                {cartItems?.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">+{cartItems.length - 3} more items</p>
                )}
              </div>

              <div className="border-t pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount</span>
                  <span className="text-purple-600">Rs{total?.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  `Pay Rs${total?.toLocaleString()}`
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                By proceeding, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment

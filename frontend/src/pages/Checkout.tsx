"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom"
import { CreditCard, Truck, MapPin, User, Phone, Mail } from "lucide-react"

interface CartItem {
  _id: string
  productId: string
  name: string
  image: string
  price: number
  quantity: number
}

interface ShippingInfo {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}

const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [orderLoading, setOrderLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation();
  const { finalTotal } = location.state || { finalTotal: 0 };

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Nepal",
  })

  const [paymentMethod, setPaymentMethod] = useState("online")

  useEffect(() => {
    fetchCartItems()
  }, [])

  const fetchCartItems = async () => {
    const user = localStorage.getItem("user")
    if (!user) {
  return (
    <div className="text-center py-10 text-xl font-semibold">
      Please log in to continue.
    </div>
  );
}

    const userData = JSON.parse(user)
    try {
      const response = await fetch(`http://localhost:5000/api/cart/${userData.id}`)
      const data = await response.json()
      if (data.success) {
        setCartItems(data.cart.items || [])
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
    const shipping = subtotal > 2000 ? 0 : 100 // Free shipping above Rs 2000
    const tax = subtotal * 0.13 // 13% VAT in Nepal
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax,
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setShippingInfo({
      ...shippingInfo,
      [name as keyof ShippingInfo]: value,
    })
  }

  const validateForm = () => {
    const required: (keyof ShippingInfo)[] = ["fullName", "email", "phone", "address", "city", "state", "postalCode"]
    return required.every((field) => shippingInfo[field].trim() !== "")
  }

const handlePlaceOrder = async () => {
  if (!validateForm()) {
    alert("Please fill in all required fields")
    return
  }

  const user = localStorage.getItem("user")
  if (!user) {
    navigate("/login")
    return
  }

  const userData = JSON.parse(user)
  
  if (paymentMethod === "online") {
    // Redirect to payment page
    navigate("/payment", {
      state: {
        shippingInfo,
        cartItems,
        total: calculateTotal().total,
      },
    })
  } else if (paymentMethod === "cod") {
    setOrderLoading(true)
    try {
      const totals = calculateTotal()

      const orderData = {
        userId: userData.id, // must be valid ObjectId
        items: cartItems.map(item => ({
          productId: item._id, // map correct product ID
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: shippingInfo.fullName,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          province: shippingInfo.state, // map 'state' → 'province'
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country || "Nepal",
        },
        paymentMethod: "cod",
        totalAmount: totals.total,
      }

      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      const data = await res.json()
      if (data.success) {
        window.alert(" Your order has been confirmed! You will pay on delivery.")
        navigate("/order")
      } else {
        window.alert(" Failed to place order. Please try again.")
        console.error(data)
      }
    } catch (error) {
      console.error("Error placing COD order:", error)
      window.alert(" Failed to place order. Please try again.")
    } finally {
      setOrderLoading(false)
    }
  }
}


  const totals = calculateTotal()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate("/products")}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <MapPin className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Shipping Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={shippingInfo.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={shippingInfo.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={shippingInfo.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    readOnly
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                  <textarea
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingInfo.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State/Province *</label>
                  <select
                    name="state"
                    value={shippingInfo.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Province</option>
                    <option value="Province 1">Province 1</option>
                    <option value="Madhesh Province">Madhesh Province</option>
                    <option value="Bagmati Province">Bagmati Province</option>
                    <option value="Gandaki Province">Gandaki Province</option>
                    <option value="Lumbini Province">Lumbini Province</option>
                    <option value="Karnali Province">Karnali Province</option>
                    <option value="Sudurpashchim Province">Sudurpashchim Province</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={shippingInfo.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <CreditCard className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
              </div>

              <div className="space-y-4">


                <div className="flex items-center">
                  <input
                    id="cod"
                    name="payment"
                    type="radio"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  />
                  <label htmlFor="cod" className="ml-3 block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <Truck className="w-5 h-5 mr-2 text-green-600" />
                      Cash on Delivery
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Pay when your order is delivered</p>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
 <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
  <div className="space-y-4">
    {(() => {
      // Use finalTotal from cart page or calculate total from cartItems
      // Shipping cost: free above Rs2000, else 100
      const shippingCost = finalTotal > 2000 ? 0 : 100

      // Total including shipping
      const total = finalTotal + shippingCost

      return (
        <>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rs{finalTotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span>Shipping</span>
            <span className={shippingCost === 0 ? "text-green-600" : ""}>
              {shippingCost === 0 ? "Free" : `Rs${shippingCost}`}
            </span>
          </div>

          <hr className="border-gray-200" />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-purple-600">Rs{total.toLocaleString()}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-medium transition-colors mt-4"
            disabled={orderLoading || !validateForm()}
          >
            {orderLoading
              ? "Processing..."
              : `${paymentMethod === "online" ? "Proceed to Payment" : "Place Order"} - Rs${total.toLocaleString()}`}
          </button>

          <p className="text-xs text-gray-500 text-center mt-2">
            Secure checkout powered by ZIIIP
          </p>
        </>
      )
    })()}
  </div>
</div>



        </div>
      </div>
    </div>
  )
}

export default Checkout

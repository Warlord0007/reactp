"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Users, Package, ShoppingCart, DollarSign, Upload, X, ImageIcon } from "lucide-react"

interface Product {
  _id: string
  name: string
  price: number
  brand: string
  category: string
  tag: string
  description: string
  stock: number // Matches backend schema
  rating: number
  reviews: number
  image?: string // Changed to single image path
}

interface User {
  _id: string
  name: string
  email: string
  role: string
}

const AdminPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    brand: "",
    tag: "",
    description: "",
    stock: "", // Matches backend schema
    category: "",
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null) // State for single file
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("") // State for single preview URL
  const [uploadingProduct, setUploadingProduct] = useState(false)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      // Fetch products using the same endpoint as the product page
      const productsResponse = await fetch("http://localhost:5000/api/products?limit=100")
      const productsData = await productsResponse.json()

      console.log("Admin - Products data:", productsData)

      // Handle both old and new response formats
      if (productsData.success && productsData.products) {
        setProducts(productsData.products)
      } else if (productsData.products) {
        // Old format compatibility
        setProducts(productsData.products)
      } else if (Array.isArray(productsData)) {
        // Direct array format
        setProducts(productsData)
      }

      // Fetch users
      try {
        const usersResponse = await fetch("http://localhost:5000/api/users")
        const usersData = await usersResponse.json()
        if (Array.isArray(usersData)) {
          setUsers(usersData)
        }
      } catch (userError) {
        console.log("Users endpoint not available:", userError)
        setUsers([])
      }

      // Update stats
      const productCount = productsData.products ? productsData.products.length : 0
      setStats((prevStats) => ({
        ...prevStats,
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalProducts: productCount,
        totalOrders: Math.floor(Math.random() * 50) + 10,
        totalRevenue: Math.floor(Math.random() * 100000) + 50000,
      }))
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImage(file)

    // Create preview URL for the selected file
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreviewUrl("")
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadingProduct(true)

    try {
      const formData = new FormData()

      // Add product data with validation
      if (!newProduct.name.trim()) {
        alert("Product name is required")
        return
      }
      if (!newProduct.price || Number.parseFloat(newProduct.price) <= 0) {
        alert("Valid price is required")
        return
      }
      if (!newProduct.brand.trim()) {
        alert("Brand is required")
        return
      }
      if (!newProduct.tag) {
        alert("Category is required")
        return
      }

      formData.append("name", newProduct.name.trim())
      formData.append("brand", newProduct.brand.trim())
      formData.append("tag", newProduct.tag) // This is used as category in backend
      formData.append("description", newProduct.description.trim())
      formData.append("price", String(Number.parseFloat(newProduct.price)))
      formData.append("countInStock", String(Number.parseInt(newProduct.stock) || 0)) // Backend expects 'countInStock'

      // Add single image
      if (selectedImage) {
        formData.append("image", selectedImage) // Append single image with the key "image"
      }

      console.log("Sending product data:")
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value)
      }

      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)
      const responseData = await response.json()
      console.log("Response data:", responseData)

      if (response.ok && responseData) {
        console.log("Product created successfully:", responseData)

        // Add the new product to the current list
        setProducts((prevProducts) => [...prevProducts, responseData])

        // Update stats
        setStats((prevStats) => ({
          ...prevStats,
          totalProducts: prevStats.totalProducts + 1,
        }))

        // Reset form
        setNewProduct({
          name: "",
          price: "",
          brand: "",
          tag: "",
          description: "",
          stock: "",
          category: "",
        })
        setSelectedImage(null)
        setImagePreviewUrl("")

        alert("Product added successfully!")

        // Optionally refresh the products list to ensure consistency
        setTimeout(() => {
          fetchAdminData()
        }, 1000)
      } else {
        console.error("Error response:", responseData)
        alert("Failed to add product: " + (responseData.message || responseData.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error adding product:", error)
      alert("Failed to add product: " + error.message)
    } finally {
      setUploadingProduct(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewProduct((prev) => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your store and monitor performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">Rs{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Product Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (Rs) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={newProduct.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  value={newProduct.brand}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="tag"
                  value={newProduct.tag}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="sneakers">Sneakers</option>
                  <option value="hoodies">Hoodies</option>
                  <option value="t-shirts">T-Shirts</option>
                  <option value="jackets">Jackets</option>
                  <option value="pants">Pants</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  name="stock"
                  value={newProduct.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter product description"
                />
              </div>

              {/* Single Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> product image
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    </label>
                  </div>

                  {imagePreviewUrl && (
                    <div className="relative group w-32">
                      <img
                        src={imagePreviewUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {selectedImage && <p className="text-sm text-gray-600">Image selected: {selectedImage.name}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadingProduct}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingProduct ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding Product...
                  </div>
                ) : (
                  "Add Product"
                )}
              </button>
            </form>
          </div>

          {/* Users Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Users</h2>
            <div className="space-y-4">
              {users.length > 0 ? (
                users.slice(0, 5).map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "admin" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Products ({products.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {products.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.brand}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Rs{product.price.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.stock}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 capitalize">
                          {product.tag}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.image ? (
                            <img
                              src={`http://localhost:5000${product.image}`}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                                e.currentTarget.nextElementSibling!.style.display = "flex"
                              }}
                            />
                          ) : null}
                          <div className="flex items-center" style={{ display: product.image ? "none" : "flex" }}>
                            <ImageIcon className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-600">No image</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No products found. Add your first product above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage

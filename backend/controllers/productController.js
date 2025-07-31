const Product = require('../models/Product');

// GET all products
const getAllProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

// GET product by ID
const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
};

// CREATE product
const createProduct = async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json({ msg: 'Product created', product });
};

// UPDATE product
const updateProduct = async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ msg: 'Product updated', product: updated });
};

// DELETE product
const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Product deleted' });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

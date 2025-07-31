const User = require('../models/User');

// GET all users
const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

// DELETE user by ID
const deleteUserById = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ msg: 'User deleted' });
};

module.exports = { getAllUsers, deleteUserById };

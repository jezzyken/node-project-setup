const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const { seedPermissions } = require('../config/seed');

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ username: { $ne: 'superadmin' } })
    .select('-password -passwordHash -refreshTokens');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

const getUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const user = await User.findById(id).select('-password -passwordHash -refreshTokens');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

const createUser = catchAsync(async (req, res, next) => {
  const { username, email, password, firstName, lastName, roleName } = req.body;

  if (!username || !email || !password || !firstName || !lastName || !roleName) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required: username, email, password, firstName, lastName, roleName'
    });
  }

  const role = seedPermissions[roleName];
  if (!role) {
    return res.status(400).json({
      success: false,
      error: `Invalid role. Available roles: ${Object.keys(seedPermissions).join(', ')}`
    });
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User with this email or username already exists'
    });
  }

  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
    role
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user
  });
});

const updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { username, email, firstName, lastName, roleName, isActive } = req.body;

  const user = await User.findById(id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (user.username === 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Cannot modify superadmin account'
    });
  }

  if (username) user.username = username;
  if (email) user.email = email;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (typeof isActive === 'boolean') user.isActive = isActive;
  
  if (roleName) {
    const role = seedPermissions[roleName];
    if (!role) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Available roles: ${Object.keys(seedPermissions).join(', ')}`
      });
    }
    user.role = role;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const user = await User.findById(id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (user.username === 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Cannot delete superadmin account'
    });
  }

  await User.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

const getAvailableRoles = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: seedPermissions
  });
});

const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select('-password -passwordHash -refreshTokens')
    .populate({
      path: 'role',
      populate: {
        path: 'permissions.permission'
      }
    });

  res.status(200).json({
    success: true,
    data: user
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAvailableRoles,
  getMe
};
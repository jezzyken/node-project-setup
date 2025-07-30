const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

const createRole = catchAsync(async (req, res, next) => {
  const { name, displayName, description, permissions } = req.body;

  if (!name || !displayName || !description || !permissions || !Array.isArray(permissions)) {
    return res.status(400).json({
      success: false,
      error: 'Name, displayName, description, and permissions array are required'
    });
  }

  const existingRole = await Role.findOne({ name: name.toLowerCase() });
  
  if (existingRole) {
    return res.status(400).json({
      success: false,
      error: 'Role with this name already exists'
    });
  }

  const role = await Role.create({
    name: name.toLowerCase(),
    displayName,
    description,
    permissions,
    isSystemRole: false
  });

  await role.populate('permissions.permission');

  res.status(201).json({
    success: true,
    message: 'Role created successfully',
    data: role
  });
});

const getAllRoles = catchAsync(async (req, res, next) => {
  const roles = await Role.find({ isActive: true })
    .populate('permissions.permission')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: roles.length,
    data: roles
  });
});

const getRoleById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const role = await Role.findById(id)
    .populate('permissions.permission');
  
  if (!role) {
    return res.status(404).json({
      success: false,
      error: 'Role not found'
    });
  }

  res.status(200).json({
    success: true,
    data: role
  });
});

const getRoleByName = catchAsync(async (req, res, next) => {
  const { roleName } = req.params;
  
  const role = await Role.findOne({ name: roleName.toLowerCase() })
    .populate('permissions.permission');
  
  if (!role) {
    return res.status(404).json({
      success: false,
      error: 'Role not found'
    });
  }

  res.status(200).json({
    success: true,
    data: role
  });
});

const updateRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { displayName, description, permissions } = req.body;

  const role = await Role.findById(id);
  
  if (!role) {
    return res.status(404).json({
      success: false,
      error: 'Role not found'
    });
  }

  if (role.isSystemRole) {
    return res.status(403).json({
      success: false,
      error: 'Cannot modify system roles'
    });
  }

  if (displayName) role.displayName = displayName;
  if (description) role.description = description;
  if (permissions && Array.isArray(permissions)) role.permissions = permissions;

  await role.save();
  await role.populate('permissions.permission');

  res.status(200).json({
    success: true,
    message: 'Role updated successfully',
    data: role
  });
});

const deleteRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const role = await Role.findById(id);
  
  if (!role) {
    return res.status(404).json({
      success: false,
      error: 'Role not found'
    });
  }

  if (role.isSystemRole) {
    return res.status(403).json({
      success: false,
      error: 'Cannot delete system roles'
    });
  }

  // Check if any users have this role
  const usersWithRole = await User.countDocuments({ role: role._id });
  
  if (usersWithRole > 0) {
    return res.status(400).json({
      success: false,
      error: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role`
    });
  }

  await Role.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Role deleted successfully'
  });
});

const getUsersByRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const role = await Role.findById(id);
  
  if (!role) {
    return res.status(404).json({
      success: false,
      error: 'Role not found'
    });
  }

  const users = await User.find({ role: role._id })
    .select('-password -passwordHash -refreshTokens')
    .populate('role', 'name displayName');
  
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

const updateUserRole = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({
      success: false,
      error: 'Role ID is required'
    });
  }

  const user = await User.findById(userId);
  const role = await Role.findById(roleId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (!role) {
    return res.status(404).json({
      success: false,
      error: 'Role not found'
    });
  }

  if (user.username === 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Cannot modify superadmin role'
    });
  }

  user.role = roleId;
  await user.save();

  await user.populate({
    path: 'role',
    populate: {
      path: 'permissions.permission'
    }
  });

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    data: user
  });
});

const checkUserPermission = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { resource, action } = req.query;

  if (!resource || !action) {
    return res.status(400).json({
      success: false,
      error: 'Resource and action parameters are required'
    });
  }

  const user = await User.findById(userId).populate({
    path: 'role',
    populate: {
      path: 'permissions.permission'
    }
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (user.isSuperAdmin()) {
    return res.status(200).json({
      success: true,
      hasPermission: true,
      message: 'Superadmin has all permissions'
    });
  }

  const rolePermission = user.role.permissions.find(rp => 
    rp.permission.resource === resource
  );
  
  if (!rolePermission) {
    return res.status(200).json({
      success: true,
      hasPermission: false,
      message: 'No permission found for this resource'
    });
  }

  const actionPermission = rolePermission.actions.find(a => a.name === action);
  
  if (!actionPermission) {
    return res.status(200).json({
      success: true,
      hasPermission: false,
      message: 'Action not found in role permissions'
    });
  }

  res.status(200).json({
    success: true,
    hasPermission: actionPermission.allowed,
    message: actionPermission.allowed ? 'Permission granted' : 'Permission denied'
  });
});

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  getRoleByName,
  updateRole,
  deleteRole,
  getUsersByRole,
  updateUserRole,
  checkUserPermission
};
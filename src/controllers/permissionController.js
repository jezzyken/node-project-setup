const Permission = require('../models/Permission');
const Role = require('../models/Role');
const catchAsync = require('../utils/catchAsync');

const getAllPermissions = catchAsync(async (req, res, next) => {
  const permissions = await Permission.find().sort({ resource: 1 });
  
  res.status(200).json({
    success: true,
    count: permissions.length,
    data: permissions
  });
});

const getPermissionByResource = catchAsync(async (req, res, next) => {
  const { resource } = req.params;
  
  const permission = await Permission.findOne({ resource });
  
  if (!permission) {
    return res.status(404).json({
      success: false,
      error: 'Permission not found'
    });
  }

  res.status(200).json({
    success: true,
    data: permission
  });
});

const createPermission = catchAsync(async (req, res, next) => {
  const { resource, description, actions } = req.body;

  if (!resource || !description || !actions || !Array.isArray(actions)) {
    return res.status(400).json({
      success: false,
      error: 'Resource, description, and actions array are required'
    });
  }

  const existingPermission = await Permission.findOne({ resource });
  
  if (existingPermission) {
    return res.status(400).json({
      success: false,
      error: 'Permission for this resource already exists'
    });
  }

  const permission = await Permission.create({
    resource: resource.toLowerCase(),
    description,
    actions
  });

  res.status(201).json({
    success: true,
    message: 'Permission created successfully',
    data: permission
  });
});

const updatePermission = catchAsync(async (req, res, next) => {
  const { resource } = req.params;
  const { description, actions } = req.body;

  const permission = await Permission.findOne({ resource });
  
  if (!permission) {
    return res.status(404).json({
      success: false,
      error: 'Permission not found'
    });
  }

  if (description) permission.description = description;
  if (actions && Array.isArray(actions)) permission.actions = actions;

  await permission.save();

  res.status(200).json({
    success: true,
    message: 'Permission updated successfully',
    data: permission
  });
});

const addActionToPermission = catchAsync(async (req, res, next) => {
  const { resource } = req.params;
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({
      success: false,
      error: 'Action name and description are required'
    });
  }

  const permission = await Permission.findOne({ resource });
  
  if (!permission) {
    return res.status(404).json({
      success: false,
      error: 'Permission not found'
    });
  }

  const existingAction = permission.actions.find(action => action.name === name);
  
  if (existingAction) {
    return res.status(400).json({
      success: false,
      error: 'Action already exists for this resource'
    });
  }

  permission.actions.push({ name, description });
  await permission.save();

  // Update all roles that have this permission to include the new action (disabled by default)
  await Role.updateMany(
    { 'permissions.permission': permission._id },
    { 
      $push: { 
        'permissions.$.actions': { 
          name: name, 
          allowed: false 
        } 
      } 
    }
  );

  res.status(200).json({
    success: true,
    message: 'Action added to permission successfully',
    data: permission
  });
});

const removeActionFromPermission = catchAsync(async (req, res, next) => {
  const { resource, actionName } = req.params;

  const permission = await Permission.findOne({ resource });
  
  if (!permission) {
    return res.status(404).json({
      success: false,
      error: 'Permission not found'
    });
  }

  const actionIndex = permission.actions.findIndex(action => action.name === actionName);
  
  if (actionIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Action not found'
    });
  }

  // Prevent removal of basic CRUD actions
  const basicActions = ['create', 'read', 'update', 'delete'];
  if (basicActions.includes(actionName)) {
    return res.status(403).json({
      success: false,
      error: 'Cannot remove basic CRUD actions'
    });
  }

  permission.actions.splice(actionIndex, 1);
  await permission.save();

  // Remove this action from all roles
  await Role.updateMany(
    { 'permissions.permission': permission._id },
    { 
      $pull: { 
        'permissions.$.actions': { 
          name: actionName 
        } 
      } 
    }
  );

  res.status(200).json({
    success: true,
    message: 'Action removed from permission successfully',
    data: permission
  });
});

const deletePermission = catchAsync(async (req, res, next) => {
  const { resource } = req.params;

  const permission = await Permission.findOne({ resource });
  
  if (!permission) {
    return res.status(404).json({
      success: false,
      error: 'Permission not found'
    });
  }

  // Check if any roles are using this permission
  const rolesUsingPermission = await Role.find({ 'permissions.permission': permission._id });
  
  if (rolesUsingPermission.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete permission that is being used by roles',
      data: {
        rolesUsing: rolesUsingPermission.map(role => role.name)
      }
    });
  }

  await Permission.findByIdAndDelete(permission._id);

  res.status(200).json({
    success: true,
    message: 'Permission deleted successfully'
  });
});

module.exports = {
  getAllPermissions,
  getPermissionByResource,
  createPermission,
  updatePermission,
  addActionToPermission,
  removeActionFromPermission,
  deletePermission
};
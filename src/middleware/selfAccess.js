const getActionFromMethod = (method) => {
  const actionMap = {
    'GET': 'read',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
  };
  return actionMap[method] || 'read';
};

const getResourceFromPath = (path) => {
  const pathSegments = path.split('/').filter(segment => segment && !segment.match(/^:/));
  return pathSegments[pathSegments.length - 1] || 'unknown';
};

const autoCheckPermissionWithSelfAccess = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Superadmin always has access
    if (user.isSuperAdmin()) {
      return next();
    }

    const resource = getResourceFromPath(req.baseUrl);
    const action = getActionFromMethod(req.method);

    // Check if user is accessing their own account
    const requestedUserId = req.params.id;
    if (requestedUserId && requestedUserId === user._id.toString()) {
      // For self-access updates, restrict certain fields
      if (action === 'update') {
        const restrictedFields = ['role', 'isActive', 'emailVerified'];
        const hasRestrictedFields = restrictedFields.some(field => 
          req.body.hasOwnProperty(field)
        );
        
        if (hasRestrictedFields) {
          return res.status(403).json({
            success: false,
            error: 'Cannot modify role, isActive, or emailVerified fields on your own account'
          });
        }
      }
      
      // For self-access deletes, prevent self-deletion
      if (action === 'delete') {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete your own account'
        });
      }
      
      console.log(`Self-access granted for ${action} on ${resource} for user:`, user._id);
      return next(); // Allow self-access
    }

    // If not self-access, check normal permissions
    const rolePermission = user.role.permissions.find(rp => 
      rp.permission.resource === resource
    );
    
    if (!rolePermission) {
      return res.status(403).json({
        success: false,
        error: `No permission for resource: ${resource}`
      });
    }

    const actionPermission = rolePermission.actions.find(a => a.name === action);
    
    if (!actionPermission || !actionPermission.allowed) {
      return res.status(403).json({
        success: false,
        error: `Permission denied for action: ${action} on resource: ${resource}`
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Permission check failed'
    });
  }
};

module.exports = { 
  autoCheckPermissionWithSelfAccess
};
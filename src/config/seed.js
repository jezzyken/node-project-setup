const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

const seedData = {
  permissions: [
    {
      resource: 'users',
      description: 'User management permissions',
      actions: [
        { name: 'create', description: 'Create new users' },
        { name: 'read', description: 'View user information' },
        { name: 'update', description: 'Update user information' },
        { name: 'delete', description: 'Delete users' }
      ]
    },
    {
      resource: 'roles',
      description: 'Role management permissions',
      actions: [
        { name: 'create', description: 'Create roles' },
        { name: 'read', description: 'View roles' },
        { name: 'update', description: 'Update roles' },
        { name: 'delete', description: 'Delete roles' }
      ]
    },
    {
      resource: 'permissions',
      description: 'Permission management permissions',
      actions: [
        { name: 'create', description: 'Create permissions' },
        { name: 'read', description: 'View permissions' },
        { name: 'update', description: 'Update permissions' },
        { name: 'delete', description: 'Delete permissions' }
      ]
    }
  ],
  roles: [
    {
      name: 'superadmin',
      displayName: 'Super Administrator',
      description: 'Full system access with all permissions',
      isSystemRole: true,
      permissions: []
    },
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Administrative access to user management',
      isSystemRole: true,
      permissions: [
        {
          resource: 'users',
          actions: [
            { name: 'create', allowed: true },
            { name: 'read', allowed: true },
            { name: 'update', allowed: true },
            { name: 'delete', allowed: true }
          ]
        }
      ]
    }
  ]
};

const createPermissions = async () => {
  try {
    for (const permData of seedData.permissions) {
      const existingPermission = await Permission.findOne({ resource: permData.resource });
      
      if (!existingPermission) {
        await Permission.create(permData);
        console.log(`Permission created: ${permData.resource}`);
      }
    }
  } catch (error) {
    console.error('Error creating permissions:', error.message);
  }
};

const createRoles = async () => {
  try {
    const permissions = await Permission.find();
    
    for (const roleData of seedData.roles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (!existingRole) {
        const role = new Role({
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystemRole: roleData.isSystemRole,
          permissions: []
        });

        // For superadmin, grant all permissions with all actions allowed
        if (roleData.name === 'superadmin') {
          for (const permission of permissions) {
            const rolePermission = {
              permission: permission._id,
              actions: permission.actions.map(action => ({
                name: action.name,
                allowed: true
              }))
            };
            role.permissions.push(rolePermission);
          }
        } else {
          // For other roles, use the specified permissions
          for (const permConfig of roleData.permissions) {
            const permission = permissions.find(p => p.resource === permConfig.resource);
            if (permission) {
              const rolePermission = {
                permission: permission._id,
                actions: permConfig.actions
              };
              role.permissions.push(rolePermission);
            }
          }
        }

        await role.save();
        console.log(`Role created: ${roleData.displayName}`);
      }
    }
  } catch (error) {
    console.error('Error creating roles:', error.message);
  }
};

const createDefaultAccounts = async () => {
  try {
    const superAdminRole = await Role.findOne({ name: 'superadmin' });
    const adminRole = await Role.findOne({ name: 'admin' });

    // Create SuperAdmin Account
    const existingSuperAdmin = await User.findOne({ username: 'superadmin' });
    
    if (!existingSuperAdmin && superAdminRole) {
      const superAdmin = new User({
        username: 'superadmin',
        email: 'superadmin@app.dev',
        password: '@superadmin123',
        firstName: 'Super',
        lastName: 'Admin',
        role: superAdminRole._id,
        isActive: true,
        emailVerified: true
      });

      await superAdmin.save();
      console.log('Super admin account created successfully');
    } else {
      console.log('Super admin already exists or role not found');
    }

    // Create Admin Account
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (!existingAdmin && adminRole) {
      const admin = new User({
        username: 'admin',
        email: 'admin@app.dev',
        password: '@admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: adminRole._id,
        isActive: true,
        emailVerified: true
      });

      await admin.save();
      console.log('Admin account created successfully');
    } else {
      console.log('Admin already exists or role not found');
    }

  } catch (error) {
    console.error('Error creating default accounts:', error.message);
  }
};

const seedDatabase = async () => {
  await createPermissions();
  await createRoles();
  await createDefaultAccounts();
};

module.exports = { seedDatabase };
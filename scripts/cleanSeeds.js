require('dotenv').config();
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const Permission = require('../src/models/Permission');

const cleanSeeds = async () => {
  try {
    console.log('🧹 Starting database cleanup...');
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected successfully');

    console.log('\n🗑️  Cleaning seed data...');

    // Delete all users (including seeded accounts)
    const userResult = await User.deleteMany({});
    console.log(`✅ Deleted ${userResult.deletedCount} users`);

    // Delete all roles (including system roles)
    const roleResult = await Role.deleteMany({});
    console.log(`✅ Deleted ${roleResult.deletedCount} roles`);

    // Delete all permissions
    const permissionResult = await Permission.deleteMany({});
    console.log(`✅ Deleted ${permissionResult.deletedCount} permissions`);

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('🚀 Starting development server...\n');

  } catch (error) {
    console.error('❌ Error during seed cleanup:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    
    // Start the development server
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    devProcess.on('error', (error) => {
      console.error('Failed to start dev server:', error);
      process.exit(1);
    });
  }
};

cleanSeeds();
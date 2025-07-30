require('dotenv').config();
const mongoose = require('mongoose');
const { seedDatabase } = require('../src/config/seed');

const reseedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected successfully');

    console.log('\n🌱 Starting database re-seeding...');
    
    await seedDatabase();
    
    console.log('\n🎉 Database re-seeding completed successfully!');
    console.log('\nDefault accounts created:');
    console.log('- Superadmin: superadmin@app.dev / @superadmin123');
    console.log('- Admin: admin@app.dev / @admin123');

  } catch (error) {
    console.error('❌ Error during re-seeding:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase disconnected');
    process.exit(0);
  }
};

reseedDatabase();
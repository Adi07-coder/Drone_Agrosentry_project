/**
 * AgroSentry — Demo User Seed Script
 * Creates demo user and admin accounts in MongoDB so you can log in immediately.
 *
 * Run: node scripts/seed-demo-users.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/AgroSentryDB';

// Minimal schemas
const UserSchema = new mongoose.Schema({
  name: String, email: String, password: String, role: String,
  isActive: { type: Boolean, default: true }, createdAt: { type: Date, default: Date.now }
});
const AdminSchema = new mongoose.Schema({
  name: String, email: String, password: String, role: String,
  isActive: { type: Boolean, default: true }, createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Admin = mongoose.model('Admin', AdminSchema);

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const userPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Upsert demo user
    const existingUser = await User.findOne({ email: 'user@example.com' });
    if (!existingUser) {
      await User.create({ name: 'Demo User', email: 'user@example.com', password: userPassword, role: 'user' });
      console.log('✓ Created demo user:  user@example.com / password123');
    } else {
      await User.updateOne({ email: 'user@example.com' }, { password: userPassword });
      console.log('✓ Updated demo user password:  user@example.com / password123');
    }

    // Upsert demo admin
    const existingAdmin = await Admin.findOne({ email: 'admin@plantai.com' });
    if (!existingAdmin) {
      await Admin.create({ name: 'Admin', email: 'admin@plantai.com', password: adminPassword, role: 'admin' });
      console.log('✓ Created demo admin: admin@plantai.com / admin123');
    } else {
      await Admin.updateOne({ email: 'admin@plantai.com' }, { password: adminPassword });
      console.log('✓ Updated demo admin password: admin@plantai.com / admin123');
    }

    console.log('\n✅ Demo users ready. You can now log in at http://localhost:5174/role-select\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('✗ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();

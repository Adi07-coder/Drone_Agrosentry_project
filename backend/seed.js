/**
 * AgroSentry Database Seed Script
 * ---------------------------------
 * Seeds the demo admin and demo user accounts into MongoDB.
 * Run once with:  node backend/seed.js
 *
 * Demo Admin:  admin@plantai.com  /  admin123
 * Demo User:   user@example.com   /  password123
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Inline schemas (so we don't need to load the full app)
const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true },
  password: { type: String, select: false },
  role: { type: String, default: "admin" },
  isActive: { type: Boolean, default: true },
  department: { type: String, default: "Operations" },
  adminLevel: { type: Number, default: 1 },
  permissions: [String],
  lastLogin: Date,
  resetToken: { type: String, select: false },
  resetTokenExpiry: { type: Date, select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true },
  password: { type: String, select: false },
  role: { type: String, default: "user" },
  isActive: { type: Boolean, default: true },
  scansCount: { type: Number, default: 0 },
  preferences: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: "dark" },
    language: { type: String, default: "en" },
  },
  lastLogin: Date,
  resetToken: { type: String, select: false },
  resetTokenExpiry: { type: Date, select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

async function seed() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/AgroSentryDB";
    console.log(`\n🌱 Connecting to MongoDB: ${uri}`);
    await mongoose.connect(uri);
    console.log("✓ MongoDB connected\n");

    // Use raw collections to avoid model conflicts
    const db = mongoose.connection.db;

    // ─────────────────────────────
    //  Seed Demo Admin
    // ─────────────────────────────
    const adminEmail = "admin@plantai.com";
    const adminCollection = db.collection("admins");
    const existingAdmin = await adminCollection.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`ℹ️  Demo admin already exists: ${adminEmail}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      await adminCollection.insertOne({
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isActive: true,
        department: "Operations",
        adminLevel: 1,
        permissions: ["manage_users", "manage_diseases", "view_reports", "manage_system"],
        lastLogin: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ Demo admin created:`);
      console.log(`   Email:    ${adminEmail}`);
      console.log(`   Password: admin123`);
    }

    // ─────────────────────────────
    //  Seed Demo User
    // ─────────────────────────────
    const userEmail = "user@example.com";
    const userCollection = db.collection("users");
    const existingUser = await userCollection.findOne({ email: userEmail });

    if (existingUser) {
      console.log(`ℹ️  Demo user already exists: ${userEmail}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("password123", salt);

      await userCollection.insertOne({
        name: "Demo User",
        email: userEmail,
        password: hashedPassword,
        role: "user",
        isActive: true,
        scansCount: 0,
        preferences: { notifications: true, theme: "dark", language: "en" },
        lastLogin: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`\n✅ Demo user created:`);
      console.log(`   Email:    ${userEmail}`);
      console.log(`   Password: password123`);
    }

    console.log("\n🎉 Seeding complete!\n");
  } catch (error) {
    console.error("\n❌ Seed error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("✓ MongoDB disconnected");
  }
}

seed();

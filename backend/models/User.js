const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email"
    ]
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"]
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  scansCount: {
    type: Number,
    default: 0,
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, enum: ["light", "dark"], default: "dark" },
    language: { type: String, default: "en" },
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  resetToken: {
    type: String,
    default: null,
    select: false,
  },
  resetTokenExpiry: {
    type: Date,
    default: null,
    select: false,
  },
});

UserSchema.pre("save", async function() {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", UserSchema);

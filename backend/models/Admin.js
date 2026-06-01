const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true
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
    default: "admin",
    enum: ["admin"]
  },
  department: {
    type: String,
    default: "Operations"
  },
  adminLevel: {
    type: Number,
    enum: [1, 2, 3],
    default: 1
  },
  permissions: [
    {
      type: String,
      enum: ["manage_users", "manage_diseases", "view_reports", "manage_system"]
    }
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

AdminSchema.pre("save", async function() {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

AdminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

AdminSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("Admin", AdminSchema);

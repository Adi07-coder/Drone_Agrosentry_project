const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user = null;
      if (decoded.role === "admin") {
        user = await Admin.findById(decoded.id);
      } else {
        user = await User.findById(decoded.id);
      }

      if (user) {
        req.user = {
          id: user._id,
          role: decoded.role || user.role,
          email: user.email,
          name: user.name
        };
        return next();
      }
    } catch (jwtErr) {
      // JWT verify failed
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });

  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Authentication error"
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource"
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};

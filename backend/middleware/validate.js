const { validationResult, body, param } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Invalid role"),
];

const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

const validateImageUpload = [
  (req, res, next) => {
    console.log("==> Upload Request Received");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    if (!req.file) {
      console.log("Validation Failed: No image provided");
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      console.log("Validation Failed: Invalid mimetype", req.file.mimetype);
      return res.status(400).json({
        success: false,
        message: "Only JPG and PNG images are allowed",
      });
    }

    if (req.file.size === 0) {
      console.log("Validation Failed: File is empty");
      return res.status(400).json({
        success: false,
        message: "Image file is empty",
      });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      console.log("Validation Failed: File too large", req.file.size);
      return res.status(400).json({
        success: false,
        message: "Image size must be less than 5MB",
      });
    }

    console.log("Validation Passed! Proceeding to controller.");
    next();
  },
];

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  validateImageUpload,
};

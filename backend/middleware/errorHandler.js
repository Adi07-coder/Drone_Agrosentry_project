const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    const message = `Invalid input data. ${Object.values(err.errors)
      .map((val) => val.message)
      .join(", ")}`;
    err = { statusCode: 400, message };
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    err = { statusCode: 400, message };
  }

  // JWT Error
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    err = { statusCode: 401, message };
  }

  // JWT Expire Error
  if (err.name === "TokenExpiredError") {
    const message = "Token has expired";
    err = { statusCode: 401, message };
  }

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;

const LoginLog = require("../models/LoginLog");

exports.getLoginLogs = async (req, res, next) => {
  try {
    const logs = await LoginLog.find().sort({ loginTime: -1 });
    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    next(error);
  }
};

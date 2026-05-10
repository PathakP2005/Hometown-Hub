const User = require("../models/user");

const verifyAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = verifyAdmin;
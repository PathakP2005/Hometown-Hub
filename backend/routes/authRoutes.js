const express = require("express");
const User = require("../models/user");
const router = express.Router();

const { register, login } = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

// public routes
router.post("/register", register);
router.post("/login", login);

// protected routes
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    console.log("Decoded user:", req.user);
    const user = await User.findById(userId)
      .select("-password")
      .populate("joinedCommunities", "name type location description members");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Protected route working",
      user: user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, hometown } = req.body;
    const userId = req.user?.id || req.user;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, hometown },
      { new: true }
    ).select("-password -__v");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE profile
router.delete("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    console.log("Resolved delete userId:", userId);
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TEMPORARY: Make user admin (for testing)
router.post("/make-admin", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const user = await User.findByIdAndUpdate(
      userId,
      { role: "admin" },
      { new: true }
    ).select("-password");

    res.json({ message: "User made admin", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
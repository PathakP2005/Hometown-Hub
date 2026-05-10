const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

const getField = (reqBody, ...keys) => {
  for (const key of keys) {
    if (reqBody[key] !== undefined) {
      return reqBody[key];
    }
  }
  return undefined;
};

const normalizeEmail = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

exports.register = [
  body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: "Validation errors", errors: errors.array() });
    }

    try {
      const name = getField(req.body, "name", "Name");
      const email = normalizeEmail(getField(req.body, "email", "Email"));
      const password = getField(req.body, "password", "Password");

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ msg: "User already exists" });
      }

      // Always create normal users as members by default.
      // Admins should be assigned separately via the /api/auth/make-admin endpoint or DB.
      const role = "member";

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword, role });
      await user.save();

      res.json({ msg: "User registered", role });
    } catch (err) {
      res.status(500).json({ msg: "Error" });
    }
  }
];

exports.login = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").exists().withMessage("Password is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: "Validation errors", errors: errors.array() });
    }

    try {
      const email = normalizeEmail(getField(req.body, "email", "Email"));
      const password = getField(req.body, "password", "Password");

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ msg: "User not found" });
      }

      // Compare hashed passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ msg: "Invalid password" });
      }

      const token = jwt.sign(
        { id: user._id },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        msg: "User logged in",
        token,
        user,
      });

    } catch (err) {
      res.status(500).json({ msg: "Server error" });
    }
  }
];
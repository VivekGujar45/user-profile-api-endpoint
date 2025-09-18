// routes/users.js

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User"); // Import User model

//--------------------------------------------
// Middleware: JWT Authentication
//--------------------------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    req.user = user; // Attach user info from token
    next();
  });
}

//--------------------------------------------
// POST /api/users
// Create a new user (signup)
//--------------------------------------------
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").optional().isMobilePhone(),
    body("address").optional().isLength({ min: 5 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone, address } = req.body;

      // Check if email already exists
      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const user = new User({ name, email, phone, address, role: "user" });
      await user.save();

      res.status(201).json({ message: "User created successfully", user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

//--------------------------------------------
// POST /api/users/login
// Fake login to generate JWT
//--------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get user by ID (GET)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); // hide password
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

//--------------------------------------------
// PUT /api/users/:id
// Update user profile
//--------------------------------------------
router.put(
  "/:id",
  authenticateToken, // Protect route
  [
    // Input validation rules
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email format"),
    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid phone number"),
    body("address")
      .optional()
      .trim()
      .isLength({ min: 5 })
      .withMessage("Address must be at least 5 characters"),
  ],
  async (req, res) => {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if the user making the request matches the user being updated (or is admin)
      if (req.user.id !== req.params.id && req.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Unauthorized to update this profile." });
      }

      // Build update object (only include provided fields)
      const updateData = {};
      const allowedFields = ["name", "email", "phone", "address"];
      allowedFields.forEach((field) => {
        if (req.body[field]) updateData[field] = req.body[field];
      });

      // Update user in database
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found." });
      }

      // Respond with updated user profile
      res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error. Please try again later." });
    }
  }
);




module.exports = router;

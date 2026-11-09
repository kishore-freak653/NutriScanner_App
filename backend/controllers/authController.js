import { createUser, findUserByEmail } from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";

// ─────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
// ─────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // 1. Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Check duplicate
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create user
    const newUser = await createUser({
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
    });

    // 6. Respond (never send password back)
    res.status(201).json({
      message: "User Registered Successfully",
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      token: generateToken(newUser._id),
    });
  } catch (error) {
    // Handle Postgres unique violation (two registrations at once)
    if (error.code === "23505") {
      return res.status(400).json({
        message: "Email already registered",
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login user & return token
// @access  Public
// ─────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Find user
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // 4. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // 5. Respond with token
    res.status(200).json({
      message: "Login successful",
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

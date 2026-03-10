import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ─────────────────────────────────────────
// @desc    Protect private routes
// @usage   router.get("/profile", protect, getProfile)
// ─────────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. No token found
    if (!token) {
      return res.status(401).json({
        message: "No token, access denied",
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Check if user still exists in DB
    const user = await User.findById(decoded.id).select("-password -__v");

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    // 5. Attach user to request
    req.user = user;

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired, please login again",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    res.status(401).json({ message: "Not authorized" });
  }
};

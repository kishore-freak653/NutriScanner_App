import User from "../models/User.js";

// ─────────────────────────────────────────
// @route   GET /api/user/get-profile
// @desc    Get logged in user profile
// @access  Private
// ─────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    // ✅ middleware already fetched user
    // just use req.user directly — no DB call needed!
    res.status(200).json({
      message: "Profile fetched successfully",
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// controllers/foodController.js
import FoodRecord from "../models/FoodRecord.js";
import { detectFoodFromImage } from "../services/geminiService.js";

// ─────────────────────────────────────────
// @route   POST /api/food/scan
// @desc    Save scanned food record
// @access  Private
// ─────────────────────────────────────────
export const scanFood = async (req, res) => {
  try {
    const {
      foods,
      totalCalories, // ✅ consistent casing
      totalProtein,
      totalFat,
      totalCarbs,
      imageUrl,
      scanNote,
    } = req.body;

    // 1. Validate required fields
    if (!foods || foods.length === 0) {
      return res.status(400).json({
        message: "At least one food item is required",
      });
    }

    // 2. Create record
    const record = await FoodRecord.create({
      userId: req.user._id,
      foods,
      totalCalories: totalCalories || 0,
      totalProtein: totalProtein || 0,
      totalFat: totalFat || 0,
      totalCarbs: totalCarbs || 0,
      imageUrl: imageUrl || null,
      scanNote: scanNote || null,
    });

    res.status(201).json({
      message: "Food record saved successfully",
      record,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/food/history
// @desc    Get all food records for logged in user
// @access  Private
// ─────────────────────────────────────────
export const getHistory = async (req, res) => {
  try {
    const records = await FoodRecord.find({ userId: req.user._id })
      .sort({ createdAt: -1 }) // ✅ latest first
      .select("-__v"); // ✅ hide __v

    if (!records || records.length === 0) {
      return res.status(200).json({
        message: "No food records found",
        records: [],
      });
    }

    res.status(200).json({
      message: "Food history fetched successfully",
      count: records.length, // ✅ total count
      records,
    });
  } catch (error) {
    res.status(500).json({ error: error.message }); // ✅ try/catch added
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/food/:id
// @desc    Delete a food record
// @access  Private
// ─────────────────────────────────────────
export const deleteRecord = async (req, res) => {
  try {
    const record = await FoodRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // ✅ Make sure user owns this record
    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to delete this record",
      });
    }

    await record.deleteOne();

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const detectFood = async (req, res) => {
  try {
    const { image } = req.body;
    console.log(image);

    if (!image) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    const aiResult = await detectFoodFromImage(image);

    res.status(200).json({
      message: "Food detected successfully",
      ...aiResult,
    });


  } catch (error) {
     res.status(500).json({ error: error.message });
  }
};
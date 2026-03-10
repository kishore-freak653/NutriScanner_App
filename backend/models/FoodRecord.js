// models/FoodRecord.js
import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    unit: {
      type: String,
      default: "serving", // grams, ml, cup, piece etc
    },
    calories: {
      type: Number,
      default: 0,
    },
    protein: {
      type: Number,
      default: 0,
    },
    fat: {
      type: Number,
      default: 0,
    },
    carbs: {
      type: Number,
      default: 0, // ✅ added carbs (requirement says nutritional values)
    },
  },
  { _id: false },
); // ✅ no separate _id for each food item

const foodRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // ✅ required
      index: true, // ✅ faster queries by userId
    },
    foods: {
      type: [foodItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one food item is required", // ✅ cant save empty
      },
    },
    totalCalories: {
      // ✅ consistent casing
      type: Number,
      default: 0,
    },
    totalProtein: {
      // ✅ added per requirement
      type: Number,
      default: 0,
    },
    totalFat: {
      // ✅ added per requirement
      type: Number,
      default: 0,
    },
    totalCarbs: {
      // ✅ added per requirement
      type: Number,
      default: 0,
    },
    imageUrl: {
      // ✅ store scanned image url
      type: String,
      default: null,
    },
    scanNote: {
      // ✅ optional user note
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const FoodRecord = mongoose.model("FoodRecord", foodRecordSchema);
export default FoodRecord;

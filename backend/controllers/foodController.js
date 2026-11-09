// controllers/foodController.js
import {
  createFoodRecord,
  deleteFoodRecord,
  findFoodRecordById,
  findFoodRecordsByUser,
  updateFoodRecord,
} from "../models/FoodRecord.js";
import { findProductByBarcode } from "../services/barcodeService.js";
import {
  detectFoodFromImage,
  estimateFoodFromText,
  isAiConfigured,
} from "../services/geminiService.js";
import {
  decodePhoto,
  getPhotoUrls,
  removePhoto,
  uploadPhoto,
} from "../services/photoStorage.js";

const MAX_MEAL_TEXT = 300;

const attachPhotoUrls = async (records) => {
  const urls = await getPhotoUrls(records.map((r) => r.imagePath).filter(Boolean));
  return records.map((r) =>
    r.imagePath ? { ...r, imageUrl: urls.get(r.imagePath) ?? null } : r,
  );
};

const aiNotConfigured = (res) =>
  res.status(503).json({ message: "Food recognition isn't set up on the server yet." });

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
      image,
      mealType,
      scanNote,
    } = req.body;

    // 1. Validate required fields
    if (!foods || foods.length === 0) {
      return res.status(400).json({
        message: "At least one food item is required",
      });
    }

    // 2. Store the photo. A storage problem shouldn't lose the meal itself.
    const photo = image ? decodePhoto(image) : null;
    let imagePath = null;
    if (photo) {
      try {
        imagePath = await uploadPhoto(req.user._id, photo);
      } catch (uploadError) {
        console.error("Could not upload photo:", uploadError.message);
      }
    }

    // 3. Create record
    const record = await createFoodRecord({
      userId: req.user._id,
      foods,
      totalCalories: totalCalories || 0,
      totalProtein: totalProtein || 0,
      totalFat: totalFat || 0,
      totalCarbs: totalCarbs || 0,
      imageUrl: imageUrl || null,
      imagePath,
      mealType,
      scanNote: scanNote || null,
    }).catch(async (createError) => {
      if (imagePath) await removePhoto(imagePath);
      throw createError;
    });

    const [saved] = await attachPhotoUrls([record]);
    res.status(201).json({
      message: "Food record saved successfully",
      record: saved,
      photoSaved: !photo || Boolean(imagePath),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
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
    const records = await findFoodRecordsByUser(req.user._id); // ✅ latest first

    if (!records || records.length === 0) {
      return res.status(200).json({
        message: "No food records found",
        records: [],
      });
    }

    res.status(200).json({
      message: "Food history fetched successfully",
      count: records.length, // ✅ total count
      records: await attachPhotoUrls(records),
    });
  } catch (error) {
    res.status(500).json({ error: error.message }); // ✅ try/catch added
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/food/:id
// @desc    Update a saved food record
// @access  Private
// ─────────────────────────────────────────
export const updateRecord = async (req, res) => {
  try {
    const record = await findFoodRecordById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (record.userId !== req.user._id) {
      return res.status(403).json({
        message: "Not authorized to update this record",
      });
    }

    const updated = await updateFoodRecord(record._id, req.body);
    const [saved] = await attachPhotoUrls([updated]);

    res.status(200).json({ message: "Record updated successfully", record: saved });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/food/:id
// @desc    Delete a food record
// @access  Private
// ─────────────────────────────────────────
export const deleteRecord = async (req, res) => {
  try {
    const record = await findFoodRecordById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // ✅ Make sure user owns this record
    if (record.userId !== req.user._id) {
      return res.status(403).json({
        message: "Not authorized to delete this record",
      });
    }

    await deleteFoodRecord(record._id);
    if (record.imagePath) await removePhoto(record.imagePath);

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const detectFood = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    if (!isAiConfigured()) return aiNotConfigured(res);

    const aiResult = await detectFoodFromImage(image);

    res.status(200).json({
      message: "Food detected successfully",
      ...aiResult,
    });


  } catch (error) {
     res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   POST /api/food/estimate
// @desc    Estimate nutrition from a typed description
// @access  Private
// ─────────────────────────────────────────
export const estimateFood = async (req, res) => {
  try {
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

    if (!text || text.length > MAX_MEAL_TEXT) {
      return res.status(400).json({
        message: `Describe your meal in up to ${MAX_MEAL_TEXT} characters`,
      });
    }

    if (!isAiConfigured()) return aiNotConfigured(res);

    const aiResult = await estimateFoodFromText(text);

    res.status(200).json({
      message: "Meal estimated successfully",
      ...aiResult,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/food/barcode/:code
// @desc    Look up a packaged food's nutrition
// @access  Private
// ─────────────────────────────────────────
export const lookupBarcode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!/^\d{8,14}$/.test(code)) {
      return res.status(400).json({ message: "A barcode is 8 to 14 digits" });
    }

    const food = await findProductByBarcode(code);

    if (!food) {
      return res.status(404).json({
        message: "We couldn't find nutrition info for that barcode.",
      });
    }

    res.status(200).json({ food });
  } catch (error) {
    console.error("Barcode lookup failed:", error.message);
    res.status(502).json({
      message: "The barcode service isn't responding. Please try again.",
    });
  }
};

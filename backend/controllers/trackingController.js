import {
  deleteWeight,
  findWater,
  findWeights,
  saveWater,
  saveWeight,
} from "../models/Tracking.js";

const MAX_GLASSES = 50;
const MIN_WEIGHT_KG = 20;
const MAX_WEIGHT_KG = 500;

// Rejects shapes Postgres would refuse, and dates like 2026-02-31 that JS would roll over.
const isValidDay = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
};

const badDay = (res) =>
  res.status(400).json({ message: "A date in YYYY-MM-DD format is required" });

// @route GET /api/tracking/water?date=YYYY-MM-DD
export const getWater = async (req, res) => {
  try {
    const { date } = req.query;
    if (!isValidDay(date)) return badDay(res);
    res.status(200).json({ date, glasses: await findWater(req.user._id, date) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route PUT /api/tracking/water
export const putWater = async (req, res) => {
  try {
    const { date, glasses } = req.body;
    if (!isValidDay(date)) return badDay(res);
    if (!Number.isInteger(glasses) || glasses < 0 || glasses > MAX_GLASSES) {
      return res.status(400).json({
        message: `Glasses must be a whole number from 0 to ${MAX_GLASSES}`,
      });
    }
    await saveWater(req.user._id, date, glasses);
    res.status(200).json({ date, glasses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route GET /api/tracking/weight (newest first)
export const getWeights = async (req, res) => {
  try {
    res.status(200).json({ entries: await findWeights(req.user._id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route PUT /api/tracking/weight (one entry per day, so a second save replaces the first)
export const putWeight = async (req, res) => {
  try {
    const { date, weightKg } = req.body;
    if (!isValidDay(date)) return badDay(res);
    if (typeof weightKg !== "number" || !(weightKg >= MIN_WEIGHT_KG && weightKg <= MAX_WEIGHT_KG)) {
      return res.status(400).json({
        message: `Weight must be from ${MIN_WEIGHT_KG} to ${MAX_WEIGHT_KG} kg`,
      });
    }
    res.status(200).json({ entry: await saveWeight(req.user._id, date, weightKg) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route DELETE /api/tracking/weight/:date
export const removeWeight = async (req, res) => {
  try {
    if (!isValidDay(req.params.date)) return badDay(res);
    await deleteWeight(req.user._id, req.params.date);
    res.status(200).json({ message: "Weight entry deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

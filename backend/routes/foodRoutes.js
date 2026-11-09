// routes/foodRoutes.js
import express from "express";
import {
  scanFood,
  getHistory,
  deleteRecord,
  detectFood,
  estimateFood,
  lookupBarcode,
  updateRecord,
} from "../controllers/foodController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes protected — must be logged in
router.post("/scan", protect, scanFood);
router.post("/detect", protect, detectFood);
router.post("/estimate", protect, estimateFood);
router.get("/barcode/:code", protect, lookupBarcode);
router.get("/history", protect, getHistory);
router.put("/:id", protect, updateRecord);
router.delete("/:id", protect, deleteRecord); // ✅ bonus

export default router;

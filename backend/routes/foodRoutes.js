// routes/foodRoutes.js
import express from "express";
import {
  scanFood,
  getHistory,
  deleteRecord,
  detectFood,
} from "../controllers/foodController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes protected — must be logged in
router.post("/scan", protect, scanFood);
router.post("/detect", protect, detectFood);
router.get("/history", protect, getHistory);
router.delete("/:id", protect, deleteRecord); // ✅ bonus

export default router;

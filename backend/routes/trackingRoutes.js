import express from "express";
import {
  getWater,
  getWeights,
  putWater,
  putWeight,
  removeWeight,
} from "../controllers/trackingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/water", getWater);
router.put("/water", putWater);
router.get("/weight", getWeights);
router.put("/weight", putWeight);
router.delete("/weight/:date", removeWeight);

export default router;

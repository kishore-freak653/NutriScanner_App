import express from "express";
import { registerToken, sendTestPush, unregisterToken } from "../controllers/pushController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/token", registerToken);
router.delete("/token", unregisterToken);
router.post("/test", sendTestPush);

export default router;

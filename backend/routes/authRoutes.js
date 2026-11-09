import express from "express";
import { body } from "express-validator";
import { login, register } from "../controllers/authController.js";
import { validateRegister } from "../middleware/validateRegister.js";

const router = express.Router();

router.post("/register",validateRegister,register);
router.post("/login", body("email").normalizeEmail(), login);


export default router;
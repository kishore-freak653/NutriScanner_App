import express from "express";
import { login, register } from "../controllers/authController.js";
import { validateRegister } from "../middleware/validateRegister.js";

const router = express.Router();

router.post("/register",validateRegister,register);
router.post("/login", login);


export default router;
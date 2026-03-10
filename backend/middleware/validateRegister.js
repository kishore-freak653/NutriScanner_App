import { body, validationResult } from "express-validator";

// middleware/validateRegister.js
export const validateRegister = [
  body("email")
    .isEmail()
    .withMessage("Enter a valid email") // ✅ ac@gmail.cpom → rejected
    .normalizeEmail(), // ✅ normalize automatically

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be 6+ characters"),

  body("name").notEmpty().withMessage("Name is required"),

  body("phone").isMobilePhone().withMessage("Enter a valid phone number"),

  // middleware to return errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    next();
  },
];

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"
import foodRoutes from "./routes/foodRoutes.js";
dotenv.config();


const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(cors());

connectDB();


app.get("/",(req,res) => {
  res.send("Backend running");

})

app.use("/api/auth",authRoutes)

// app.use("/api/user", UserRoutes);

app.use("/api/food", foodRoutes);

// read port from environment or fallback to 3000
const PORT = process.env.PORT || 3000;
// ✅ Fix
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server connected on port ${PORT}`);
});
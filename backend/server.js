import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"
import foodRoutes from "./routes/foodRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";


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

app.use("/api/tracking", trackingRoutes);

app.use("/api/push", pushRoutes);

// read port from environment or fallback to 3000
const PORT = process.env.PORT || 3000;
// ✅ Fix
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server connected on port ${PORT}`);
});
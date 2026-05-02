import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import talentExamRoutes from "./routes/talentExamRoutes.js";
import TalentResultRoutes from "./routes/talentResultRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

const PORT = process.env.PORT || 5000;

// Get allowed origins
const allowedOrigins = [
  "https://yaduvanshiacademybansur-in.vercel.app",
  "https://yaduvanshiacademybansur.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV === "development"
    ) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// IMPORTANT: Handle OPTIONS preflight for all routes
app.options("*", cors(corsOptions)); // This is fine - it's for OPTIONS only

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - make sure this matches
app.use("/api/talent-exam", talentExamRoutes);
app.use("/api/talent-result", TalentResultRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running", time: new Date() });
});

// Root route for testing
app.get("/", (req, res) => {
  res.json({ message: "Yaduvanshi Academy Backend API" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Start server only if not in Vercel serverless environment
// if (process.env.NODE_ENV !== "production") {
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//     console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
//     console.log(`🔑 Admin login: http://localhost:${PORT}/api/admin/login`);
//   });
// }

// For Vercel serverless
export default app;

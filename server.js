import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import talentExamRoutes from "./routes/talentExamRoutes.js";
import talentResultRoutes from "./routes/talentResultRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

// ✅ CORS - Allow all origins for Vercel
app.use(cors({
  origin: '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Connect to MongoDB before handling routes (for serverless)
let dbConnected = false;

const initDB = async () => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await initDB();
    next();
  } catch (error) {
    console.error('DB Connection Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection error. Please try again.' 
    });
  }
});

// Routes
app.use("/api/talent-exam", talentExamRoutes);
app.use("/api/talent-result", talentResultRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true, 
    status: "OK", 
    message: "Server is running",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    time: new Date()
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "Yaduvanshi Academy Backend API",
    version: "1.0.0",
    status: "running"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ 
    success: false, 
    message: err.message || "Internal Server Error" 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.url} not found` 
  });
});

// Export for Vercel
export default app;

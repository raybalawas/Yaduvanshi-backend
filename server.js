import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import talentExamRoutes from "./routes/talentExamRoutes.js";
import talentResultRoutes from "./routes/talentResultRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

// ✅ Updated CORS - Allow all origins for now
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

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
    time: new Date()
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "Yaduvanshi Academy Backend API",
    version: "1.0.0"
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

export default app;

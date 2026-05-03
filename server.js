import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import talentExamRoutes from "./routes/talentExamRoutes.js";
import talentResultRoutes from "./routes/talentResultRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Load environment variables FIRST
dotenv.config();

const app = express();

// Debug: Check environment variables
console.log('🔧 Environment Variables Check:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
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
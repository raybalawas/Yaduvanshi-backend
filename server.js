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
const corsOptions = {
  origin: '*', // Allow all origins
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

export default app;

import express from "express";
import {
  uploadResult,
  bulkUploadResults,
  getAllResults,
  getResultByPhone,
  getClassRankList,
  updateResult,
  deleteResult,
  calculateAndUpdateRanks,
  getResultStats,
  truncateAllResults,
  fixExistingPercentages
} from "../controllers/talentResultController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/check/:phone", getResultByPhone);
router.get("/rank-list/:className", getClassRankList);
router.get("/public/stats", getResultStats);

// Protected routes (Admin only)
// router.use(protect);
// router.use(authorize("admin", "super_admin"));

router.post("/upload", uploadResult);
router.post("/bulk-upload", bulkUploadResults);
router.post("/calculate-ranks", calculateAndUpdateRanks);
router.get("/all", getAllResults);
router.put("/update/:id", updateResult);
router.delete("/delete/:id", deleteResult);
router.get("/stats", getResultStats);
router.delete("/truncate", truncateAllResults);
// Temporary route to fix existing data
// Add this in routes temporarily
router.post("/fix-percentages", async (req, res) => {
  try {
    const updated = await fixExistingPercentages();
    res.json({ success: true, message: `Fixed ${updated} records`, updatedCount: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
export default router;

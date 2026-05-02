import express from "express";
import {
  registerForExam,
  getAllRegistrations,
  getRegistrationById,
  updateRegistrationStatus,
  deleteRegistration,
  generateAdmitCard,
} from "../controllers/talentExamController.js";
const router = express.Router();

// Public routes
router.post("/register", registerForExam);

// Admin routes (you can add authentication middleware later)
router.get("/registrations", getAllRegistrations);
router.get("/registrations/:id", getRegistrationById);
router.put("/registrations/:id", updateRegistrationStatus);
router.delete("/registrations/:id", deleteRegistration);

router.post("/admit-card", generateAdmitCard);
export default router;

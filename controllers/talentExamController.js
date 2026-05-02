import TalentExam from "../models/TalentExam.js";
import PDFDocument from "pdfkit";

// @desc    Register for talent exam
// @route   POST /api/talent-exam/register
// @access  Public
export const registerForExam = async (req, res) => {
  try {
    const { name, fName, phone, class: studentClass, address } = req.body;

    // Log the received data for debugging
    console.log("Received registration data:", {
      name,
      fName,
      phone,
      class: studentClass,
      address,
    });

    // Check if student already registered with this phone number
    const existingRegistration = await TalentExam.findOne({
      phone: phone.replace(/\s/g, ""),
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "This phone number is already registered for the exam",
      });
    }

    // Create new registration
    const registration = await TalentExam.create({
      name,
      fName,
      phone: phone.replace(/\s/g, ""),
      class: studentClass,
      address,
    });

    res.status(201).json({
      success: true,
      message: "Registration submitted successfully",
      data: {
        id: registration._id,
        name: registration.name,
        registrationDate: registration.registrationDate,
      },
    });
  } catch (error) {
    // Log the full error for debugging
    console.error("Registration error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors,
    });

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate entry. This phone number is already registered.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Server error. Please try again later.",
    });
  }
};

// @desc    Get all registrations (Admin only)
// @route   GET /api/talent-exam/registrations
// @access  Private/Admin
export const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await TalentExam.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.error("Fetch registrations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// @desc    Get single registration by ID
// @route   GET /api/talent-exam/registrations/:id
// @access  Private/Admin
export const getRegistrationById = async (req, res) => {
  try {
    const registration = await TalentExam.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error("Fetch registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};


export const updateRegistrationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const registration = await TalentExam.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Registration status updated successfully",
      data: registration,
    });
  } catch (error) {
    console.error("Update registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// @desc    Delete registration
// @route   DELETE /api/talent-exam/registrations/:id
// @access  Private/Admin
export const deleteRegistration = async (req, res) => {
  try {
    const registration = await TalentExam.findByIdAndDelete(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Registration deleted successfully",
    });
  } catch (error) {
    console.error("Delete registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export const generateAdmitCard = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number required",
      });
    }

    // Find student
    const student = await TalentExam.findOne({ phone });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "No registration found with this phone number",
      });
    }

    // Create PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=admit-card-${student.phone}.pdf`,
    );

    doc.pipe(res);

    // Title
    doc.fontSize(22).text("YADUVANSHI ACADEMY TALENT SEARCH EXAM", {
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(16).text("ADMIT CARD", {
      align: "center",
      underline: true,
    });

    doc.moveDown(2);

    // Student details
    doc.fontSize(14);

    doc.text(`Student Name: ${student.name}`);
    doc.text(`Father Name: ${student.fName}`);
    doc.text(`Phone Number: ${student.phone}`);
    doc.text(`Class: ${student.class}`);
    // doc.text(`Address: ${student.address}`);

    doc.moveDown();

    // Generate simple roll number
    const rollNo = `YA-${student._id.toString().slice(-6).toUpperCase()}`;

    doc.text(`Roll Number: ${rollNo}`);

    doc.moveDown(2);

    doc.text("Exam Details", { underline: true });

    doc.moveDown();

    doc.text("Exam Date: 27 March 2026");
    doc.text("Reporting Time: 9:00 AM");
    doc.text("Exam Time: 10:00 AM - 12:00 PM");

    doc.moveDown();

    doc.text(
      "Exam Center: Yaduvanshi Academy Bansur, Alwar Road, Near Kanhaiya Nagar, Rajasthan",
    );

    doc.moveDown(3);

    doc.text("Important Instructions:", { underline: true });

    doc.moveDown();

    doc.text("1. Bring this admit card to exam hall.");
    doc.text("2. Reach exam center 30 minutes before exam.");
    doc.text("3. Carry one passport size photo.");
    doc.text("4. Use only blue or black pen.");

    doc.moveDown(4);

    doc.text("Authorized Signature", {
      align: "right",
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

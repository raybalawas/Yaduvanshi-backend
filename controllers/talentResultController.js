import TalentResult from "../models/TalentExamResult.js";
import TalentExam from "../models/TalentExam.js";

// Helper function to get total marks based on class
const getTotalMarksByClass = (className) => {
  const classNum = parseInt(className);
  if (classNum === 3 || classNum === 4 || className === '3rd' || className === '4th') {
    return 50;
  }
  return 60; // For 5th, 6th, 7th, 8th
};

// Helper function to calculate percentage
const calculatePercentage = (marks, className) => {
  const totalMarks = getTotalMarksByClass(className);
  return (marks / totalMarks) * 100;
};

// Helper function to get grade based on percentage
const getGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

// Helper function to get result status
const getResultStatus = (percentage) => {
  return percentage >= 40 ? 'pass' : 'fail';
};

// @desc    Upload single result
// @route   POST /api/talent-result/upload
// @access  Private/Admin
export const uploadResult = async (req, res) => {
  try {
    const {
      name,
      fName,
      phone,
      class: studentClass,
      marks,
      rollNo,
      srNo,
    } = req.body;

    // Check if result already exists
    const existingResult = await TalentResult.findOne({
      phone,
      class: studentClass,
    });

    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: `Result already exists for ${name} (${phone})`,
        data: existingResult,
      });
    }

    // Calculate percentage based on class
    const percentage = calculatePercentage(marks, studentClass);
    const resultStatus = getResultStatus(percentage);
    const grade = getGrade(percentage);
    const totalMarks = getTotalMarksByClass(studentClass);

    const registration = await TalentExam.findOne({ phone });

    const result = await TalentResult.create({
      registrationId: registration?._id || null,
      name: name.toUpperCase(),
      fName: fName.toUpperCase(),
      phone,
      class: studentClass,
      marks,
      totalMarks,
      percentage,
      resultStatus,
      grade,
      rollNo: rollNo || "",
      srNo: srNo || null,
    });

    res.status(201).json({
      success: true,
      message: "Result uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Upload result error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload result",
    });
  }
};

// @desc    Bulk upload results from array
// @route   POST /api/talent-result/bulk-upload
// @access  Private/Admin
export const bulkUploadResults = async (req, res) => {
  try {
    const { results } = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of results"
      });
    }

    const uploaded = [];
    const errors = [];
    let successCount = 0;

    for (const item of results) {
      try {
        // Map Excel columns to expected fields
        const name = item.NAME || item.name || item['Student Name'] || item['STUDENT NAME'];
        const fName = item['FATHER NAME'] || item.fName || item['Father Name'] || item.FATHER_NAME;
        const phone = item['MOBILE NO'] || item.phone || item.MOBILE || item['Phone Number'] || item.PHONE;
        const studentClass = item.CLASS || item.class || item.Class;
        const marks = item.MARKS || item.marks || item.Mark || item.MARK;
        const rollNo = item['ROLL NO'] || item.rollNo || item.RollNo || item.ROLL_NO || '';
        const srNo = item['SR.NO'] || item.srNo || item['SR NO'] || item.SR_NO || null;

        // Validate required fields
        if (!name) {
          errors.push({ item, error: "Name is required" });
          continue;
        }
        if (!fName) {
          errors.push({ item, error: "Father name is required" });
          continue;
        }
        if (!studentClass) {
          errors.push({ item, error: "Class is required" });
          continue;
        }
        if (marks === undefined || marks === null) {
          errors.push({ item, error: "Marks are required" });
          continue;
        }

        const cleanPhone = String(phone).replace(/\D/g, '');

        // Check if result already exists
        const existing = await TalentResult.findOne({
          phone: cleanPhone,
          class: studentClass
        });

        if (existing) {
          errors.push({
            name: name,
            phone: cleanPhone,
            error: "Result already exists"
          });
          continue;
        }

        // Calculate percentage based on class
        const percentage = calculatePercentage(Number(marks), studentClass);
        const resultStatus = getResultStatus(percentage);
        const grade = getGrade(percentage);
        const totalMarks = getTotalMarksByClass(studentClass);

        const registration = await TalentExam.findOne({ phone: cleanPhone });

        const result = await TalentResult.create({
          registrationId: registration?._id || null,
          name: String(name).toUpperCase(),
          fName: String(fName).toUpperCase(),
          phone: cleanPhone,
          class: studentClass,
          marks: Number(marks),
          totalMarks,
          percentage,
          resultStatus,
          grade,
          rollNo: rollNo ? String(rollNo) : '',
          srNo: srNo || null
        });

        uploaded.push(result);
        successCount++;
      } catch (err) {
        console.error("Error processing item:", err);
        errors.push({
          item: item,
          error: err.message
        });
      }
    }

    // After upload, calculate and update ranks
    if (successCount > 0) {
      await calculateAndUpdateRanks(null, null);
    }

    res.status(200).json({
      success: true,
      message: `Uploaded ${successCount} results successfully`,
      totalUploaded: successCount,
      totalFailed: errors.length,
      uploaded: uploaded.map(r => ({
        name: r.name,
        phone: r.phone,
        marks: r.marks,
        totalMarks: r.totalMarks,
        percentage: r.percentage,
        grade: r.grade,
        rank: r.rank
      })),
      errors
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to bulk upload results"
    });
  }
};

// @desc    Calculate and update ranks for all students
// @route   POST /api/talent-result/calculate-ranks
// @access  Private/Admin
export const calculateAndUpdateRanks = async (req, res) => {
  try {
    const classes = ["3rd", "4th", "5th", "6th", "7th", "8th"];
    let totalUpdated = 0;

    for (const className of classes) {
      // Get all results for this class, sorted by marks (descending)
      const classResults = await TalentResult.find({ class: className })
        .sort({ marks: -1 })
        .lean();

      if (classResults.length === 0) continue;

      let currentRank = 1;
      let previousMarks = null;

      for (let i = 0; i < classResults.length; i++) {
        const result = classResults[i];

        if (previousMarks !== null && result.marks < previousMarks) {
          currentRank = i + 1;
        }

        await TalentResult.updateOne(
          { _id: result._id },
          { rank: currentRank }
        );

        previousMarks = result.marks;
        totalUpdated++;
      }
    }

    if (req && res) {
      res.status(200).json({
        success: true,
        message: "Ranks calculated and updated successfully",
        totalUpdated,
      });
    }

    return { success: true, totalUpdated };
  } catch (error) {
    console.error("Calculate ranks error:", error);
    if (req && res) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate ranks",
      });
    }
    throw error;
  }
};

// @desc    Get all results with pagination
// @route   GET /api/talent-result/all
// @access  Private/Admin
export const getAllResults = async (req, res) => {
  try {
    const { page = 1, limit = 50, class: className, search } = req.query;

    const query = {};
    if (className) query.class = className;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { fName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      TalentResult.find(query)
        .sort({ class: 1, rank: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TalentResult.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: results,
    });
  } catch (error) {
    console.error("Get all results error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch results",
    });
  }
};

// @desc    Get result by phone number
// @route   GET /api/talent-result/check/:phone
// @access  Public
// @desc    Get result by phone number (can return multiple results)
// @route   GET /api/talent-result/check/:phone
// @access  Public
export const getResultByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    // Find ALL results for this phone number (not just one)
    const results = await TalentResult.find({ phone }).sort({ class: 1 });

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No result found for this phone number",
      });
    }

    // If single result, return as object (backward compatible)
    if (results.length === 1) {
      return res.status(200).json({
        success: true,
        data: results[0],
      });
    }

    // If multiple results, return as array
    res.status(200).json({
      success: true,
      multiple: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Get result error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch result",
    });
  }
};

// @desc    Get class-wise rank list
// @route   GET /api/talent-result/rank-list/:className
// @access  Public
export const getClassRankList = async (req, res) => {
  try {
    const { className } = req.params;

    const results = await TalentResult.find({ class: className })
      .sort({ rank: 1 })
      .select("name fName phone marks totalMarks percentage grade rollNo rank srNo");

    res.status(200).json({
      success: true,
      class: className,
      totalStudents: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Get rank list error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch rank list",
    });
  }
};

// @desc    Update result by ID
// @route   PUT /api/talent-result/update/:id
// @access  Private/Admin
export const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { marks, rollNo } = req.body;

    const result = await TalentResult.findById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    if (marks !== undefined) {
      result.marks = marks;
      // Recalculate percentage based on class
      const totalMarks = getTotalMarksByClass(result.class);
      result.totalMarks = totalMarks;
      result.percentage = (marks / totalMarks) * 100;
      result.resultStatus = getResultStatus(result.percentage);
      result.grade = getGrade(result.percentage);
    }
    if (rollNo !== undefined) result.rollNo = rollNo;

    await result.save();

    await calculateAndUpdateRanks(null, null);

    res.status(200).json({
      success: true,
      message: "Result updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update result error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update result",
    });
  }
};

// @desc    Delete result by ID
// @route   DELETE /api/talent-result/delete/:id
// @access  Private/Admin
export const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await TalentResult.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    await calculateAndUpdateRanks(null, null);

    res.status(200).json({
      success: true,
      message: "Result deleted successfully",
    });
  } catch (error) {
    console.error("Delete result error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete result",
    });
  }
};

// @desc    Get result statistics by class
// @route   GET /api/talent-result/stats
// @access  Private/Admin
export const getResultStats = async (req, res) => {
  try {
    const classes = ["3rd", "4th", "5th", "6th", "7th", "8th"];
    const stats = [];

    for (const className of classes) {
      const results = await TalentResult.find({ class: className });
      const total = results.length;
      const passed = results.filter((r) => r.resultStatus === 'pass').length;
      const avgMarks = results.reduce((sum, r) => sum + r.marks, 0) / (total || 1);
      const highest = Math.max(...results.map((r) => r.marks), 0);
      const lowest = Math.min(...results.map((r) => r.marks), 0);
      const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / (total || 1);
      const totalMarks = getTotalMarksByClass(className);

      stats.push({
        class: className,
        totalMarks,
        totalStudents: total,
        passed,
        failed: total - passed,
        passPercentage: total ? ((passed / total) * 100).toFixed(2) : 0,
        averageMarks: avgMarks.toFixed(2),
        averagePercentage: avgPercentage.toFixed(2),
        highestMarks: highest,
        lowestMarks: lowest,
      });
    }

    const totalStudents = await TalentResult.countDocuments();
    const totalPassed = await TalentResult.countDocuments({ resultStatus: 'pass' });

    res.status(200).json({
      success: true,
      totalStudents,
      totalPassed,
      totalFailed: totalStudents - totalPassed,
      overallPassPercentage: totalStudents
        ? ((totalPassed / totalStudents) * 100).toFixed(2)
        : 0,
      classWise: stats,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch statistics",
    });
  }
};
// @desc    Delete ALL results (Truncate table)
// @route   DELETE /api/talent-result/truncate
// @access  Private/Admin
export const truncateAllResults = async (req, res) => {
  try {
    // Count total records before deletion
    const totalRecords = await TalentResult.countDocuments();
    
    if (totalRecords === 0) {
      return res.status(400).json({
        success: false,
        message: "No records found to delete. Database is already empty.",
      });
    }
    
    // Delete all documents from TalentResult collection
    const result = await TalentResult.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} records. All talent exam results have been cleared.`,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Truncate results error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete records",
    });
  }
};
// Public routes (no auth required)
export const getAllResultsPublic = getAllResults;
export const getResultStatsPublic = getResultStats;

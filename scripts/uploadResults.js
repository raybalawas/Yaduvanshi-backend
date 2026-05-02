import mongoose from "mongoose";
import dotenv from "dotenv";
import TalentResult from "../models/TalentExamResult.js";
import TalentExam from "../models/TalentExam.js";

dotenv.config();

// Your data from the sheet
const resultsData = [
  { srNo: 1, name: "HIMANSHU YADAV", fName: "SURENDRA KUMAR YADAV", class: "6", phone: "7568670425", marks: 42, rollNo: "", rank: 1 },
  { srNo: 2, name: "AADITRI SHARMA", fName: "BHARAT SHARMA", class: "6", phone: "9252966666", marks: 40, rollNo: "", rank: 2 },
  { srNo: 3, name: "PURVA YADAV", fName: "RAKESH YADAV", class: "6", phone: "8955192389", marks: 37, rollNo: "", rank: 3 },
  { srNo: 4, name: "VIVEK YADAV", fName: "ROSHAN YADAV", class: "5", phone: "9929539191", marks: 36, rollNo: "", rank: 4 },
  { srNo: 5, name: "DEVESH YADAV", fName: "KRISHNA KUMAR YADAV", class: "5", phone: "8239161990", marks: 36, rollNo: "", rank: 4 },
  { srNo: 6, name: "ANSHUL", fName: "RAMESH", class: "6", phone: "9797397887", marks: 35, rollNo: "", rank: 5 },
  { srNo: 7, name: "NAITIK YADAV", fName: "SATYVEER YADAV", class: "5", phone: "9911576897", marks: 34, rollNo: "", rank: 6 },
  { srNo: 8, name: "PAYAL YADAV", fName: "MOHAN LAL", class: "6", phone: "8824498077", marks: 33, rollNo: "6254", rank: 7 },
  { srNo: 9, name: "AYUSH GURJAR", fName: "DATARAM GURJAR", class: "6", phone: "9772610070", marks: 33, rollNo: "", rank: 7 },
  { srNo: 10, name: "PIYUSH", fName: "RAMPAT", class: "5", phone: "8104436872", marks: 32, rollNo: "5225", rank: 8 },
  { srNo: 11, name: "BHUPENDRA YADAV", fName: "MAHENDRA YADAV", class: "6", phone: "9252811934", marks: 31, rollNo: "", rank: 9 },
  { srNo: 12, name: "PRITAM YADAV", fName: "MUNESH YADAV", class: "6", phone: "9785118357", marks: 31, rollNo: "", rank: 9 },
  { srNo: 13, name: "HANI YADAV", fName: "OMVEER YADAV", class: "6", phone: "7665152303", marks: 30, rollNo: "", rank: 10 },
  { srNo: 14, name: "SONU GURJAR", fName: "ASHOK KUMAR", class: "5", phone: "9588230195", marks: 29, rollNo: "5348", rank: 11 },
  { srNo: 15, name: "ABHINAV", fName: "DATARAM", class: "6", phone: "9772610070", marks: 29, rollNo: "", rank: 11 }
  // Add more as needed
];

const uploadResults = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    let successCount = 0;
    let errorCount = 0;

    for (const item of resultsData) {
      try {
        // Check if result already exists
        const existing = await TalentResult.findOne({
          phone: item.phone,
          class: `${item.class}th`
        });

        if (existing) {
          console.log(`⚠️ Skipping ${item.name} - Already exists`);
          errorCount++;
          continue;
        }

        // Find registration if exists
        const registration = await TalentExam.findOne({ phone: item.phone });

        await TalentResult.create({
          registrationId: registration?._id || null,
          name: item.name.toUpperCase(),
          fName: item.fName.toUpperCase(),
          phone: item.phone,
          class: `${item.class}th`,
          marks: item.marks,
          rollNo: item.rollNo || '',
          srNo: item.srNo
        });

        console.log(`✅ Uploaded: ${item.name} - ${item.marks} marks`);
        successCount++;
      } catch (err) {
        console.error(`❌ Error for ${item.name}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Upload Complete!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Upload error:", error);
    process.exit(1);
  }
};

uploadResults();
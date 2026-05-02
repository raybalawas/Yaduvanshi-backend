import mongoose from 'mongoose';

const talentResultSchema = new mongoose.Schema({
  // Registration reference (optional - for linking)
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TalentExam',
    default: null
  },
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    uppercase: true,
    index: true
  },
  fName: {
    type: String,
    required: [true, "Father's name is required"],
    trim: true,
    uppercase: true,
    index: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    index: true
  },
  class: {
    type: String,
    required: [true, 'Class is required'],
    enum: ['3', '4', '5', '6', '7', '8'],
    index: true
  },
  rollNo: {
    type: String,
    default: '',
    trim: true
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: 0,
    max: 100,
    default: 0
  },
  rank: {
    type: Number,
    default: null
  },
  percentage: {
    type: Number,
    default: 0
  },
  resultStatus: {
    type: String,
    enum: ['pass', 'fail'],
    default: 'fail'
  },
  srNo: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Auto-calculate percentage and status before saving
talentResultSchema.pre('save', function(next) {
  if (this.marks) {
    this.percentage = (this.marks / 100) * 100;
    this.resultStatus = this.marks >= 33 ? 'pass' : 'fail';
  }
  next();
});

// Compound indexes for better performance
talentResultSchema.index({ class: 1, rank: 1 });
talentResultSchema.index({ class: 1, marks: -1 });
talentResultSchema.index({ phone: 1, class: 1 });

const TalentResult = mongoose.model('TalentResult', talentResultSchema);
export default TalentResult;
import mongoose from 'mongoose';

const talentExamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters']
  },
  fName: {
    type: String,
    required: [true, "Father's name is required"],
    trim: true,
    minlength: [3, "Father's name must be at least 3 characters"]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
  },
  class: {
    type: String,
    required: [true, 'Class is required'],
    enum: ['3rd', '4th', '5th', '6th', '7th', '8th']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    minlength: [8, 'Address must be at least 8 characters']
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true,
  bufferCommands: true, // Make sure this is true or not specified (defaults to true)
  bufferTimeoutMS: 30000 // Wait 30 seconds for connection
});

// Create indexes
talentExamSchema.index({ phone: 1 });
talentExamSchema.index({ name: 'text', fName: 'text' });

const TalentExam = mongoose.model('TalentExam', talentExamSchema);

export default TalentExam;
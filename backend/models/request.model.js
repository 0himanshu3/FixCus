import mongoose from 'mongoose'

const municipalityApplicationSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: true
  },
  municipalityName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  establishmentDate: {
    type: Date,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  supportingDocuments: [{
    type: String  
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Municipality',
    required: true
  },
}, { timestamps: true })

export const MunicipalityApplication=mongoose.model('MunicipalityApplication', municipalityApplicationSchema)

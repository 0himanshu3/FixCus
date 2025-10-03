import {MunicipalityApplication} from "../models/request.model.js"
import {Municipality} from "../models/muncipality.model.js"
export const applicationReq = async (req, res) => {
  try {
   
    const {
      address,
      establishmentDate,
      message,
      adminName,
      municipalityName,
      userId
    } = req.body
    

    // Multer adds the files to req.files
    const supportingDocuments = req.files?.map(file => file.filename) || []

    const application = new MunicipalityApplication({
      address,
      establishmentDate,
      message,
      adminName,
      municipalityName,
      user: userId,
      supportingDocuments,
      status: 'pending'
    })

    await application.save()

    res.status(201).json({ message: 'Application submitted successfully' })
  } catch (error) {
    console.error('Application error:', error)
    res.status(500).json({ message: 'Failed to submit application' })
  }
}

export const getStatus = async (req, res) => {
  try {
    const { userId } = req.params; 
    const application = await MunicipalityApplication.findOne({user: userId });
    res.status(200).json(application || null); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all pending requests
export const getRequests = async (req, res) => {
  try {
    const requests = await MunicipalityApplication.find({ status: 'pending' }).sort({ createdAt: -1 })
    res.status(200).json(requests)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch requests' })
  }
}

// Approve a request

export const approveRequest = async (req, res) => {
  try {

    const request = await MunicipalityApplication.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    )
    if (!request) return res.status(404).json({ message: 'Request not found' })

   
    if (request.user) {
      await Municipality.findByIdAndUpdate(request.user, { accountApproved: true })
    }

    res.status(200).json(request)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to approve request' })
  }
}
// Reject a request
export const rejectRequest = async (req, res) => {
  try {
    const request = await MunicipalityApplication.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    )
    if (!request) return res.status(404).json({ message: 'Request not found' })
    res.status(200).json(request)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to reject request' })
  }
}
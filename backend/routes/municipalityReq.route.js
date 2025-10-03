import express, { application } from "express"
import { applicationReq,getStatus,getRequests,approveRequest,rejectRequest} from "../controllers/municipalityReq.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";


const router =express.Router();

router.post('/apply',applicationReq)
router.get('/getInfo/:userId',getStatus)
router.get('/requests/pending', getRequests)
router.patch('/requests/:id/approve',approveRequest)
router.patch('/requests/:id/reject',rejectRequest)
export default router;
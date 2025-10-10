import express, { application } from "express"
import { applicationReq,getStatus,getRequests,approveRequest,rejectRequest} from "../controllers/municipalityReq.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";


const router =express.Router();

router.post('/apply',isAuthenticated,applicationReq)
router.get('/getInfo/:userId',isAuthenticated,getStatus)
router.get('/requests/pending', isAuthenticated,getRequests)
router.patch('/requests/:id/approve',isAuthenticated,approveRequest)
router.patch('/requests/:id/reject',isAuthenticated,rejectRequest)
export default router;
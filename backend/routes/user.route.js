import express from "express"
import { forgotPassword, getUser, login, logout, getStaffs,register, resetPassword,  verifyOtp,getAllUsers,getAllMunicipalities, assignMunicipalityStaff, updateStaffExpertises} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";


const router =express.Router();

router.post('/register',register)
router.post("/verify-otp",verifyOtp)
router.post("/login",login)
router.get("/logout",isAuthenticated, logout)
router.get("/profile",isAuthenticated,getUser)
router.get("/getusers",isAuthenticated,getAllUsers)
router.get("/staff",isAuthenticated,getStaffs)
router.get("/getmunicipalities",isAuthenticated,getAllMunicipalities)
router.post("/password/forgot",forgotPassword)
router.put("/password/reset/:token",resetPassword)
// router.put("/updateUser",updateUser)
router.post("/assign-municipality-staff",isAuthenticated, assignMunicipalityStaff)
router.put("/staff/:id/expertises", isAuthenticated, updateStaffExpertises);
// router.put("/updatePassword",updatePassword)
export default router;
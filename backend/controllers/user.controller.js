import { log } from "console";
import { User } from "../models/user.model.js";
import { Municipality } from "../models/muncipality.model.js";
import { generateForgotPasswordEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import bcrypt from "bcryptjs"
import crypto from "crypto"

export const register = async (req, res) => {
    try {
        // Destructure all fields including role and municipalityName
        let { name, email, password, location, role, municipalityName, district, state, country } = req.body;
        
        // Validate all required fields including location
        if (!name || !email || !password || !location || !role) {
            return res.status(400).json({ msg: "Please fill in all fields, including location and role" });
        }
        
        // If municipality admin, validate municipality name
        if (role === 'municipality_admin' && !municipalityName) {
            return res.status(400).json({ msg: "Municipality name is required for municipality admin" });
        }
        
        // Check if email already exists in either User or Municipality collection
        const existingUser = await User.findOne({ email, accountVerified: true });
        const existingMunicipality = await Municipality.findOne({ email, accountVerified: true });
        
        if (existingUser || existingMunicipality) {
            return res.status(400).json({ msg: "Email is already registered" });
        }
        
        if (password.length < 8 || password.length > 16) {
            return res.status(400).json({ msg: "Password must be between 8 and 16 characters" });
        }
        
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        let user;
        
        if (role === 'municipality_admin') {
            // Create municipality admin
            user = await Municipality.create({ 
                name, 
                email, 
                password: hashedPassword, 
                location, 
                municipalityName,
                district,
                state,
                country,
                role: 'Municipality Admin'
            });
        } else {
            // Create regular citizen
            user = await User.create({ 
                name, 
                email, 
                password: hashedPassword, 
                location,
                district,
                state,
                country
            });
        }
        
        const verificationCode = await user.generateVerificationCode();
        await user.save();
        
        sendVerificationCode(verificationCode, email, res);

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}


export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ msg: "Please fill in all fields" });
        }
        
        // Check both User and Municipality collections for unverified accounts
        const userEntries = await User.find({
            email,
            accountVerified: false,
        }).sort({ createdAt: -1 });
        
        const municipalityEntries = await Municipality.find({
            email,
            accountVerified: false,
        }).sort({ createdAt: -1 });
        
        console.log("User entries:", userEntries);
        console.log("Municipality entries:", municipalityEntries);
        
        // Determine which collection has the user
        let user;
          if (municipalityEntries.length > 0) {
            user = municipalityEntries[0];
        } 
        else if (userEntries.length > 0) {
          user = userEntries[0];
      }
      else {
            return res.status(400).json({ msg: "Invalid OTP" });
        }
        
        console.log("Found user:", user);
        console.log("Verification code:", user.verificationCode);
        
        if(user.verificationCode !== Number(otp)){
            return res.status(400).json({ msg: "Invalid OTP" });
        }
        
        const currentTime = Date.now();
        const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();

        if(currentTime > verificationCodeExpire){
            return res.status(400).json({ msg: "OTP has expired" });
        }
        
        // Update the user (works for both User and Municipality models)
        user.accountVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpire = null;
        await user.save({validateModifiedOnly: true});

        sendToken(user, 200, "Account Verified", res);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: "Please fill in all fields" });
        }

        // Check both User and Municipality collections for verified accounts
        let user = await User.findOne({ email, accountVerified: true }).select("+password");
        
        if (!user) {
            user = await Municipality.findOne({ email, accountVerified: true }).select("+password");
        }

        if (!user) {
            return res.status(400).json({ msg: "User not found" });
        }

        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if (!isPasswordMatched) {
            return res.status(400).json({ msg: "Invalid password" });
        }

        sendToken(user, 200, "User logged in successfully", res);

    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


export const logout =async(req,res)=>{
    try {
        
        res.clearCookie('token', { httpOnly: true });
        return res.status(200).json({ success: true, message: "Logged out successfully"})
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ success: false, message: "Internal Server Error"
             })
        }
}

export const getUser = async (req, res) => {
    try {
       const user = req.user;
       return res.status(200).json({ success: true, user });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });

        
    }
}

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
    });
  }
};
export const getAllMunicipalities = async (req, res) => {
  try {
    const users = await Municipality.find().select('-password');

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
    });
  }
};

export const forgotPassword= async(req,res)=>{
    const user = await User.findOne({
        email: req.body.email,
        accountVerified: true,
    });
    
    if (!user) {
        return res.status(400).json({success:false,message:"Invalid email"})
    }
    
    const resetToken = user.getResetPasswordToken();
    
    await user.save({ validateBeforeSave: false });
    
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    
    const message = generateForgotPasswordEmailTemplate(resetPasswordUrl);

    
    try {
        await sendEmail({
            email: user.email,
            subject: "FixCus Password Recovery",
            message,
        });
        
    
        return res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully.`,
        });
    } catch (error) {
        console.log(error.message);
        
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        
    }
}


// Controller function to reset the user's password
export const resetPassword = async (req, res) => {
  // Extract the reset token from the URL parameters
  const { token } = req.params;

  // Hash the token using SHA-256 (to match the hashed version stored in DB)
  const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find the user by the hashed token and check that it hasn't expired
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() }, // Token must still be valid (future expiry)
  });

  // If no matching user is found or token is expired, return error
  if (!user) {
    return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
  }

  // Validate that password and confirmPassword match
  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match." });
  }

  // Validate password length
  if (req.body.password.length < 8 || req.body.password.length > 16) {
    return res.status(400).json({ success: false, message: "Password must be between 8 and 16 characters." });
  }

  // Hash the new password using bcrypt
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  // Update the user's password and remove the reset token fields
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Save the updated user document
  await user.save();

  // Respond with success
  return res.status(200).json({ success: true, message: "Password reset successfully." });
};

export const updateUser = async (req, res) => {
    try {
      const { user_id } = req.body;
      if (!user_id) {
        return res.status(400).json({ message: "No user_id provided" });
      }
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  

      if (typeof req.body.location !== "undefined") {
        user.location = req.body.location.charAt(0).toUpperCase() + req.body.location.slice(1).toLowerCase();
        }   
  
      if (typeof req.body.weekdays !== "undefined") {
        user.availability.weekdays =
          req.body.weekdays === "true" || req.body.weekdays === true;
      }
      if (typeof req.body.weekends !== "undefined") {
        user.availability.weekends =
          req.body.weekends === "true" || req.body.weekends === true;
      }
  
      if (typeof req.body.avatarURL !== "undefined") {
        user.avatar = req.body.avatarURL;
      }
  
      await user.save();
  
      return res.status(200).json({
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  };

  export const updatePassword = async (req, res) => {
    try {
      const { user_id, oldPassword, newPassword } = req.body;
  
      // Basic validation
      if (!user_id || !oldPassword || !newPassword) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      // Check new password length
      if (newPassword.length < 8 || newPassword.length > 16) {
        return res
          .status(400)
          .json({ message: "Password must be between 8 and 16 characters." });
      }
  
      // Find user and include password field
      const user = await User.findById(user_id).select("+password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Check if oldPassword is correct
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
  
      // Hash the new password
      const saltRounds = 10; // Adjust as needed
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
      user.password = hashedPassword;
      await user.save();
  
      return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  };

export const getStaffs = async (req, res) => {
  try {
    const municipalityUser = req.user; 
    if (!municipalityUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const staffList = await User.find({
      role: "Municipality Staff",
      district: municipalityUser.district
    }).select("-password"); 

    res.status(200).json(staffList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


export const assignMunicipalityStaff = async (req, res, next) => {
  try {
    // ---- Basic auth/role check ----
    // Assume auth middleware has set req.user (with at least .role and .id)
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // ---- Validate input ----
    const { email, expertises } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Valid email is required." });
    }

    if (!Array.isArray(expertises) || expertises.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of at least one expertise." });
    }

    const issueCategories = [
      "Road damage",
      "Waterlogging / Drainage Issues",
      "Improper Waste Management",
      "Street lights/Exposed Wires",
      "Unauthorized loudspeakers",
      "Burning of garbage",
      "Encroachment / Illegal Construction",
      "Damaged Public Property",
      "Stray Animal Menace",
      "General Issue"
    ];

    // Note: be careful: your frontend used "Street lights/Exposed Wires" (no extra slash).
    // Make sure the strings match exactly between frontend and backend. If you prefer,
    // normalize/alias them. For now we check exact membership (case-sensitive).
    // If some category labels differ, adjust issueCategories accordingly.
    const invalid = expertises.filter(e => !issueCategories.includes(e));
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some provided expertises are invalid.",
        invalidExpertises: invalid
      });
    }

    // ---- Find user ----
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password"); // .select only to be explicit
    if (!user) {
      return res.status(404).json({ success: false, message: "User with that email not found." });
    }

    // ---- Update role and expertises ----
    user.role = "Municipality Staff";
    user.expertises = expertises;
    // Optionally, you might set other flags like accountApproved = true, availability defaults, etc.
    await user.save();

    // return sanitized user (omit password)
    const safeUser = await User.findById(user._id).select("-password -resetPasswordToken -resetPasswordExpires -verificationCode -verificationCodeExpire");

    return res.status(200).json({
      success: true,
      message: "User promoted to Municipality Staff and expertises assigned.",
      user: safeUser
    });
  } catch (err) {
    console.error("assignMunicipalityStaff error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateStaffExpertises = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });


    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Staff id required in params." });

    const { expertises } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "Staff not found." });

    // Ensure role is Municipality Staff (optional, but keeps data consistent)
    if (user.role !== "Municipality Staff") user.role = "Municipality Staff";

    user.expertises = expertises;
    await user.save();

    const safeUser = await User.findById(user._id).select("-password -resetPasswordToken -resetPasswordExpires -verificationCode -verificationCodeExpire");

    return res.status(200).json({ success: true, message: "Expertises updated", user: safeUser });
  } catch (err) {
    console.error("updateStaffExpertises error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
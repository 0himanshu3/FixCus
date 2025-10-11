import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useParams, useNavigate } from 'react-router-dom'
import { otpVerification, resetAuthSlice } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function OTP() {
    const {email} = useParams();
    const [otp, setOtp] = React.useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error, message, user, isAuthenticated } = useSelector((state) => state.auth);
      
    const handleOtpVerification = (e) => {
        e.preventDefault();
        dispatch(otpVerification(email, otp))
    }

    useEffect(() => {
        if (message) {
            toast.success(message);
            if (isAuthenticated && user) {
                if (user.role === "Municipality Admin") {
                    navigate("/dashboard");
                } else {
                    navigate("/");
                }
            }
        }
        if (error) {
            toast.error(error);
            dispatch(resetAuthSlice());
        }
    }, [dispatch, isAuthenticated, error, loading, message, user, navigate]);
    
    if (isAuthenticated) {
        if (user && user.role === "Municipality Admin") {
            return <Navigate to="/municipality" />;
        }
        return <Navigate to="/" />;
    }

    const leftVariants = {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    };

    return (
        <div className="flex flex-col justify-center md:flex-row h-screen relative overflow-hidden">
            {/* Animated circus background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 opacity-50"></div>
            <div className="absolute inset-0" style={{
                backgroundImage: `
                    radial-gradient(circle at 20% 50%, rgba(255, 182, 193, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(186, 85, 211, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 40% 20%, rgba(255, 215, 0, 0.3) 0%, transparent 50%)
                `
            }}></div>

            {/* Main Content - Centered Card */}
            <motion.div
                className="w-full flex items-center justify-center p-8 relative z-10"
                initial="initial"
                animate="animate"
                variants={leftVariants}
            >
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-4 border-purple-200 relative">
                    {/* Back Button */}
                    <Link
                        to="/register"
                        className="absolute -top-4 -left-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-bold px-6 py-2 rounded-full shadow-lg hover:scale-105 transition-all duration-300 transform"
                    >
                        ← Back
                    </Link>

                    {/* Header with emoji */}
                    <div className="text-center mb-6 mt-4">
                        <div className="inline-block bg-gradient-to-r from-green-400 to-blue-500 text-white text-4xl p-4 rounded-full mb-4 shadow-lg">
                            📬
                        </div>
                        <h3 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            Check Your Mail!
                        </h3>
                        <p className="text-gray-600 font-medium">Enter the OTP sent to your email</p>
                        <p className="text-sm text-purple-600 font-semibold mt-2">{email}</p>
                    </div>

                    <form onSubmit={handleOtpVerification} className="space-y-4">
                        {/* OTP Input */}
                        <div>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="🔢 Enter OTP"
                                maxLength="6"
                                className="w-full px-4 py-4 text-center text-2xl font-bold tracking-widest border-3 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all placeholder-gray-400"
                            />
                        </div>

                        {/* Info text */}
                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                Didn't receive the code?{' '}
                                <button type="button" className="text-purple-600 font-bold hover:underline">
                                    Resend OTP
                                </button>
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? '⏳ Verifying...' : '✅ VERIFY OTP'}
                        </button>
                    </form>

                    {/* Footer note */}
                    <div className="text-center mt-6">
                        <p className="text-xs text-gray-500">
                            🔒 Your information is secure with us
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Decorative floating elements */}
            <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-300 rounded-full opacity-20 animate-pulse hidden md:block"></div>
            <div className="absolute bottom-20 right-16 w-32 h-32 bg-pink-300 rounded-full opacity-20 animate-bounce hidden md:block" style={{ animationDuration: '3s' }}></div>
            <div className="absolute top-1/3 right-20 w-16 h-16 bg-purple-300 rounded-full opacity-30 hidden md:block"></div>
        </div>
    )
}

export default OTP

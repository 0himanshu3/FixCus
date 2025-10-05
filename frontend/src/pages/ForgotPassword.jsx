import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, resetAuthSlice } from '../redux/slices/authSlice';
import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

function ForgotPassword() {
    const [email, setEmail] = React.useState('');
    const dispatch = useDispatch();

    const { loading, error, message, user, isAuthenticated } = useSelector(state => state.auth);

    const handleForgotPassword = (e) => {
        e.preventDefault();
        dispatch(forgotPassword(email));
    }

    useEffect(() => {
        if (message) {
            toast.success(message);
            setTimeout(() => {
                dispatch(resetAuthSlice());
            }, 100);
        }
        if (error) {
            toast.error(error);
            dispatch(resetAuthSlice());
        }
    }, [dispatch, message, error]);
    
    if (isAuthenticated) {
        return <Navigate to={"/"} />
    }

    const centerVariants = {
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
                variants={centerVariants}
            >
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-4 border-purple-200 relative">
                    {/* Back Button */}
                    <Link
                        to="/login"
                        className="absolute -top-4 -left-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-bold px-6 py-2 rounded-full shadow-lg hover:scale-105 transition-all duration-300 transform"
                    >
                        ← Back
                    </Link>

                    {/* Header with emoji */}
                    <div className="text-center mb-6 mt-4">
                        <div className="inline-block bg-gradient-to-r from-orange-400 to-red-500 text-white text-4xl p-4 rounded-full mb-4 shadow-lg">
                            🔑
                        </div>
                        <h3 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            Forgot Password?
                        </h3>
                        <p className="text-gray-600 font-medium">No worries! We'll send you reset instructions</p>
                    </div>

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        {/* Email Input */}
                        <div>
                            <input
                                type="email"
                                value={email}
                                required
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="📧 Enter your email"
                                className="w-full px-4 py-3 border-3 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all placeholder-gray-400"
                            />
                        </div>

                        {/* Info text */}
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3">
                            <p className="text-xs text-purple-700 text-center">
                                💡 We'll send a password reset link to your email address
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? '⏳ Sending...' : '📨 SEND RESET LINK'}
                        </button>
                    </form>

                    {/* Footer link */}
                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600">
                            Remember your password?{' '}
                            <Link to="/login" className="text-purple-600 font-bold hover:underline">
                                Sign In 🚀
                            </Link>
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

export default ForgotPassword

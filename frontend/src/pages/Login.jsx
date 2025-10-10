import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { login, resetAuthSlice } from '../redux/slices/authSlice';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion'

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useDispatch();

    const { loading, error, message, user, isAuthenticated } = useSelector(state => state.auth);
    
    const navigateTo = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('email', email);
        data.append('password', password);
        dispatch(login(data));
    }

    useEffect(() => {
        if (message) {
            toast.success(message || "Login successful!", {
                position: "top-right",
                autoClose: 2000,
                theme: "colored"
            });
            
            setTimeout(() => {
                if (user?.role === 'Admin') {
                    navigateTo("/admin/dashboard");
                } else if (user?.role === 'Municipality Admin') {
                    navigateTo("/municipality");
                } else {
                    navigateTo("/");
                }
            }, 1500);
        }

        if (error) {
            toast.error(error || "Login failed! Please try again.", {
                position: "top-right",
                autoClose: 3000,
                theme: "colored"
            });
            dispatch(resetAuthSlice());
        }
    }, [dispatch, isAuthenticated, error, loading, message, user, navigateTo]);

    if (isAuthenticated) {
        if (user?.role === 'Admin') {
            return <Navigate to="/admin/dashboard" />;
        } else if (user?.role === 'Municipality Admin') {
            return <Navigate to="/dashboard" />;
        }
        return <Navigate to={"/"} />;
    }

    const leftVariants = {
        initial: { opacity: 0, x: "-50%" },
        animate: { opacity: 1, x: "0%", transition: { duration: 0.5, ease: "easeInOut" } },
        exit: { opacity: 0, x: "50%", transition: { duration: 0.5, ease: "easeInOut" } }
    };
    
    const rightVariants = {
        initial: { opacity: 0, x: "50%" },
        animate: { opacity: 1, x: "0%", transition: { duration: 0.5, ease: "easeInOut" } },
        exit: { opacity: 0, x: "-50%", transition: { duration: 0.5, ease: "easeInOut" } }
    };

    return (
        <div className="flex flex-col justify-center md:flex-row h-screen relative overflow-hidden">
            {/* Toasts */}
            <ToastContainer />

            {/* Animated circus background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 opacity-50"></div>
            <div className="absolute inset-0" style={{
                backgroundImage: `
                    radial-gradient(circle at 20% 50%, rgba(255, 182, 193, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(186, 85, 211, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 40% 20%, rgba(255, 215, 0, 0.3) 0%, transparent 50%)
                `
            }}></div>

            {/* LEFT SIDE - Login Form */}
            <motion.div
                className="w-full md:w-1/2 flex items-center justify-center p-8 relative z-10"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={leftVariants}
            >
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-4 border-purple-200">
                    {/* Header with emoji */}
                    <div className="text-center mb-6">
                        <div className="inline-block bg-gradient-to-r from-blue-400 to-purple-500 text-white text-4xl p-4 rounded-full mb-4 shadow-lg">
                            🎯
                        </div>
                        <h3 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            Welcome Back!
                        </h3>
                        <p className="text-gray-600 font-medium">Sign in to continue your journey</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="📧 Email Address"
                                className="w-full px-4 py-3 border-3 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all placeholder-gray-400"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="🔒 Password"
                                className="w-full px-4 py-3 border-3 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all placeholder-gray-400"
                            />
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <Link to="/password/forgot" className="text-purple-600 font-semibold text-sm hover:underline">
                                Forgot Password? 🤔
                            </Link>
                        </div>

                        {/* Mobile Sign Up Link */}
                        <div className="block md:hidden text-center pt-2">
                            <p className="text-gray-600 text-sm font-medium">
                                New to our platform?{' '}
                                <Link to="/register" className="text-purple-600 font-bold hover:underline">
                                    Sign Up! 🚀
                                </Link>
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? '⏳ Signing In...' : '🎉 SIGN IN NOW!'}
                        </button>
                    </form>
                </div>
            </motion.div>

            {/* RIGHT SIDE - Sign Up Panel */}
            <motion.div
                className="hidden w-full md:w-1/2 bg-white text-gray-800 md:flex flex-col items-center justify-center p-8 relative z-10 border-l-8 border-purple-300"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={rightVariants}
                style={{
                    boxShadow: '-15px 0 30px rgba(147, 51, 234, 0.2)'
                }}
            >
                <div className="absolute top-10 right-10 w-24 h-24 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute bottom-20 left-16 w-32 h-32 bg-pink-300 rounded-full opacity-20 animate-bounce" style={{ animationDuration: '3s' }}></div>
                <div className="absolute top-1/3 left-20 w-16 h-16 bg-purple-300 rounded-full opacity-30"></div>
                
                <div className="text-center z-10 space-y-6">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-full shadow-2xl transform hover:scale-110 transition-transform duration-300">
                                <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            New Here? 🎊
                        </h2>
                        <p className="text-lg text-gray-600 font-medium mb-2">
                            Join our community today!
                        </p>
                        <p className="text-gray-500 mb-8">
                            Create an account and start your adventure!
                        </p>
                    </div>
                    
                    <Link
                        to={"/register"}
                        className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-12 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform hover:-translate-y-1"
                    >
                        SIGN UP NOW! ✨
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}

export default Login;

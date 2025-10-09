import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { register, resetAuthSlice } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { motion } from "framer-motion";
import LocationPicker from "../components/LocationPicker"

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [location, setLocation] = useState(null);
    const [category, setCategory] = useState('');
    const [role, setRole] = useState('citizen');
    const [municipalityName, setMunicipalityName] = useState(''); 
    const [division, setDivision] = useState('');
    const [errors, setErrors] = useState({ name: '', email: '', password: '', municipalityName: '', location: '', division: '' });

    const dispatch = useDispatch();
    const { loading, error, message, isAuthenticated } = useSelector(state => state.auth);
    const navigateTo = useNavigate();

    const validateName = (value) => (!value.trim() ? 'Name is required' : '');
    const validateEmail = (value) => {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Enter a valid email (must include @ and domain)' : '';
    };
    const validatePassword = (value) =>
        !value ? 'Password is required' : (value.length < 8 || value.length > 16 ? 'Password must be 8–16 characters' : '');
    const validateMunicipalityName = (value) =>
        role === 'municipality_admin' && !value.trim() ? 'Municipality name is required' : '';
    const validateLocation = (value) =>
        !value || !value.lat || !value.lng ? 'Location is required' : '';
    const validateDivision = (value) =>
        role === 'municipality_admin' && !value ? 'Division is required' : '';

    const validateAll = () => {
        const newErrors = {
            name: validateName(name),
            email: validateEmail(email),
            password: validatePassword(password),
            municipalityName: validateMunicipalityName(municipalityName),
            location: validateLocation(location),
            division: validateDivision(division),
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((m) => m === '');
    };

    const handleRegister = (e) => {
        e.preventDefault();
        if (!validateAll()) return;
        const payload = {
            name,
            email,
            password,
            location: `${location.lat},${location.lng}`,
            district: location?.district || "",
            state: location?.state || "",
            country: location?.country || "",
            category,
            role,
            ...(role === 'municipality_admin' ? { municipalityName, division } : {})
        };
        dispatch(register(payload));
    }

    if (isAuthenticated) return <Navigate to={"/"} />

    useEffect(() => {
        if (message) navigateTo(`/otp-verification/${email}`)
        if (error) {
            toast.error(error);
            dispatch(resetAuthSlice());
        }
    }, [dispatch, isAuthenticated, error, loading, message, email, navigateTo])

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

    const divisionOptions = [
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

    return (
        <div className="flex flex-col justify-center md:flex-row h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 opacity-50"></div>
            <div className="absolute inset-0" style={{
                backgroundImage: `
                    radial-gradient(circle at 20% 50%, rgba(255, 182, 193, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(186, 85, 211, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 40% 20%, rgba(255, 215, 0, 0.3) 0%, transparent 50%)
                `
            }}></div>

            {/* LEFT SIDE */}
            <motion.div
                className="hidden w-full md:w-1/2 bg-white text-gray-800 md:flex flex-col items-center justify-center p-8 relative z-10 border-r-8 border-purple-300"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={rightVariants}
                style={{ boxShadow: '15px 0 30px rgba(147, 51, 234, 0.2)' }}
            >
                <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute bottom-20 right-16 w-32 h-32 bg-pink-300 rounded-full opacity-20 animate-bounce" style={{ animationDuration: '3s' }}></div>
                <div className="absolute top-1/3 right-20 w-16 h-16 bg-purple-300 rounded-full opacity-30"></div>
                
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
                    <h2 className="text-5xl font-black mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Hey There! 👋
                    </h2>
                    <p className="text-lg text-gray-600 font-medium mb-2">
                        Already part of the crew?
                    </p>
                    <Link
                        to={"/login"}
                        className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-12 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform hover:-translate-y-1"
                    >
                        SIGN IN NOW! ✨
                    </Link>
                </div>
            </motion.div>

            {/* RIGHT SIDE */}
            <motion.div
                className="w-full md:w-1/2 flex items-center justify-center p-8 relative z-10"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={leftVariants}
            >
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-4 border-purple-200">
                    <div className="text-center mb-6">
                        <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-4xl p-4 rounded-full mb-4 shadow-lg">
                            🎪
                        </div>
                        <h3 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            Join the Party!
                        </h3>
                        <p className="text-gray-600 font-medium">Create your account & let's get started</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-3">
                        {/* Role Selector */}
                        <div>
                            <label className="block text-sm font-bold text-purple-700 mb-2">🎭 I am a...</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-3 border-3 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all bg-purple-50 font-medium"
                            >
                                <option value="citizen">🙋 Citizen</option>
                                <option value="municipality_admin">🏛️ Municipality Admin</option>
                            </select>
                        </div>

                        {/* Name */}
                        <div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setErrors(prev => ({ ...prev, name: validateName(e.target.value) }));
                                }}
                                placeholder={role === 'municipality_admin' ? "👤 Admin Name" : "👤 Your Full Name"}
                                className="w-full px-4 py-3 border-3 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all placeholder-gray-400"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">⚠️ {errors.name}</p>}
                        </div>

                        {/* Municipality Name & Division */}
                        {role === 'municipality_admin' && (
                            <>
                                <div>
                                    <input
                                        type="text"
                                        value={municipalityName}
                                        onChange={(e) => {
                                            setMunicipalityName(e.target.value);
                                            setErrors(prev => ({ ...prev, municipalityName: validateMunicipalityName(e.target.value) }));
                                        }}
                                        placeholder="🏛️ Municipality Name"
                                        className="w-full px-4 py-3 border-3 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all placeholder-gray-400"
                                    />
                                    {errors.municipalityName && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">⚠️ {errors.municipalityName}</p>}
                                </div>

                                <div>
                                    <select
                                        value={division}
                                        onChange={(e) => {
                                            setDivision(e.target.value);
                                            setErrors(prev => ({ ...prev, division: validateDivision(e.target.value) }));
                                        }}
                                        className="w-full px-4 py-3 border-3 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all bg-purple-50 font-medium"
                                    >
                                        <option value="">🏗️ Select Division</option>
                                        {divisionOptions.map((opt, idx) => (
                                            <option key={idx} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    {errors.division && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">⚠️ {errors.division}</p>}
                                </div>
                            </>
                        )}

                        {/* Email */}
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
                                }}
                                placeholder="📧 Email Address"
                                className="w-full px-4 py-3 border-3 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all placeholder-gray-400"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">⚠️ {errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
                                }}
                                placeholder="🔒 Password (8-16 chars)"
                                className="w-full px-4 py-3 border-3 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all placeholder-gray-400"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">⚠️ {errors.password}</p>}
                        </div>

                        {/* Location */}
                        <div>
                            <LocationPicker 
                                location={location} 
                                setLocation={(val) => {
                                    setLocation(val);
                                    setErrors(prev => ({ ...prev, location: validateLocation(val) }));
                                }} 
                            />
                            {errors.location && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">⚠️ {errors.location}</p>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-4"
                        >
                            {loading ? '⏳ Creating Magic...' : '🎉 SIGN UP NOW!'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}

export default Register;

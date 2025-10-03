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

    const dispatch = useDispatch();
    const {
        loading, error, message, isAuthenticated
    } = useSelector(state => state.auth);

    const navigateTo = useNavigate();

    const handleRegister = (e) => {
        e.preventDefault();
        // Ensure location is provided before proceeding
        if (!location) {
            toast.error("Please enter your location");
            return;
        }
        // If municipality admin, ensure municipality name is provided
        if (role === 'municipality_admin' && !municipalityName.trim()) {
            toast.error("Please enter municipality name");
            return;
        }
        const data = new FormData();
        data.append('name', name);
        data.append('email', email);
        data.append('password', password);
        data.append('location', location); // Append location to the form data
        data.append('category', category);
        data.append('role', role);
        if (role === 'municipality_admin') {
            data.append('municipalityName', municipalityName);
        }
        dispatch(register(data));
    }

    if (isAuthenticated) {
        return <Navigate to={"/"} />
    }

    useEffect(() => {
        if (message) {
            navigateTo(`/otp-verification/${email}`)
        }
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

    return (
        <>
            <div className="flex flex-col justify-center md:flex-row h-screen">
                {/* LEFT SIDE */}
                <motion.div
                    className="hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center justify-center p-8 rounded-tr-[80px] rounded-br-[80px]"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={rightVariants}
                >
                    <div className="text-center h-[376px]">
                        <div className="flex justify-center mb-12">
                            <img src='https://www.logomaker.com/api/main/imageop/zjHl2lgeccIQlz7qJEHyxj...tyq...e+1RCjRu...wjkZfzJLpl4...yHVC3aci4P85Px5x9FMJ30tYLZV...12R+UocchRtg9jqLO49WWXxrzFkRVetRQi54L3uQQKrY9l84yaU085VN5wybf3XnTXLUfNc7G5+U4qZ+Fctw2CuMCnZtry4kZP0XdNvOC4ckhJejQ...ZQ2GjCHM1WOOi8DYPVR24Y224PYPRYtddLVMNoUmVyVVfQjrVPCppbGYlDSEJ6rBoYJJEnJW018uh3ttiBD...hlu3gIj1++xtsqYFXLxIlzVbyZd+K9I5EuKWK3G7OerCk1+Zlj2HbIWvu5yQ3t62hAfkGVPaY+PARH+CIk0Vw7YeLOJgV7KX+Pbw8Chb1DgBAj2Lw5c69yMidjYs+Hh1RcXpnNeHA6jmFlzJoI85zvyfVITXhvgIr3QoNhT6s3I06Hi2Jk91U7BYyVeuFpMWs92RvdchUcjslTHRR0NP9kbOEeJLiEBeMFCquplkIdVjAl2nuvmLlTufRXg20WiVPjEnXaGr1sYiU3j7dR02+g0WiRKNfZzjVotINA8+7...uFkZa4uWnkGZiexZM6TEcB8m2fuvfv+WubZl1Q1EUeBghnmXeZ8yVgM7anJF0LWwAkzukg4kkp+XqfQ...j6B3g9muo6MWz0jm37dki+IQvIXsZvRg...sYX0yt2vgM6t...dC4Q8Xfpkf7KvLWayqIw8koqMgTUfX1IBhhJGgtGVxx2RTOuVx5+9T5JTAr0SzwxinlILEATrc...pkG9n8HiItON2vSc9vG...IT7bIr9IokL0YwHXmphl...amfwzBYMxYoCAWdGT4ZS0R...XWRC6z6xRMLExdRFrKwo4NCLyUsQzTjz8dVPeCfUSccgvxgulUz3EQeArTPM+B79WRyDXIyg...zPzgOxw5GHF+gG9JpnG6vPQ9iEkyYyEeFBG2ARJQUZvtY1...50k73nup3Vo7B0BzjKfxGnRW9ypUIlDXveWenigpNxcFfTfOG0IGHVsfmPpgnVcCP5PwRzNwS...HgmEDrod0gZhAi7C+515sG2Fzk...zSjHqCaI1fhcdc963bptVBdSkRKn8bj...TvUQvdMSg3kcPlmt8lTZGZg0EHPCO4LL8l8im7x...HqfEjSnt2gGwuHZ+lbnouJ1o2uOOHYs1EobYCD43FzZ3WU8B1KwGl0wTiASQj1yZGwMaBT1QC...YwBhZdxa44quMljRKLcnZI8dHx0k1xuQv8R...S9ZXpZ9N5uS6GUIi549zJIDq5CPtBnT0c+NjDPa86Tcl5+OHSS8SNGaFALiWrU7BFaf7vyDUV9wngobCdwd3...giKIim8tX2yQfvHlhpmp8FRC9gXhCshU+cL1P4TsrVgWGDQVKKaYFAqdQS5ytcCJ60s4X5jfgvG6w+BPqIl24tsixYIJ4...5XTlxC3PrieT3hi2vnpdx+s7C0flKQGUW0vQwbx99xt1OxL6RnKRqQJMccYLcYTm4vDsXdG9lQGr3pLyeZGi9VdfOmPSSZuj+x44JqowH1IsEx6dvCkM9qmLt1ZylYh3XW0aETJxRxTOu4u4Y3y1umFOpPfa9MvOk5TY3E5Pdqv8EJ5GUc4LtLaclCw+TASlWcCCZUp7tRTFqAHnMNkvOSV9MxTHP+X0JXNWW9tFW1vwTp...Q9RMNOvWHr21LiyYBMuNjmu7xmkmroyuXyMuCkr5cursWRbfI+5MlizSDwUU63RADIW5cfMbLu3SwkMsVkBg5jMLBDnZ6kQ9FOzrODEhnvx...twrV8UpaaFA9oLZ79QmZp3E8s2QZ...5kuefFXBqdryM...1La+SNTDVDLMrrUPoWmxhOdPrhwkqoP0zV2EKIHvdcYMN9Jd...C5Q87+JZ9BMWremyrVlQHOMkXK6t9rXH4wDUWFsQkaN3gVVy1wLUxNaMtvIN5wa4n0MgoL3TILRKSxjiF6pGROwC6QsefWz...LmMrCEy9W2gDp0iKXxX2hzFbdOeAZOHjR4BlkO6qIy7o8reUV8J3u...ubF2++g+ZNjyIfiGCVytkVG9pyLY7Zk89kMgEEjdptTyZVT7pnq6rIUXTqwB+9AGOxqlIQv5eWmOpUni5OdSODqnCQXIFyblX9bB+2my7sBTVroQwwbp57XT1CPCOsc3kzzrajY+DogvXNLMF368KNDrLlhBGpGlo45DaTmAo+WSyCfLc4srCB9z+BDHEr4gdzYhrYcxURtXLrQOL6isiblpgArJviEUBsJj0Uh9eTVevpKHLZ0zjhMCohxtaQ3p...85DT58iO7QaRAcE+Go4kScRsoy1aAvLw1SUsLVfAhFO' alt="logo" className="mb-12 h-44 w-auto" />
                        </div>
                        <p className="text-gray-300 mb-12">Already have Account? Sign in now.</p>
                    </div>
                    <Link
                        to={"/login"}
                        className="border-2 rounded-lg font-semibold border-white py-2 px-8 hover:bg-white hover:text-black transition"
                    >
                        SIGN IN
                    </Link>
                </motion.div>
                {/* RIGHT SIDE */}
                <motion.div
                    className="w-full md:w-1/2 flex items-center justify-center bg-white p-8"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={leftVariants}
                    >
                    <div className="w-full max-w-sm">
                        <div className="flex justify-center mb-5">
                        <div className="sm:flex-row items-center justify-center gap-5">
                            <h3 className="font-medium text-4xl overflow-hidden">Sign Up</h3>
                        </div>
                        </div>
                        <p className="text-gray-800 text-center mb-12">
                        Please provide your information to sign up.
                        </p>
                        <form onSubmit={handleRegister}>
                        {/* Role Selector */}
                        <div className="mb-2">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                            >
                                <option value="citizen">Citizen</option>
                                <option value="municipality_admin">Municipality Admin</option>
                            </select>
                        </div>
                        
                        <div className="mb-2">
                            <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={role === 'municipality_admin' ? "Admin Name" : "Full Name"}
                            className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                            />
                        </div>
                        
                        {/* Municipality Name Field - Only show for municipality admin */}
                        {role === 'municipality_admin' && (
                            <div className="mb-2">
                                <input
                                    type="text"
                                    value={municipalityName}
                                    onChange={(e) => setMunicipalityName(e.target.value)}
                                    placeholder="Municipality Name"
                                    className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                                />
                            </div>
                        )}
                        <div className="mb-2">
                            <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                            />
                        </div>
                        <div className="mb-2">
                            <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                            />
                        </div>

                        {/* Location Picker Field */}
                        <div className="mb-2">
                            <LocationPicker location={location} setLocation={setLocation} />
                        </div>

                        <div className="block md:hidden font-semibold mt-5">
                            <p>Already have an account?</p>
                            <Link to="/login" className="text-sm text-gray-500 hover:underline">
                            Sign In
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="border-2 mt-5 border-black w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition"
                        >
                            SIGN UP
                        </button>
                        </form>
                    </div>
                    </motion.div>

            </div>
        </>
    )
}

export default Register;

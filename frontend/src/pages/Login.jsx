import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { login, resetAuthSlice } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import {motion} from 'framer-motion'

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useDispatch();

   
 const {
        loading, error, message, user, isAuthenticated
    } = useSelector(state => state.auth);
    const handleLogin = (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('email', email);
        data.append('password', password);
        dispatch(login(data));
    }

    

    const navigateTo= useNavigate()


    useEffect(() => {
        if (message) {
            // toast.success(message);
            if (user?.role === 'Admin') {
                navigateTo("/admin/dashboard");
            } else if (user?.role === 'Municipality Admin') {
                navigateTo("/municipality");
            } else {
                navigateTo("/");
            }
        }
        if (error) {
            // toast.error(error);
            dispatch(resetAuthSlice());
        }

    }, [dispatch, isAuthenticated, error, loading, message, user, navigateTo])

    if (isAuthenticated) {
        // Redirect based on user role
        if (user?.role === 'Admin') {
            return <Navigate to="/admin/dashboard" />;
        } else if (user?.role === 'Municipality Admin') {
            return <Navigate to="/municipality" />;
        }
        return <Navigate to={"/"} />;
    }

    const leftVariants = {
        initial: { opacity: 0, x: "-50%" }, // Move out to left
        animate: { opacity: 1, x: "0%", transition: { duration: 0.5, ease: "easeInOut" } },
        exit: { opacity: 0, x: "50%", transition: { duration: 0.5, ease: "easeInOut" } } // Move out to right
    };
    
    const rightVariants = {
        initial: { opacity: 0, x: "50%" }, // Move out to right
        animate: { opacity: 1, x: "0%", transition: { duration: 0.5, ease: "easeInOut" } },
        exit: { opacity: 0, x: "-50%", transition: { duration: 0.5, ease: "easeInOut" } } // Move out to left
    };
    

    return (
        <>
            <div className="flex flex-col justify-center md:flex-row h-screen">
                {/* LEFT SIDE */}
                <motion.div
                    className="w-full md:w-1/2 flex items-center justify-center bg-white p-8"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={rightVariants}
                >
                    <div className="max-w-sm w-full">
                        <div className="flex justify-center mb-12">
                            <div className="rounded-md flex items-center justify-center">
                                {/* <img src='https://samarthanam.org/wp-content/uploads/2023/10/samarthanam-logo.jpg' alt="logo" className="h-24 w-auto" /> */}
                            </div>
                        </div>
                        <h1 className="text-4xl font-medium text-center mb-12 overflow-hidden">
                            Welcome Back !!
                        </h1>
                        <p className="text-gray-800 text-center mb-12">
                            Please enter your credentials to login
                        </p>
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                                />
                            </div>
                            <div className="mb-4">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                                />
                            </div>
                            <Link to={"/password/forgot"} className="font-semibold text-black mb-12">
                                Forgot Password?
                            </Link>
                            <div className="block md:hidden font-semibold mt-5">
                                <p>
                                    New to our platform?{" "}
                                    <Link to={"/register"} className="text-sm text-gray-500 hover:underline">
                                        Sign Up
                                    </Link>
                                </p>
                            </div>
                            <button
                                type="submit"
                                className="border-2 mt-5 border-black w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition"
                            >
                                SIGN IN
                            </button>
                            <button
                                type="button"
                                onClick={() => navigateTo("/admin/login")}
                                className="border-2 mt-3 border-black w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition"
                            >
                                ADMIN LOGIN
                            </button>
                        </form>
                    </div>
                </motion.div>
                {/* RIGHT SIDE */}
                <motion.div
                    className="hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center justify-center p-8 rounded-tl-[80px] rounded-bl-[80px]"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={leftVariants}
                >
                    <div className="text-center h-[400px]">
                        <div className="flex justify-center mb-12">
                            <img src='https://www.logomaker.com/api/main/imageop/zjHl2lgeccIQlz7qJEHyxj...tyq...e+1RCjRu...wjkZfzJLpl4...yHVC3aci4P85Px5x9FMJ30tYLZV...12R+UocchRtg9jqLO49WWXxrzFkRVetRQi54L3uQQKrY9l84yaU085VN5wybf3XnTXLUfNc7G5+U4qZ+Fctw2CuMCnZtry4kZP0XdNvOC4ckhJejQ...ZQ2GjCHM1WOOi8DYPVR24Y224PYPRYtddLVMNoUmVyVVfQjrVPCppbGYlDSEJ6rBoYJJEnJW018uh3ttiBD...hlu3gIj1++xtsqYFXLxIlzVbyZd+K9I5EuKWK3G7OerCk1+Zlj2HbIWvu5yQ3t62hAfkGVPaY+PARH+CIk0Vw7YeLOJgV7KX+Pbw8Chb1DgBAj2Lw5c69yMidjYs+Hh1RcXpnNeHA6jmFlzJoI85zvyfVITXhvgIr3QoNhT6s3I06Hi2Jk91U7BYyVeuFpMWs92RvdchUcjslTHRR0NP9kbOEeJLiEBeMFCquplkIdVjAl2nuvmLlTufRXg20WiVPjEnXaGr1sYiU3j7dR02+g0WiRKNfZzjVotINA8+7...uFkZa4uWnkGZiexZM6TEcB8m2fuvfv+WubZl1Q1EUeBghnmXeZ8yVgM7anJF0LWwAkzukg4kkp+XqfQ...j6B3g9muo6MWz0jm37dki+IQvIXsZvRg...sYX0yt2vgM6t...dC4Q8Xfpkf7KvLWayqIw8koqMgTUfX1IBhhJGgtGVxx2RTOuVx5+9T5JTAr0SzwxinlILEATrc...pkG9n8HiItON2vSc9vG...IT7bIr9IokL0YwHXmphl...amfwzBYMxYoCAWdGT4ZS0R...XWRC6z6xRMLExdRFrKwo4NCLyUsQzTjz8dVPeCfUSccgvxgulUz3EQeArTPM+B79WRyDXIyg...zPzgOxw5GHF+gG9JpnG6vPQ9iEkyYyEeFBG2ARJQUZvtY1...50k73nup3Vo7B0BzjKfxGnRW9ypUIlDXveWenigpNxcFfTfOG0IGHVsfmPpgnVcCP5PwRzNwS...HgmEDrod0gZhAi7C+515sG2Fzk...zSjHqCaI1fhcdc963bptVBdSkRKn8bj...TvUQvdMSg3kcPlmt8lTZGZg0EHPCO4LL8l8im7x...HqfEjSnt2gGwuHZ+lbnouJ1o2uOOHYs1EobYCD43FzZ3WU8B1KwGl0wTiASQj1yZGwMaBT1QC...YwBhZdxa44quMljRKLcnZI8dHx0k1xuQv8R...S9ZXpZ9N5uS6GUIi549zJIDq5CPtBnT0c+NjDPa86Tcl5+OHSS8SNGaFALiWrU7BFaf7vyDUV9wngobCdwd3...giKIim8tX2yQfvHlhpmp8FRC9gXhCshU+cL1P4TsrVgWGDQVKKaYFAqdQS5ytcCJ60s4X5jfgvG6w+BPqIl24tsixYIJ4...5XTlxC3PrieT3hi2vnpdx+s7C0flKQGUW0vQwbx99xt1OxL6RnKRqQJMccYLcYTm4vDsXdG9lQGr3pLyeZGi9VdfOmPSSZuj+x44JqowH1IsEx6dvCkM9qmLt1ZylYh3XW0aETJxRxTOu4u4Y3y1umFOpPfa9MvOk5TY3E5Pdqv8EJ5GUc4LtLaclCw+TASlWcCCZUp7tRTFqAHnMNkvOSV9MxTHP+X0JXNWW9tFW1vwTp...Q9RMNOvWHr21LiyYBMuNjmu7xmkmroyuXyMuCkr5cursWRbfI+5MlizSDwUU63RADIW5cfMbLu3SwkMsVkBg5jMLBDnZ6kQ9FOzrODEhnvx...twrV8UpaaFA9oLZ79QmZp3E8s2QZ...5kuefFXBqdryM...1La+SNTDVDLMrrUPoWmxhOdPrhwkqoP0zV2EKIHvdcYMN9Jd...C5Q87+JZ9BMWremyrVlQHOMkXK6t9rXH4wDUWFsQkaN3gVVy1wLUxNaMtvIN5wa4n0MgoL3TILRKSxjiF6pGROwC6QsefWz...LmMrCEy9W2gDp0iKXxX2hzFbdOeAZOHjR4BlkO6qIy7o8reUV8J3u...ubF2++g+ZNjyIfiGCVytkVG9pyLY7Zk89kMgEEjdptTyZVT7pnq6rIUXTqwB+9AGOxqlIQv5eWmOpUni5OdSODqnCQXIFyblX9bB+2my7sBTVroQwwbp57XT1CPCOsc3kzzrajY+DogvXNLMF368KNDrLlhBGpGlo45DaTmAo+WSyCfLc4srCB9z+BDHEr4gdzYhrYcxURtXLrQOL6isiblpgArJviEUBsJj0Uh9eTVevpKHLZ0zjhMCohxtaQ3p...85DT58iO7QaRAcE+Go4kScRsoy1aAvLw1SUsLVfAhFO' alt="logo" className="mb-12 h-44 w-auto" />
                        </div>
                        <p className="text-gray-300 mb-12">New to our platform? Sign up now.</p>
                        <Link
                            to={"/register"}
                            className="border-2 mt-5 border-white px-8 w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-black hover:text-white transition"
                        >
                            SIGN UP
                        </Link>
                        
                    </div>
                </motion.div>
            </div>
        </>
    )
}

export default Login

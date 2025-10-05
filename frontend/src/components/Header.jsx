import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { FaBell, FaTimes, FaBars } from "react-icons/fa";

const Header = ({ notifications }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuModalOpen, setMenuModalOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  // Function to check if link is active
  const isActive = (path) => location.pathname === path;

  // Define navigation links based on authentication status
  const commonLinks = [
    { path: "/about", label: "About Us" },
    { path: "/gallery", label: "Gallery" },
    { path: "/donate", label: "Donate" },
  ];

  const authLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/issues", label: "Issues" },
  ];
  
  const municipalityLinks = [
    { path: "/municipality", label: "Dashboard" },
  ];
  
  const staffLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/issues", label: "Manage Issues" },
  ];
  
  const adminLinks = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/requests", label: "Request" },
  ];
  const messageLinks = [
    { path: "/organiser/messages", label: "Messages" },
  ];

  return (
  <>
    <header className="bg-gradient-to-r from-purple-800 via-purple-700 to-pink-700 shadow-2xl py-4 px-6 flex justify-between items-center relative border-b-4 border-pink-400">
      {/* Logo */}
      <Link to="/">
        <img
          src="https://www.logomaker.com/api/main/imageop/zjHl2lgeccIQlz7qJEHyxj...tyq...e+1RCjRu...wjkZfzJLpl4...yHVC3aci4P85Px5x9FMJ30tYLZV...12R+UocchRtg9jqLO49WWXxrzFkRVetRQi54L3uQQKrY9l84yaU085VN5wybf3XnTXLUfNc7G5+U4qZ+Fctw2CuMCnZtry4kZP0XdNvOC4ckhJejQ...ZQ2GjCHM1WOOi8DYPVR24Y224PYPRYtddLVMNoUmVyVVfQjrVPCppbGYlDSEJ6rBoYJJEnJW018uh3ttiBD...hlu3gIj1++xtsqYFXLxIlzVbyZd+K9I5EuKWK3G7OerCk1+Zlj2HbIWvu5yQ3t62hAfkGVPaY+PARH+CIk0Vw7YeLOJgV7KX+Pbw8Chb1DgBAj2Lw5c69yMidjYs+Hh1RcXpnNeHA6jmFlzJoI85zvyfVITXhvgIr3QoNhT6s3I06Hi2Jk91U7BYyVeuFpMWs92RvdchUcjslTHRR0NP9kbOEeJLiEBeMFCquplkIdVjAl2nuvmLlTufRXg20WiVPjEnXaGr1sYiU3j7dR02+g0WiRKNfZzjVotINA8+7...uFkZa4uWnkGZiexZM6TEcB8m2fuvfv+WubZl1Q1EUeBghnmXeZ8yVgM7anJF0LWwAkzukg4kkp+XqfQ...j6B3g9muo6MWz0jm37dki+IQvIXsZvRg...sYX0yt2vgM6t...dC4Q8Xfpkf7KvLWayqIw8koqMgTUfX1IBhhJGgtGVxx2RTOuVx5+9T5JTAr0SzwxinlILEATrc...pkG9n8HiItON2vSc9vG...IT7bIr9IokL0YwHXmphl...amfwzBYMxYoCAWdGT4ZS0R...XWRC6z6xRMLExdRFrKwo4NCLyUsQzTjz8dVPeCfUSccgvxgulUz3EQeArTPM+B79WRyDXIyg...zPzgOxw5GHF+gG9JpnG6vPQ9iEkyYyEeFBG2ARJQUZvtY1...50k73nup3Vo7B0BzjKfxGnRW9ypUIlDXveWenigpNxcFfTfOG0IGHVsfmPpgnVcCP5PwRzNwS...HgmEDrod0gZhAi7C+515sG2Fzk...zSjHqCaI1fhcdc963bptVBdSkRKn8bj...TvUQvdMSg3kcPlmt8lTZGZg0EHPCO4LL8l8im7x...HqfEjSnt2gGwuHZ+lbnouJ1o2uOOHYs1EobYCD43FzZ3WU8B1KwGl0wTiASQj1yZGwMaBT1QC...YwBhZdxa44quMljRKLcnZI8dHx0k1xuQv8R...S9ZXpZ9N5uS6GUIi549zJIDq5CPtBnT0c+NjDPa86Tcl5+OHSS8SNGaFALiWrU7BFaf7vyDUV9wngobCdwd3...giKIim8tX2yQfvHlhpmp8FRC9gXhCshU+cL1P4TsrVgWGDQVKKaYFAqdQS5ytcCJ60s4X5jfgvG6w+BPqIl24tsixYIJ4...5XTlxC3PrieT3hi2vnpdx+s7C0flKQGUW0vQwbx99xt1OxL6RnKRqQJMccYLcYTm4vDsXdG9lQGr7pLyeZGi9VdfOmPSSZuj+x44JqowH1IsEx6dvCkM9qmLt1ZylYh3XW0aETJxRxTOu4u4Y3y1umFOpPfa9MvOk5TY3E5Pdqv8EJ5GUc4LtLaclCw+TASlWcCCZUp7tRTFqAHnMNkvOSV9MxTHP+X0JXNWW9tFW1vwTp...Q9RMNOvWHr21LiyYBMuNjmu7xmkmroyuXyMuCkr5cursWRbfI+5MlizSDwUU63RADIW5cfMbLu3SwkMsVkBg5jMLBDnZ6kQ9FOzrODEhnvx...twrV8UpaaFA9oLZ79QmZp3E8s2QZ...5kuefFXBrdryM...1La+SNTDVDLMrrUPoWmxhOdPrhwkqoP0zV2EKIHvdcYMN9Jd...C5Q87+JZ9BMWremyrVlQHOMkXK6t9rXH4wDUWFsQkaN3gVVy1wLUxNaMtvIN5wa4n0MgoL3TILRKSxjiF6pGROwC6QsefWz...LmMrCEy9W2gDp0iKXxX2hzFbdOeAZOHjR4BlkO6qIy7o8reUV8J3u...ubF2++g+ZNjyIfiGCVytkVG9pyLY7Zk89kMgEEjdptTyZVT7pnq6rIUXTqwB+9AGOxqlIQv5eWmOpUni5OdSODqnCQXIFyblX9bB+2my7sBTVroQwwbp57XT1CPCOsc3kzzrajY+DogvXNLMF368KNDrLlhBGpGlo45DaTmAo+WSyCfLc4srCB9z+BDHEr4gdzYhrYcxURtXLrQOL6isiblpgArJviEUBsJj0Uh9eTVevpKHLZ0zjhMCohxtaQ3p...86DT58iO7QaRAcE+Go4kScRsoy1aAvLw1SUsLVfAhFO"
          alt="FixCus Logo"
          className="h-10 w-auto"
        />
      </Link>

      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex space-x-6 text-pink-100 font-bold">
        {commonLinks.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${
              isActive(item.path)
                ? "text-yellow-300 font-black border-b-2 border-yellow-300"
                : "hover:text-white transition duration-200"
            }`}
          >
            {item.label}
          </Link>
        ))}
        {isAuthenticated && user?.role === "Municipality Admin" &&
          municipalityLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${
                isActive(item.path)
                  ? "text-yellow-300 font-black border-b-2 border-yellow-300"
                  : "hover:text-white transition duration-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        {isAuthenticated && user?.role === "Municipality Staff" &&
          staffLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${
                isActive(item.path)
                  ? "text-yellow-300 font-black border-b-2 border-yellow-300"
                  : "hover:text-white transition duration-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        {isAuthenticated && user?.role === "Admin" &&
          adminLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${
                isActive(item.path)
                  ? "text-yellow-300 font-black border-b-2 border-yellow-300"
                  : "hover:text-white transition duration-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        {isAuthenticated && user?.role === "User" &&
          authLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${
                isActive(item.path)
                  ? "text-yellow-300 font-black border-b-2 border-yellow-300"
                  : "hover:text-white transition duration-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        {isAuthenticated &&
          user.role === "Event Organiser" &&
          messageLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${
                isActive(item.path)
                  ? "text-yellow-300 font-black border-b-2 border-yellow-300"
                  : "hover:text-white transition duration-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
      </nav>

      {/* Right Side: Buttons + Bell Icon + Hamburger */}
      <div className="flex items-center gap-4">
        {/* Account/Login Buttons */}
        {isAuthenticated ? (
          <div className="hidden md:flex items-center gap-2">
            {/* <button
              onClick={() => navigate("/change-details")}
              className="bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-green-600 border-2 border-pink-300 transform hover:scale-105 transition duration-200"
            >
              👤 Account
            </button> */}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-red-600 border-2 border-pink-300 cursor-pointer transform transition duration-200"
            >
              🚪 Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="hidden md:flex bg-pink-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-pink-600 border-2 border-yellow-300 transform cursor-pointer transition duration-200"
          >
            🎪 Sign In
          </Link>
        )}

        {/* Notifications */}
        {isAuthenticated && (
          <Link to="/notification" className="relative flex items-center">
            <FaBell
              size={24}
              className="text-yellow-300 hover:text-yellow-100 transition duration-200"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-0.5 text-white text-xs font-black">
                {unreadCount}
              </span>
            )}
          </Link>

        )}

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-pink-100 text-2xl hover:text-white transition duration-200"
          onClick={() => setMenuModalOpen(true)}
        >
          <FaBars />
        </button>
      </div>
    </header>

    {/* Mobile Menu Modal */}
    {menuModalOpen && (
      <div
        className="fixed inset-0 bg-purple-900 bg-opacity-95 flex items-center justify-center z-50"
        onClick={() => setMenuModalOpen(false)}
      >
        <div
          className="bg-gradient-to-br from-pink-200 to-pink-300 w-80 p-6 rounded-2xl shadow-2xl relative border-4 border-purple-600"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-2 right-3 text-purple-900 hover:text-purple-700 text-3xl font-black"
            onClick={() => setMenuModalOpen(false)}
          >
            <FaTimes />
          </button>

          {/* Mobile Links */}
          <nav className="flex flex-col space-y-4 text-purple-900 font-bold">
            {commonLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="hover:text-purple-700 transition duration-200 text-lg"
                onClick={() => setMenuModalOpen(false)}
              >
                🎪 {item.label}
              </Link>
            ))}
            {isAuthenticated && user?.role === "Municipality Admin" &&
              municipalityLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="hover:text-purple-700 transition duration-200 text-lg"
                  onClick={() => setMenuModalOpen(false)}
                >
                  🎪 {item.label}
                </Link>
              ))}
            {isAuthenticated && user?.role === "Municipality Staff" &&
              staffLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="hover:text-purple-700 transition duration-200 text-lg"
                  onClick={() => setMenuModalOpen(false)}
                >
                  🎪 {item.label}
                </Link>
              ))}
            {isAuthenticated && user?.role === "Admin" &&
              adminLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="hover:text-purple-700 transition duration-200 text-lg"
                  onClick={() => setMenuModalOpen(false)}
                >
                  🎪 {item.label}
                </Link>
              ))}
            {isAuthenticated && user?.role === "User" &&
              authLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="hover:text-purple-700 transition duration-200 text-lg"
                  onClick={() => setMenuModalOpen(false)}
                >
                  🎪 {item.label}
                </Link>
              ))}
            {isAuthenticated &&
              user.role === "Event Organiser" &&
              messageLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="hover:text-purple-700 transition duration-200 text-lg"
                  onClick={() => setMenuModalOpen(false)}
                >
                  🎪 {item.label}
                </Link>
              ))}

            {/* Account / Logout / Sign In buttons in Mobile Menu */}
            {isAuthenticated ? (
              <div className="flex flex-col space-y-2 mt-4">
                <button
                  onClick={() => {
                    navigate("/change-details");
                    setMenuModalOpen(false);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-green-600 border-2 border-purple-500 transform hover:scale-105 transition duration-200"
                >
                  👤 Account
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuModalOpen(false);
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-red-600 border-2 border-purple-500 transform hover:scale-105 transition duration-200"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuModalOpen(false)}
                className="mt-4 bg-pink-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-pink-600 border-2 border-purple-500 block text-center transform hover:scale-105 transition duration-200"
              >
                🎪 Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    )}
  </>
);

  
};

export default Header;
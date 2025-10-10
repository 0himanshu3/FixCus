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
    navigate("/");
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const isActive = (path) => location.pathname === path;

  // Navigation links
  const commonLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About Us" },
  ];

  const authLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/issues", label: "Issues" },
  ];

  const municipalityLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/issues", label: "Issues", requiresApproval: true }, // only show if accountApproved
  ];

  const staffLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/issues", label: "Issues" },
  ];

  const adminLinks = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/requests", label: "Requests" },
    { path: "/admin/issues", label: "Issues" },
  ];

  const messageLinks = [
    { path: "/organiser/messages", label: "Messages" },
  ];

  return (
    <>
      <header className="bg-gradient-to-r from-purple-800 via-purple-700 to-pink-700 shadow-2xl py-4 px-4 sm:px-6 flex justify-between items-center sticky top-0 z-40 border-b-4 border-pink-400 w-full">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="logo-fixcus.png" alt="FixCus Logo" className="h-10 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 text-pink-100 font-bold">
          {commonLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${isActive(item.path)
                  ? "text-yellow-300 font-black border-b-2 border-yellow-300"
                  : "hover:text-white transition duration-200"
                }`}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated && user?.role === "Municipality Admin" &&
            municipalityLinks
              .filter(link => !link.requiresApproval || user.accountApproved)
              .map((item) => (
                <Link key={item.path} to={item.path} className={`${isActive(item.path) ? "text-yellow-300 font-black border-b-2 border-yellow-300" : "hover:text-white transition duration-200"}`}>
                  {item.label}
                </Link>
              ))}
          {isAuthenticated && user?.role === "Municipality Staff" &&
            staffLinks.map((item) => (
              <Link key={item.path} to={item.path} className={`${isActive(item.path) ? "text-yellow-300 font-black border-b-2 border-yellow-300" : "hover:text-white transition duration-200"}`}>
                {item.label}
              </Link>
            ))}
          {isAuthenticated && user?.role === "Admin" &&
            adminLinks.map((item) => (
              <Link key={item.path} to={item.path} className={`${isActive(item.path) ? "text-yellow-300 font-black border-b-2 border-yellow-300" : "hover:text-white transition duration-200"}`}>
                {item.label}
              </Link>
            ))}
          {isAuthenticated && user?.role === "User" &&
            authLinks.map((item) => (
              <Link key={item.path} to={item.path} className={`${isActive(item.path) ? "text-yellow-300 font-black border-b-2 border-yellow-300" : "hover:text-white transition duration-200"}`}>
                {item.label}
              </Link>
            ))}
          {isAuthenticated && user?.role === "Event Organiser" &&
            messageLinks.map((item) => (
              <Link key={item.path} to={item.path} className={`${isActive(item.path) ? "text-yellow-300 font-black border-b-2 border-yellow-300" : "hover:text-white transition duration-200"}`}>
                {item.label}
              </Link>
            ))}
        </nav>

        {/* Right side: Account / Logout / Notifications / Hamburger */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-2">
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

          {isAuthenticated && (
            <Link to="/notification" className="relative flex items-center">
              <FaBell size={24} className="text-yellow-300 hover:text-yellow-100 transition duration-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-0.5 text-white text-xs font-black">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          <button
            className="md:hidden text-pink-100 text-2xl hover:text-white transition duration-200 z-50"
            onClick={() => setMenuModalOpen(!menuModalOpen)}
          >
            {menuModalOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>

      {/* --- REFACTORED MOBILE MENU PANEL --- */}

      {/* 1. Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out
          ${menuModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMenuModalOpen(false)}
      ></div>

      {/* 2. Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-purple-900 to-purple-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
          ${menuModalOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="p-6 border-b border-purple-700">
            <h2 className="text-xl font-black text-pink-200">Menu</h2>
            {isAuthenticated && <p className="text-sm text-purple-300">Welcome!</p>}
          </div>

          {/* Navigation Links */}
          <nav className="flex-grow p-6 flex flex-col gap-y-4 overflow-y-auto">
            {commonLinks.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setMenuModalOpen(false)} className={`text-lg font-bold transition duration-200 p-2 rounded-md ${isActive(item.path) ? "text-purple-900 bg-yellow-300" : "text-pink-100 hover:bg-purple-700 hover:text-white"}`}>
                {item.label}
              </Link>
            ))}
            {isAuthenticated && user?.role === "Municipality Admin" &&
              municipalityLinks.filter(link => !link.requiresApproval || user.accountApproved).map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMenuModalOpen(false)} className={`text-lg font-bold transition duration-200 p-2 rounded-md ${isActive(item.path) ? "text-purple-900 bg-yellow-300" : "text-pink-100 hover:bg-purple-700 hover:text-white"}`}>
                  {item.label}
                </Link>
              ))}
            {isAuthenticated && user?.role === "Municipality Staff" &&
              staffLinks.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMenuModalOpen(false)} className={`text-lg font-bold transition duration-200 p-2 rounded-md ${isActive(item.path) ? "text-purple-900 bg-yellow-300" : "text-pink-100 hover:bg-purple-700 hover:text-white"}`}>
                  {item.label}
                </Link>
              ))}
            {isAuthenticated && user?.role === "Admin" &&
              adminLinks.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMenuModalOpen(false)} className={`text-lg font-bold transition duration-200 p-2 rounded-md ${isActive(item.path) ? "text-purple-900 bg-yellow-300" : "text-pink-100 hover:bg-purple-700 hover:text-white"}`}>
                  {item.label}
                </Link>
              ))}
            {isAuthenticated && user?.role === "User" &&
              authLinks.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMenuModalOpen(false)} className={`text-lg font-bold transition duration-200 p-2 rounded-md ${isActive(item.path) ? "text-purple-900 bg-yellow-300" : "text-pink-100 hover:bg-purple-700 hover:text-white"}`}>
                  {item.label}
                </Link>
              ))}
            {isAuthenticated && user?.role === "Event Organiser" &&
              messageLinks.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMenuModalOpen(false)} className={`text-lg font-bold transition duration-200 p-2 rounded-md ${isActive(item.path) ? "text-purple-900 bg-yellow-300" : "text-pink-100 hover:bg-purple-700 hover:text-white"}`}>
                  {item.label}
                </Link>
              ))}
          </nav>

          {/* Menu Footer (Action Buttons) */}
          <div className="p-6 border-t border-purple-700">
            {isAuthenticated ? (
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => { navigate("/change-details"); setMenuModalOpen(false); }}
                  className="w-full text-center bg-green-500 text-white px-4 py-3 rounded-full font-bold shadow-lg hover:bg-green-600 border-2 border-purple-500 transform hover:scale-105 transition duration-200"
                >
                  👤 Account
                </button>
                <button
                  onClick={() => { handleLogout(); setMenuModalOpen(false); }}
                  className="w-full text-center bg-red-500 text-white px-4 py-3 rounded-full font-bold shadow-lg hover:bg-red-600 border-2 border-purple-500 transform hover:scale-105 transition duration-200"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuModalOpen(false)}
                className="w-full block text-center bg-pink-500 text-white px-4 py-3 rounded-full font-bold shadow-lg hover:bg-pink-600 border-2 border-purple-500 transform hover:scale-105 transition duration-200"
              >
                🎪 Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;

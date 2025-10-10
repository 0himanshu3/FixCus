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
  console.log(user);
  

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
      <header className="bg-gradient-to-r from-purple-800 via-purple-700 to-pink-700 shadow-2xl py-4 px-6 flex justify-between items-center relative border-b-4 border-pink-400">
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

          {/* Municipality Admin links (filtered by accountApproved) */}
          {isAuthenticated && user?.role === "Municipality Admin" &&
            municipalityLinks
              .filter(link => !link.requiresApproval || user.accountApproved)
              .map((item) => (
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
              ))
          }

          {/* Staff links */}
          {isAuthenticated && user?.role === "Municipality Staff" &&
            staffLinks.map((item) => (
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
            ))
          }

          {/* Admin links */}
          {isAuthenticated && user?.role === "Admin" &&
            adminLinks.map((item) => (
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
            ))
          }

          {/* Regular User links */}
          {isAuthenticated && user?.role === "User" &&
            authLinks.map((item) => (
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
            ))
          }

          {/* Event Organiser links */}
          {isAuthenticated && user?.role === "Event Organiser" &&
            messageLinks.map((item) => (
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
            ))
          }
        </nav>

        {/* Right side: Account / Logout / Notifications / Hamburger */}
        <div className="flex items-center gap-4">
          {isAuthenticated  ? (
            <div className="hidden md:flex items-center gap-2">
              {user?.role === "User" && (
              <button
                onClick={() => {
                  navigate("/change-details");
                  setMenuModalOpen(false);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-green-600 border-2 border-purple-500 transform hover:scale-105 transition duration-200"
              >
                👤 Account
              </button>
              )}
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

              {/* Municipality Admin (filtered by accountApproved) */}
              {isAuthenticated && user?.role === "Municipality Admin" &&
                municipalityLinks
                  .filter(link => !link.requiresApproval || user.accountApproved)
                  .map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="hover:text-purple-700 transition duration-200 text-lg"
                      onClick={() => setMenuModalOpen(false)}
                    >
                      🎪 {item.label}
                    </Link>
                  ))
              }

              {/* Staff */}
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
                ))
              }

              {/* Admin */}
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
                ))
              }

              {/* User */}
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
                ))
              }

              {/* Event Organiser */}
              {isAuthenticated && user?.role === "Event Organiser" &&
                messageLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="hover:text-purple-700 transition duration-200 text-lg"
                    onClick={() => setMenuModalOpen(false)}
                  >
                    🎪 {item.label}
                  </Link>
                ))
              }

              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2">
                  {user?.role === "User" && (
                    <button
                      onClick={() => {
                        navigate("/change-details");
                        setMenuModalOpen(false);
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-green-600 border-2 border-purple-500 transform hover:scale-105 transition duration-200"
                    >
                      👤 Account
                    </button>
                  )}
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

            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;

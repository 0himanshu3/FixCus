import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import InteractiveTimeline from "../components/HomeTimeline";

const Landing = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  // Determine actions based on user role
  let mainAction = null;
  let secondaryAction = null;

  if (!user) {
    // Not logged in
    mainAction = { label: "📝 Sign Up to Get Started", onClick: () => navigate("/register") };
    secondaryAction = { label: "🔑 Log In", onClick: () => navigate("/login") };
  } else {
    // Logged in
    switch (user.role) {
      case "User":
      case "Municipality Staff":
        mainAction = { label: "🚀 Create an Issue", onClick: () => navigate("/create") };
        secondaryAction = { label: "🌍 Explore Issues", onClick: () => navigate("/issues") };
        break;
      case "Municipality Admin":
        mainAction = { label: "🌍 Explore Issues", onClick: () => navigate("/issues") };
        secondaryAction = null;
        break;
      case "Admin":
        mainAction = { label: "📊 Admin Dashboard", onClick: () => navigate("/admin/dashboard") };
        secondaryAction = null;
        break;
      default:
        mainAction = { label: "🌍 Explore Issues", onClick: () => navigate("/issues") };
        secondaryAction = null;
        break;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <section className="flex-grow flex flex-col justify-center items-center text-center px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight text-pink-200 drop-shadow-lg leading-tight"
        >
          FixCus: Empowering Citizens to Build Better Communities 🌆
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl text-pink-100 font-medium px-2"
        >
          Report, track, and resolve public issues in your area. Together, we can make our neighborhoods cleaner, safer, and stronger — one report at a time.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-6 sm:mt-8 md:mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 w-full max-w-2xl px-4"
        >
          {mainAction && (
            <button
              onClick={mainAction.onClick}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-pink-500 hover:bg-pink-600 rounded-full font-bold text-sm sm:text-base md:text-lg border-4 border-purple-300 shadow-lg transform hover:scale-105 transition-all touch-friendly"
            >
              {mainAction.label}
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-purple-700 hover:bg-purple-800 rounded-full font-bold text-sm sm:text-base md:text-lg border-4 border-pink-300 shadow-lg transform hover:scale-105 transition-all touch-friendly"
            >
              {secondaryAction.label}
            </button>
          )}
        </motion.div>
      </section>

      {/* Highlights Section */}
      <section className="bg-white text-purple-900 py-8 sm:py-12 md:py-16 px-4 sm:px-6 border-t-8 border-pink-500 rounded-t-3xl shadow-inner overflow-x-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 text-center">
          <div className="p-4 sm:p-6 bg-pink-100 rounded-xl border-4 border-purple-400 shadow-lg">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-purple-800 mb-2 sm:mb-3">📢 Report</h3>
            <p className="text-sm sm:text-base md:text-lg font-medium">
              Raise issues like potholes, garbage, or streetlight failures and get them to the right authority.
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-pink-100 rounded-xl border-4 border-purple-400 shadow-lg">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-purple-800 mb-2 sm:mb-3">📈 Track</h3>
            <p className="text-sm sm:text-base md:text-lg font-medium">
              Watch real-time progress through interactive timelines and updates from municipal staff.
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-pink-100 rounded-xl border-4 border-purple-400 shadow-lg sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-purple-800 mb-2 sm:mb-3">🤝 Collaborate</h3>
            <p className="text-sm sm:text-base md:text-lg font-medium">
              Join hands with your neighbors — upvote and comment on issues that matter to your community.
            </p>
          </div>
        </div>
      </section>

      {/* <ProcessTimeline /> */}
      <InteractiveTimeline />

      {/* CTA Section */}
      <section className="text-center py-8 sm:py-12 md:py-16 bg-gradient-to-r from-pink-600 to-purple-700 border-t-8 border-pink-300 overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-3 sm:mb-4">
            Be the Change. Start Today ✨
          </h2>
          <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto text-pink-100">
            FixCus gives you the power to make a difference. Let's turn local issues into collective solutions.
          </p>

          <button
            onClick={mainAction.onClick}
            className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-white text-purple-800 font-black text-sm sm:text-base md:text-lg rounded-full shadow-2xl hover:bg-pink-100 transform hover:scale-105 transition-all border-4 border-purple-400 touch-friendly"
          >
            {mainAction.label}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Landing;

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "./redux/slices/authSlice";
import { io } from "socket.io-client";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import OTP from "./pages/OTP";
import ResetPassword from "./pages/ResetPassword";
import MainLayout from "./components/MainLayout";
import About from "./pages/About";
import Gallery from "./pages/Gallery";
import Donate from "./pages/Donate";
import Issues from "./components/Issues";
import IssuesStaff from "./components/IssuesStaff";
import IssueDetails from "./components/IssueDetails";
import IssueDetailsStaff from "./components/IssueDetailsStaff";
import MuncipalityMain from "./pages/MuncipalityMain";
import AdminDashboard from "./pages/AdminDashboard";
import ApplicationRequest from "./pages/ApplicationRequest";
import IssueDetailsMunicipality from "./components/IssueDetailsMunicipality"; // If you have this component
import IssuesMunicipality from "./components/IssuesMunicipality"; // If you have this component
import CreateIssue from "./pages/CreateIssue";
import MonthlyAnalysis from "./pages/MonthlyAnalysis";
import Notification from "./pages/Notification";

const App = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUser());
  }, []);

  // Function to get component based on role
  const getIssuesComponent = () => {
    switch (user?.role) {
      case "User":
        return <Issues />;
      case "Municipality Admin":
        return <IssuesMunicipality />;
      case "Staff":
      case "Admin":
        return <IssuesStaff />;
      default:
        return <Issues />; // fallback
    }
  };

  const getIssueDetailsComponent = () => {
    switch (user?.role) {
      case "User":
        return <IssueDetails />;
      case "Municipality Admin":
        return <IssueDetailsMunicipality />;
      case "Staff":
      case "Admin":
        return <IssueDetailsStaff />;
      default:
        return <IssueDetails />;
    }
  };

  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/v1/notification", {
        credentials: "include",
      });
      const data = await res.json();
      setNotifications(data.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Socket.io setup for real-time notifications
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      const newSocket = io("http://localhost:3000");
      setSocket(newSocket);

      // Join user's room
      newSocket.emit("join", user._id);

      // Listen for new notifications
      newSocket.on("new-notification", () => {
        fetchNotifications();
      });

      // Listen for notification updates (read/delete)
      newSocket.on("notification-updated", () => {
        fetchNotifications();
      });

      // Initial fetch
      fetchNotifications();

      return () => {
        newSocket.off("new-notification");
        newSocket.off("notification-updated");
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user?._id]);

  return (
    <Router>
      <Routes>
        {/* Routes with Header & Footer */}
        <Route element={<MainLayout notifications={notifications} />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/issues" element={getIssuesComponent()} />
          <Route path="/issue/:slug" element={getIssueDetailsComponent()} />
          <Route path="/create" element={<CreateIssue />} />
          <Route path="/municipality" element={<MuncipalityMain />} />
          <Route path="/monthly-analysis" element={<MonthlyAnalysis />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/requests" element={<ApplicationRequest />} />
          <Route
            path="/notification"
            element={<Notification notifications={notifications} fetchNotifications={fetchNotifications} userId={user?._id} socket={socket} />}
          />
        </Route>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/otp-verification/:email" element={<OTP />} />
        <Route path="/password/reset/:token" element={<ResetPassword />} />
      </Routes>

      <ToastContainer theme="dark" />
    </Router>
  );
};

export default App;

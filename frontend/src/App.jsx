import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "./redux/slices/authSlice";

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

const App = () => {
  const { user } = useSelector((state) => state.auth);
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

  return (
    <Router>
      <Routes>
        {/* Routes with Header & Footer */}
        <Route element={<MainLayout />}>
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

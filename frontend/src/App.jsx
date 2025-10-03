import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import OTP from './pages/OTP'
import ResetPassword from './pages/ResetPassword'
import { useDispatch, useSelector } from 'react-redux'
import { getUser } from './redux/slices/authSlice'
import MainLayout from './components/MainLayout'
import About from './pages/About'
import Gallery from './pages/Gallery'
import Donate from './pages/Donate'
import Issues from './components/Issues'
import IssuesStaff from './components/IssuesStaff'
import CreateIssue from './pages/CreateIssue'
import MuncipalityMain from './pages/MuncipalityMain'
import AdminDashboard from './pages/AdminDashboard'
import ApplicationRequest from './pages/ApplicationRequest'
import IssueDetails from './components/IssueDetails'
import IssueDetailsStaff from './components/IssueDetailsStaff'
const App = () => {

  const {user,isAuthenticated}= useSelector((state)=>state.auth)
  const dispatch =useDispatch();

  useEffect(()=>{
    dispatch(getUser());
  },[])
  return (
      <Router>
          <Routes>
            {/* Routes that require Header & Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/donate" element={<Donate />} />
          <Route
            path="/issues"
            element={user && user.role === "User" ? <Issues /> : <IssuesStaff />}
          />
          <Route
            path="/issue/:slug"
            element={user && user.role === "User" ? <IssueDetails /> : <IssueDetailsStaff />}
          />
          <Route path="/create" element={<CreateIssue />} />
          <Route path="/municipality" element={<MuncipalityMain />} />
          <Route path="/admin/dashboard" element={<AdminDashboard/>}/>
          <Route path="/admin/requests" element={<ApplicationRequest/>}/>
        </Route>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/password/forgot" element={<ForgotPassword />} />
              <Route path="/otp-verification/:email" element={<OTP />} />
              <Route path="/password/reset/:token" element={<ResetPassword />} />
          </Routes>
          <ToastContainer theme='dark'/>
      </Router>
  );
};
export default App;
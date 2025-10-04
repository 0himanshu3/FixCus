import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import axios from "axios";

function IssueDetailsMunicipality() {
  const { slug } = useParams();
  const [issue, setIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showImageSlider, setShowImageSlider] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [staffAssignments, setStaffAssignments] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const { user } = useSelector((state) => state.auth);
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigningStaff, setAssigningStaff] = useState(false);

  // State for new modals and data
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [citizenFeedbacks, setCitizenFeedbacks] = useState([]); // Changed to plural and initialized as array
  const [supervisorReport, setSupervisorReport] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  async function fetchStaff() {
    try {
      setLoadingStaff(true);
      const res = await axios.get(`http://localhost:3000/api/v1/auth/staff`, {
        withCredentials: true,
      });
      setStaff(res.data || []);
    } catch (err) {
      console.error("fetchStaff", err);
      setStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  }

  const fetchIssue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/issues/${slug}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setIssue(data.issue);
        setStaffAssignments(data.issue.staffsAssigned || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
    fetchStaff();
  }, [slug]);

  useEffect(() => {
    const originalOverflow = window.getComputedStyle(document.body).overflow;
    if (showImageSlider || showFeedbackModal || showReportModal) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showImageSlider, showFeedbackModal, showReportModal]);

  const handleTakeUpIssue = async () => {
    if (!deadline) return alert("Please set a deadline before taking up the issue");
    try {
      const res = await fetch(`http://localhost:3000/api/v1/issues/takeup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ issueId: issue._id, deadline }),
      });
      if (res.ok) fetchIssue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault?.();

    if (!roleName || !staffEmail) {
      alert("Role name and staff email are required");
      return;
    }

    if (assigningStaff) return;

    setAssigningStaff(true);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/issues/assign-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ issueId: issue._id, role: roleName, staffEmail }),
      });
      if (res.ok) {
        setRoleName("");
        setStaffEmail("");
        fetchIssue();
      } else {
        alert("Failed to assign staff.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setAssigningStaff(false);
    }
  };

  const handleViewFeedback = async () => {
    setLoadingFeedback(true);
    setShowFeedbackModal(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/v1/issues/feedback/${issue._id}`, { withCredentials: true });
      setCitizenFeedbacks(res.data.feedbacks || []); // Expect an array
    } catch (error) {
      console.error("Error fetching citizen feedback:", error);
      setCitizenFeedbacks([]); // Set to empty array on error
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleViewReport = async () => {
    setLoadingReport(true);
    setShowReportModal(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/v1/issues/report/${issue._id}`, { withCredentials: true });
      setSupervisorReport(res.data.report);
    } catch (error) {
      console.error("Error fetching supervisor report:", error);
      setSupervisorReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleNextImage = () =>
    setCurrentImageIdx((prev) => (prev + 1) % issue.images.length);
  const handlePrevImage = () =>
    setCurrentImageIdx(
      (prev) => (prev - 1 + issue.images.length) % issue.images.length
    );

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (!issue)
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Issue not found.</p>
      </div>
    );

  const isResolved = issue.status === "Resolved";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-pink-400 to-pink-300 rounded-2xl p-6 shadow-2xl border-4 border-purple-600 dotted">
          <h1 className="text-3xl font-black text-purple-900 tracking-tight overflow-hidden">
            {issue.title}
          </h1>
          
          <div className="flex flex-wrap gap-3 mt-4">
            {issue.category && (
              <span className="bg-purple-700 text-pink-100 px-4 py-2 rounded-full font-bold text-sm border-2 border-pink-300 shadow-md">
                🎪 {issue.category}
              </span>
            )}
            <span className="bg-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm border-2 border-purple-300 shadow-md">
              ⚡ Priority: {issue.priority}
            </span>
            <span className="bg-purple-600 text-pink-100 px-4 py-2 rounded-full font-bold text-sm border-2 border-pink-300 shadow-md">
              📋 Status: {issue.status}
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-pink-200 rounded-xl p-5 shadow-lg border-4 border-purple-500">
          <p className="text-purple-900 font-semibold text-lg">
            <strong className="text-purple-700">📍 Location:</strong> {issue.issueDistrict + ', ' + issue.issueState + ', ' + issue.issueCountry}
          </p>
          <p className="text-purple-900 font-semibold text-lg mt-2">
            <strong className="text-purple-700">📅 Published:</strong>{" "}
            {new Date(issue.issuePublishDate).toLocaleDateString()}
          </p>
        </div>

        {/* Images Section */}
        {issue.images && issue.images.length > 0 && (
          <div className="bg-gradient-to-br from-pink-300 to-pink-200 rounded-xl p-5 shadow-xl border-4 border-purple-600">
            <h2 className="text-2xl font-black text-purple-900 mb-4">🎨 Images</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {issue.images.slice(0, 3).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Issue ${idx}`}
                  className="w-full h-36 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform border-4 border-purple-400 shadow-md"
                  onClick={() => {
                    setCurrentImageIdx(idx);
                    setShowImageSlider(true);
                  }}
                />
              ))}
            </div>
            {issue.images.length > 3 && (
              <button
                onClick={() => setShowImageSlider(true)}
                className="mt-4 px-6 py-3 bg-purple-700 text-pink-100 rounded-full font-bold hover:bg-purple-800 shadow-lg border-2 border-pink-300 transform hover:scale-105 transition-all"
              >
                🎭 View More
              </button>
            )}
          </div>
        )}

        {/* Image Slider Modal */}
        <AnimatePresence>
          {showImageSlider && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/95"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                className="absolute top-5 right-5 text-pink-300 text-5xl hover:text-pink-100 font-bold"
                onClick={() => setShowImageSlider(false)}
              >
                &times;
              </button>

              <div className="relative w-4/5 max-w-3xl">
                <img
                  src={issue.images[currentImageIdx]}
                  alt={`Slide ${currentImageIdx}`}
                  className="w-full h-96 object-contain rounded-xl border-4 border-pink-400 shadow-2xl"
                />
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-300 text-5xl hover:text-pink-100 bg-purple-800/50 rounded-full w-14 h-14 flex items-center justify-center"
                  onClick={handlePrevImage}
                >
                  &#8592;
                </button>
                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-pink-300 text-5xl hover:text-pink-100 bg-purple-800/50 rounded-full w-14 h-14 flex items-center justify-center"
                  onClick={handleNextImage}
                >
                  &#8594;
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Videos Section */}
        {issue.videos && issue.videos.length > 0 && (
          <div className="bg-gradient-to-br from-pink-300 to-pink-200 rounded-xl p-5 shadow-xl border-4 border-purple-600">
            <h2 className="text-2xl font-black text-purple-900 mb-4">🎬 Videos</h2>
            <div className="space-y-4">
              {issue.videos.map((vid, idx) => (
                <video
                  key={idx}
                  src={vid}
                  controls
                  className="w-full h-64 rounded-lg border-4 border-purple-400 shadow-md"
                />
              ))}
            </div>
          </div>
        )}

        {/* Upvotes / Downvotes */}
        <div className="flex items-center gap-4 justify-center">
          <div className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full font-black text-lg shadow-xl border-4 border-purple-600">
            👍 Upvotes: {issue.upvotes?.length || 0}
          </div>
          <div className="px-6 py-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-full font-black text-lg shadow-xl border-4 border-purple-600">
            👎 Downvotes: {issue.downvotes?.length || 0}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-pink-200 rounded-xl p-5 shadow-xl border-4 border-purple-600">
          <h2 className="text-2xl font-black overflow-hidden text-purple-900 mb-4">💬 Comments</h2>
          <div className="space-y-3">
            {issue.comments && issue.comments.length > 0 ? (
              issue.comments.map((c) => (
                <div
                  key={c._id}
                  className="bg-white rounded-lg p-4 shadow-md border-2 border-pink-400"
                >
                  <p className="text-purple-900 font-medium">{c.content}</p>
                  <p className="text-sm text-purple-600 mt-2">
                    🎪 By {c.user.name} on {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-purple-700 font-semibold">No comments yet.</p>
            )}
          </div>
        </div>

        {/* Municipality Action: Take Up Issue */}
        {issue.status === "Open" && !issue.issueTakenUpBy && (
          <div className="bg-gradient-to-r from-pink-300 to-pink-200 rounded-xl p-6 shadow-xl border-4 border-purple-600">
            <h2 className="text-2xl font-black text-purple-900 mb-4">🎯 Take Up Issue</h2>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="border-4 border-purple-500 rounded-lg px-4 py-3 w-full mb-4 font-semibold text-purple-900 focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
              min={new Date().toISOString().split("T")[0]}
            />
            <button
              onClick={handleTakeUpIssue}
              className="w-full px-6 py-3 bg-purple-700 text-pink-100 rounded-full font-black text-lg hover:bg-purple-800 shadow-lg border-4 border-pink-400 transform hover:scale-105 transition-all"
            >
              🎪 Take Up & Set Deadline
            </button>
          </div>
        )}

        {/* Municipality Action: Assign Staff or View Reports */}
        {issue.issueTakenUpBy && issue.issueTakenUpBy._id === user._id && (
          <div className="bg-gradient-to-r from-pink-300 to-pink-200 rounded-xl p-6 shadow-xl border-4 border-purple-600">
            <h2 className="text-2xl font-black overflow-hidden text-purple-900 mb-4">
              {isResolved ? "Final Staff Assignments" : "👥 Assign Staff"}
            </h2>
            
            {!isResolved && (
              <>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="border-4 border-purple-500 rounded-lg px-4 py-3 w-full mb-4 font-semibold text-purple-900 focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Worker">Worker</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Coordinator">Coordinator</option>
                </select>
      
                <select
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="border-4 border-purple-500 rounded-lg px-4 py-3 w-full mb-4 font-semibold text-purple-900 focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
                  required
                >
                  <option value="">Select Staff</option>
                  {staff.map((s) => (
                    <option key={s._id} value={s.email}>
                      {`${s.name} (${s.email}) — ${s.available ? 'Available' : 'Busy'}`}
                    </option>
                  ))}
                </select>
      
                <button
                  onClick={handleAssignStaff}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-full font-black text-lg hover:bg-green-700 shadow-lg border-4 border-purple-500 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!roleName || !staffEmail || assigningStaff}
                >
                  {assigningStaff ? "Assigning..." : "✅ Assign Staff"}
                </button>
              </>
            )}

            <div className="mt-6 space-y-3">
              <h3 className="font-black text-xl text-purple-900">🎭 Assigned Staff</h3>
              {issue.staffsAssigned && issue.staffsAssigned.length > 0 ? (
                issue.staffsAssigned.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-lg shadow-md border-2 border-pink-400"
                  >
                    <p className="text-purple-900 font-semibold">
                      <strong>Role:</strong> {s.role}
                    </p>
                    <p className="text-purple-900 font-semibold">
                      <strong>Name:</strong> {s.user?.name || "N/A"}
                    </p>
                    <p className="text-purple-900 font-semibold">
                      <strong>Email:</strong> {s.user?.email || "N/A"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-purple-700 font-semibold">No staff assigned yet.</p>
              )}
            </div>
            
            {isResolved && (
              <div className="mt-8 pt-6 border-t-4 border-dashed border-purple-500">
                <h3 className="font-black text-xl text-purple-900 mb-4">Post-Resolution Reports</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleViewFeedback}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-full font-black text-lg hover:bg-blue-700 shadow-lg border-4 border-purple-400 transform hover:scale-105 transition-all"
                    >
                        📢 View Citizen Feedback
                    </button>
                    <button
                        onClick={handleViewReport}
                        className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-full font-black text-lg hover:bg-teal-700 shadow-lg border-4 border-purple-400 transform hover:scale-105 transition-all"
                    >
                        📜 View Supervisor Report
                    </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Citizen Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/95 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-gradient-to-br from-pink-200 to-pink-100 rounded-xl p-6 shadow-xl border-4 border-purple-600 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
                <button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 text-purple-700 text-4xl hover:text-pink-500 font-bold">&times;</button>
                <h2 className="text-2xl font-black text-purple-900 mb-4">📢 Citizen Feedback</h2>
                {loadingFeedback ? (
                    <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div></div>
                ) : citizenFeedbacks.length > 0 ? (
                <div className="space-y-4">
                  {citizenFeedbacks.map((feedback) => (
                    <div key={feedback._id} className="p-4 bg-white rounded-lg shadow-md border-2 border-pink-400 text-purple-800 space-y-2">
                        <p><strong>Submitted By:</strong> {feedback.submittedBy?.name || 'Anonymous'}</p>
                        <p><strong>Date:</strong> {new Date(feedback.createdAt).toLocaleString()}</p>
                        <hr className="border-purple-300"/>
                        <p><strong>Issue Resolved:</strong> <span className="font-bold">{feedback.resolved}</span></p>
                        <p><strong>Resolution Time:</strong> {feedback.resolutionTime}</p>
                        <p><strong>Resolution Quality:</strong> {feedback.resolutionQuality}</p>
                        <p><strong>Staff Professionalism:</strong> {feedback.staffProfessionalism}</p>
                        <hr className="border-purple-300"/>
                        <p><strong>Overall Satisfaction:</strong> <span className="font-bold">{feedback.satisfactionRating} / 5</span></p>
                        <p><strong>Complaint Taken Seriously:</strong> {feedback.takenSeriously}</p>
                        <p><strong>Clear Communication:</strong> {feedback.clearCommunication}</p>
                        <p><strong>Future Trust:</strong> {feedback.futureTrust}</p>
                        <p><strong>Would Use System Again:</strong> {feedback.useSystemAgain}</p>
                        {feedback.suggestions && <div><strong>Suggestions:</strong><blockquote className="mt-1 p-2 bg-purple-100 border-l-4 border-purple-400 italic">{feedback.suggestions}</blockquote></div>}
                        {feedback.additionalComments && <div><strong>Additional Comments:</strong><blockquote className="mt-1 p-2 bg-purple-100 border-l-4 border-purple-400 italic">{feedback.additionalComments}</blockquote></div>}
                        {feedback.photos && feedback.photos.length > 0 && (
                            <div>
                                <h3 className="font-bold mt-4">Attached Photos:</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                    {feedback.photos.map((photo, idx) => <img key={idx} src={photo} alt="Feedback" className="w-full h-24 object-cover rounded-md border-2 border-purple-400"/>)}
                                </div>
                            </div>
                        )}
                    </div>
                  ))}
                </div>
                ) : (
                    <p className="text-center font-bold text-purple-700 py-10">No citizen feedback has been submitted for this issue yet.</p>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supervisor Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/95 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-gradient-to-br from-pink-200 to-pink-100 rounded-xl p-6 shadow-xl border-4 border-purple-600 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
                <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-purple-700 text-4xl hover:text-pink-500 font-bold">&times;</button>
                <h2 className="text-2xl font-black text-purple-900 mb-4">📜 Supervisor Resolution Report</h2>
                {loadingReport ? (
                    <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div></div>
                ) : supervisorReport ? (
                    <div className="space-y-6 text-purple-800">
                        <div>
                            <h3 className="font-bold text-xl mb-2">Resolution Summary</h3>
                            <blockquote className="p-4 bg-purple-100 border-l-4 border-purple-500 italic">{supervisorReport.summary}</blockquote>
                            <p className="text-sm mt-2"><strong>Report by:</strong> {supervisorReport.supervisor?.name}</p>
                            <p className="text-sm"><strong>Date:</strong> {new Date(supervisorReport.createdAt).toLocaleString()}</p>
                        </div>

                        {supervisorReport.images && supervisorReport.images.length > 0 && (
                            <div>
                                <h3 className="font-bold text-xl mb-2">Resolution Images</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {supervisorReport.images.map((img, idx) => <img key={idx} src={img} alt="Resolution" className="w-full h-32 object-cover rounded-lg border-2 border-purple-400"/>)}
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="font-bold text-xl mb-2">Staff Performance Review</h3>
                            <div className="space-y-3">
                                {supervisorReport.staffPerformance.map((staff, idx) => (
                                    <div key={idx} className="p-3 bg-white rounded-lg shadow border-2 border-pink-300">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-lg">{staff.name} <span className="text-sm font-medium text-purple-600">({staff.role})</span></p>
                                                <p className="text-xs text-gray-500">{staff.email}</p>
                                            </div>
                  _MOD_
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-center font-bold text-purple-700 py-10">The supervisor's report for this issue could not be found.</p>
                )}
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default IssueDetailsMunicipality;


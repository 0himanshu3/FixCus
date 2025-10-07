import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  RadialLinearScale,
} from "chart.js";
import { Bar, Pie, Doughnut, PolarArea } from "react-chartjs-2";
import Timeline from "./Timeline";
import { toast } from "react-toastify";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  RadialLinearScale
);

// --- MODIFICATION START: New component to render formatted AI analysis ---
const AnalysisRenderer = ({ analysis }) => {
  if (!analysis) return null;

  // Define sections with titles and corresponding emojis
  const sections = [
    { title: "Overall Sentiment & Satisfaction", emoji: "📊" },
    { title: "Resolution Analysis", emoji: "📈" },
    { title: "Key Strengths", emoji: "✨" },
    { title: "Areas for Improvement", emoji: "⚠️" },
    { title: "Actionable Suggestions", emoji: "💡" },
    { title: "Final Verdict", emoji: "⚖️" },
  ];

  // Parse the analysis string into a structured object
  const parsedAnalysis = sections.reduce((acc, section, index) => {
    const nextSection = sections[index + 1];
    const startPattern = `**${section.title}**`;

    const startIndex = analysis.indexOf(startPattern);
    if (startIndex === -1) return acc;

    let endIndex;
    if (nextSection) {
      const nextStartPattern = `**${nextSection.title}**`;
      endIndex = analysis.indexOf(nextStartPattern, startIndex);
    }

    const contentRaw = analysis
      .substring(
        startIndex + startPattern.length,
        endIndex === -1 ? undefined : endIndex
      )
      .trim();

    // Process content for bullet points
    const contentLines = contentRaw
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.replace(/^[*-]\s*/, ""));

    acc[section.title] = contentLines;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const content = parsedAnalysis[section.title];
        if (!content || content.length === 0) return null;

        return (
          <div
            key={section.title}
            className="bg-white/50 p-4 rounded-lg shadow border-2 border-pink-300">
            <h3 className="text-xl font-black text-purple-900 mb-2">
              {section.emoji} {section.title}
            </h3>
            <div className="text-purple-800 space-y-2">
              {content.length > 1 ? (
                <ul className="list-disc list-inside space-y-1">
                  {content.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>{content[0]}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
// --- MODIFICATION END ---

// --- MODIFICATION START: New component for feedback visualization ---
const FeedbackVisualizer = ({ feedbacks }) => {
  if (!feedbacks || feedbacks.length === 0) return null;

  // Process data for charts
  const satisfactionData = {
    labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    datasets: [
      {
        label: "# of Votes",
        data: [1, 2, 3, 4, 5].map(
          (rating) =>
            feedbacks.filter((fb) => fb.satisfactionRating === rating).length
        ),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(255, 205, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(54, 162, 235, 0.6)",
        ],
        borderColor: [
          "rgb(255, 99, 132)",
          "rgb(255, 159, 64)",
          "rgb(255, 205, 86)",
          "rgb(75, 192, 192)",
          "rgb(54, 162, 235)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const resolvedData = {
    labels: ["Yes", "Partially", "No"],
    datasets: [
      {
        data: ["Yes", "Partially", "No"].map(
          (status) => feedbacks.filter((fb) => fb.resolved === status).length
        ),
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 205, 86, 0.6)",
          "rgba(255, 99, 132, 0.6)",
        ],
        borderColor: ["#fff"],
        borderWidth: 2,
      },
    ],
  };

  const resolutionTimeData = {
    labels: ["Very fast", "Acceptable", "Too slow", "Still pending"],
    datasets: [
      {
        data: ["Very fast", "Acceptable", "Too slow", "Still pending"].map(
          (status) =>
            feedbacks.filter((fb) => fb.resolutionTime === status).length
        ),
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(255, 99, 132, 0.6)",
        ],
        borderColor: ["#fff"],
        borderWidth: 2,
      },
    ],
  };

  const professionalismData = {
    labels: ["Yes", "No"],
    datasets: [
      {
        data: ["Yes", "No"].map(
          (status) =>
            feedbacks.filter((fb) => fb.staffProfessionalism === status).length
        ),
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
        borderColor: ["#fff"],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#4B0082", // Indigo-like color for legend text
          font: {
            weight: "bold",
          },
        },
      },
      title: {
        display: true,
        color: "#6a0dad", // Purple color
        font: {
          size: 16,
          weight: "bold",
        },
      },
    },
  };

  return (
    <div className="mb-6 p-4 bg-white/50 rounded-lg shadow border-2 border-pink-300">
      <h3 className="text-2xl font-black text-purple-900 mb-4 text-center">
        📈 Feedback at a Glance
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-purple-100/50 p-3 rounded-lg shadow-inner">
          <Bar
            options={{
              ...chartOptions,
              title: {
                ...chartOptions.plugins.title,
                text: "Overall Satisfaction Ratings",
              },
            }}
            data={satisfactionData}
          />
        </div>
        <div className="bg-purple-100/50 p-3 rounded-lg shadow-inner flex justify-center items-center h-64 md:h-auto">
          <Pie
            options={{
              ...chartOptions,
              title: {
                ...chartOptions.plugins.title,
                text: "Was the Issue Resolved?",
              },
            }}
            data={resolvedData}
          />
        </div>
        <div className="bg-purple-100/50 p-3 rounded-lg shadow-inner flex justify-center items-center h-64 md:h-auto">
          <Doughnut
            options={{
              ...chartOptions,
              title: {
                ...chartOptions.plugins.title,
                text: "Perceived Resolution Time",
              },
            }}
            data={resolutionTimeData}
          />
        </div>
        <div className="bg-purple-100/50 p-3 rounded-lg shadow-inner flex justify-center items-center h-64 md:h-auto">
          <PolarArea
            options={{
              ...chartOptions,
              title: {
                ...chartOptions.plugins.title,
                text: "Staff Professionalism",
              },
            }}
            data={professionalismData}
          />
        </div>
      </div>
    </div>
  );
};


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
  const [citizenFeedbacks, setCitizenFeedbacks] = useState([]);
  const [supervisorReport, setSupervisorReport] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  // State for AI Analysis Modal
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  // Suggested staff states
  const [suggestedStaff, setSuggestedStaff] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [assigningSuggestedId, setAssigningSuggestedId] = useState(null); // userId being assigned
  const [assigningAllSuggested, setAssigningAllSuggested] = useState(false);

  // Derived list: suggested but not already assigned
  const [unassignedSuggested, setUnassignedSuggested] = useState([]);

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
        // suggestions will be loaded by effect watching issue & user
      } else {
        console.error("Failed to fetch issue", res.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch suggested staff for an issue
  async function fetchSuggestedStaff(issueId) {
    if (!issueId) return;
    setLoadingSuggested(true);
    try {
      const res = await axios.get(
        `http://localhost:3000/api/v1/issues/${issueId}/suggested-staff`,
        { withCredentials: true }
      );
      const data = res.data || {};
      const suggested = data.suggested || data.suggestions || data.top || [];
      setSuggestedStaff(suggested);
    } catch (err) {
      console.error("fetchSuggestedStaff", err);
      setSuggestedStaff([]);
    } finally {
      setLoadingSuggested(false);
    }
  }

  useEffect(() => {
    fetchIssue();
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
  if (
    issue &&
    user &&
    issue.issueTakenUpBy &&
    ((issue.issueTakenUpBy._id && issue.issueTakenUpBy._id === user._id) ||
      String(issue.issueTakenUpBy) === String(user._id))
  ) {
    fetchSuggestedStaff(issue._id);
  } else {
    setSuggestedStaff([]);
    setUnassignedSuggested([]);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [issue, user]);

// 2) Compute unassignedSuggested robustly by normalizing ids & emails
useEffect(() => {
  // Build set of assigned user ids and assigned emails for quick lookup
  const assignedIdSet = new Set();
  const assignedEmailSet = new Set();

  (issue?.staffsAssigned || []).forEach((as) => {
    if (!as) return;

    // as.user might be a string id, an ObjectId-like, or a populated object with _id and email
    let u = as.user;

    // If the staff entry itself sometimes contains email directly (rare), check that
    if (as.email) {
      assignedEmailSet.add(String(as.email).toLowerCase());
    }

    // If as.user is an object with _id
    if (u && typeof u === "object") {
      if (u._id) assignedIdSet.add(String(u._id));
      if (u.email) assignedEmailSet.add(String(u.email).toLowerCase());
    } else if (u) {
      // as.user is probably an id string
      assignedIdSet.add(String(u));
    }
  });

  // Also consider any populated 'staffsAssigned' items that may be nested deeper
  // (already handled above but safe-guard)
  // Build unassignedSuggested by checking candidate.userId / candidate.user / candidate._id and candidate.email
  const filtered = (suggestedStaff || []).filter((c) => {
    // normalize candidate id & email
    const candId = c.userId || c.user || c._id || null;
    const candIdStr = candId ? String(candId) : null;
    const candEmailStr = c.email ? String(c.email).toLowerCase() : null;

    // If candidate id exists and is in assigned ids -> filter out
    if (candIdStr && assignedIdSet.has(candIdStr)) return false;

    // If candidate email exists and matches assigned email -> filter out
    if (candEmailStr && assignedEmailSet.has(candEmailStr)) return false;

    // Not assigned
    return true;
  });

  // Debugging: uncomment to inspect what's happening (remove in production)
  // console.log("assignedIdSet", Array.from(assignedIdSet), "assignedEmailSet", Array.from(assignedEmailSet));
  // console.log("suggestedStaff", suggestedStaff, "unassignedAfterFilter", filtered);

  setUnassignedSuggested(filtered);
}, [suggestedStaff, issue]);

  useEffect(() => {
    const originalOverflow = window.getComputedStyle(document.body).overflow;
    if (
      showImageSlider ||
      showFeedbackModal ||
      showReportModal ||
      showAnalysisModal ||
      isTimelineModalOpen
    ) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [
    showImageSlider,
    showFeedbackModal,
    showReportModal,
    showAnalysisModal,
    isTimelineModalOpen,
  ]);

  const handleTakeUpIssue = async () => {
    if (!deadline)
      return toast.info("Please set a deadline before taking up the issue");
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
    e?.preventDefault?.();

    if (!roleName || !staffEmail) {
      toast.error("Role name and staff email are required");
      return;
    }

    if (assigningStaff) return;

    setAssigningStaff(true);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/issues/assign-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          issueId: issue._id,
          role: roleName,
          staffEmail,
        }),
      });

      if (res.ok) {
        setRoleName("");
        setStaffEmail("");
        await fetchIssue();
        await fetchSuggestedStaff(issue._id);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to assign staff.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setAssigningStaff(false);
    }
  };

  const handleViewFeedback = async () => {
    setLoadingFeedback(true);
    setShowFeedbackModal(true);
    try {
      const res = await axios.get(
        `http://localhost:3000/api/v1/issues/feedback/${issue._id}`,
        { withCredentials: true }
      );
      setCitizenFeedbacks(res.data.feedbacks || []);
    } catch (error) {
      console.error("Error fetching citizen feedback:", error);
      setCitizenFeedbacks([]);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleViewReport = async () => {
    setLoadingReport(true);
    setShowReportModal(true);
    try {
      const res = await axios.get(
        `http://localhost:3000/api/v1/issues/report/${issue._id}`,
        { withCredentials: true }
      );
      setSupervisorReport(res.data.report);
    } catch (error) {
      console.error("Error fetching supervisor report:", error);
      setSupervisorReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    setShowAnalysisModal(true);
    setAiAnalysis("");

    try {
      const res = await axios.post(
        `http://localhost:3000/api/v1/issues/analyze-feedback`,
        { issueId: issue._id },
        { withCredentials: true }
      );
      setAiAnalysis(res.data.analysis);
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      setAiAnalysis(
        "Failed to generate the analysis. Please check the server logs and try again."
      );
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  // Suggested staff assignment - single candidate
  const handleAssignSuggestedSingle = async (candidate, role) => {
    if (!candidate?.email) {
      toast.error("Candidate email missing");
      return;
    }
    if (assigningSuggestedId) return; // already assigning
    const candidateId = candidate.userId || candidate.user || candidate._id;
    setAssigningSuggestedId(candidateId);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/issues/assign-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          issueId: issue._id,
          role,
          staffEmail: candidate.email,
        }),
      });

      if (res.ok) {
        toast.success(`${candidate.name} assigned as ${role}`);
        // Refresh issue & suggestions
        await fetchIssue();
        await fetchSuggestedStaff(issue._id);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to assign suggested staff.");
      }
    } catch (err) {
      console.error("handleAssignSuggestedSingle", err);
      toast.error("Something went wrong while assigning.");
    } finally {
      setAssigningSuggestedId(null);
    }
  };

  // Suggested staff assignment - assign all unassigned suggested in bulk
  // Note: backend endpoint assigns top-5; frontend limits the UI to unassigned ones.
  const handleAssignAllSuggested = async () => {
    if (assigningAllSuggested) return;
    // If there are no unassigned suggested, no-op
    if (!unassignedSuggested || unassignedSuggested.length === 0) {
      toast.info("No suggested staff to assign.");
      return;
    }

    setAssigningAllSuggested(true);
    try {
      // If you have a backend bulk endpoint that assigns only top5,
      // but you want to only assign the unassigned ones, you might need a custom backend.
      // Here we'll call the existing bulk endpoint (which assigns top5) — but it's fine because
      // duplicates are avoided server-side; frontend just uses it for convenience.
      const res = await fetch(
        `http://localhost:3000/api/v1/issues/${issue._id}/assign-suggested`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (res.ok) {
        toast.success("Top suggested staff assigned");
        await fetchIssue();
        await fetchSuggestedStaff(issue._id);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to assign suggested staff.");
      }
    } catch (err) {
      console.error("handleAssignAllSuggested", err);
      toast.error("Something went wrong while assigning all suggested staff.");
    } finally {
      setAssigningAllSuggested(false);
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
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 to-pink-300 rounded-2xl p-6 shadow-2xl border-4 border-purple-600">
          <h1 className="text-3xl font-black text-purple-900 tracking-tight">
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

        {/* NEW: Description Section */}
        <div className="bg-white/80 border-4 border-yellow-200 rounded-xl shadow-lg p-6 text-lg text-purple-900 leading-relaxed">
          <h2 className="font-bold text-2xl mb-3 text-pink-700 flex items-center gap-2">
            📝 Description
          </h2>
          <p>
            {issue.content || (
              <span className="italic text-gray-400">No description provided.</span>
            )}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-pink-200 rounded-xl p-5 shadow-lg border-4 border-purple-500">
          <ul className="space-y-1 text-purple-900 font-semibold text-lg">
            <li>
              <strong className="text-purple-700">📍 Location:</strong>{" "}
              {issue.issueDistrict}, {issue.issueState}, {issue.issueCountry}
            </li>
            <li>
              <strong className="text-purple-700">📅 Published:</strong>{" "}
              {new Date(issue.issuePublishDate).toLocaleDateString()}
            </li>
            {issue.deadline && (
              <li>
                <strong className="text-purple-700">🕒 Deadline:</strong>{" "}
                {new Date(issue.deadline).toLocaleDateString()}
              </li>
            )}
          </ul>
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

        <AnimatePresence>
          {showImageSlider && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/95"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImageSlider(false)}
            >
              <button
                className="absolute top-5 right-5 text-pink-300 text-5xl hover:text-pink-100 font-bold"
                onClick={() => setShowImageSlider(false)}
              >
                &times;
              </button>

              <div
                className="relative w-4/5 max-w-3xl"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={issue.images[currentImageIdx]}
                  alt={`Slide ${currentImageIdx}`}
                  className="w-full h-96 object-contain rounded-xl border-4 border-pink-400 shadow-2xl"
                />
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-300 text-5xl hover:text-pink-100 bg-purple-800/50 rounded-full w-14 h-14 flex items-center justify-center"
                  onClick={handlePrevImage}
                />
                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-pink-300 text-5xl hover:text-pink-100 bg-purple-800/50 rounded-full w-14 h-14 flex items-center justify-center"
                  onClick={handleNextImage}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upvotes / Downvotes */}
        <div className="flex items-center gap-4 justify-center">
          <div className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full font-black text-lg shadow-xl border-4 border-purple-600">
            👍 Upvotes: {issue.upvotes?.length || 0}
          </div>
          <div className="px-6 py-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-full font-black text-lg shadow-xl border-4 border-purple-600">
            👎 Downvotes: {issue.downvotes?.length || 0}
          </div>
        </div>

        {/* View Timeline Button */}
        <div className="text-center">
          <button
            onClick={() => setIsTimelineModalOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-pink-100 font-black text-lg rounded-full shadow-lg hover:from-purple-700 hover:to-purple-800 border-4 border-pink-400 transform hover:scale-105 transition-all"
          >
            📅 View Issue Timeline
          </button>
        </div>

        {/* Comments Section */}
        <div className="bg-pink-200 rounded-xl p-5 shadow-xl border-4 border-purple-600">
          <h2 className="text-2xl font-black overflow-hidden text-purple-900 mb-4">
            💬 Comments
          </h2>
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
        {issue.issueTakenUpBy &&
          ((issue.issueTakenUpBy._id && issue.issueTakenUpBy._id === user._id) ||
            String(issue.issueTakenUpBy) === String(user._id)) && (
            <div className="bg-gradient-to-r from-pink-300 to-pink-200 rounded-xl p-6 shadow-xl border-4 border-purple-600">
              <h2 className="text-2xl font-black overflow-hidden text-purple-900 mb-4">
                {isResolved ? "Final Staff Assignments" : "👥 Assign Staff"}
              </h2>

              {!isResolved && (
                <>
                  {/* Suggested Staff Members (only unassigned) */}
                  <div className="mt-6 bg-gradient-to-r from-white/80 to-white/60 rounded-xl p-4 border-4 border-purple-300 shadow-md">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-xl text-purple-900">⭐ Suggested Staff Members</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchSuggestedStaff(issue._id)}
                          className="px-3 py-1 rounded-full border-2 border-purple-400 text-sm font-semibold hover:bg-purple-50"
                        >
                          Refresh
                        </button>
                        <button
                          onClick={handleAssignAllSuggested}
                          disabled={assigningAllSuggested || !unassignedSuggested || unassignedSuggested.length === 0}
                          className="px-3 py-1 rounded-full bg-green-600 text-white font-black text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {assigningAllSuggested ? "Assigning..." :
                            `Assign All (${unassignedSuggested ? unassignedSuggested.length : 0})`}
                        </button>
                      </div>
                    </div>

                    {loadingSuggested ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
                      </div>
                    ) : unassignedSuggested && unassignedSuggested.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {unassignedSuggested.map((c, idx) => {
                          const suggestedRole = idx === 0 ? "Supervisor" : idx === 1 ? "Coordinator" : "Worker";
                          const userId = c.userId || c.user || c._id;
                          const isAssigning = assigningSuggestedId === userId;
                          return (
                            <div key={userId} className="p-3 bg-white rounded-lg shadow-sm border-2 border-purple-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img src={c.avatar || "/default-avatar.png"} alt={c.name} className="w-12 h-12 rounded-full object-cover border-2 border-purple-300" />
                                <div>
                                  <p className="font-semibold text-purple-900">{c.name}</p>
                                  <p className="text-sm text-gray-600">{c.email}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Score: {(c.score || 0).toFixed(3)} • Solved: {(c.solvedRate || 0).toFixed(2)} • AssignedCount: {c.assignedCount || 0}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-bold text-sm border-2 border-purple-200">{suggestedRole}</span>

                                <button
                                  onClick={() => handleAssignSuggestedSingle(c, suggestedRole)}
                                  disabled={isAssigning}
                                  className="px-4 py-2 rounded-full bg-blue-600 text-white font-black hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {isAssigning ? "Assigning..." : "Assign"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-600">No suggested staff (unassigned) found for this category.</p>
                    )}
                  </div>

                  {/* Manual assign controls (existing) */}
                  <div className="mt-6">
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
                          {`${s.name} (${s.email}) — ${s.available ? "Available" : "Busy"}`}
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
                  </div>
                </>
              )}

              <div className="mt-6 space-y-3">
                <h3 className="font-black text-xl text-purple-900">🎭 Assigned Staff</h3>
                {issue.staffsAssigned && issue.staffsAssigned.length > 0 ? (
                  issue.staffsAssigned.map((s, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-lg shadow-md border-2 border-pink-400">
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
                  <div className="space-y-4">
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
                    <div>
                      <button
                        onClick={handleGenerateAnalysis}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-full font-black text-lg hover:bg-indigo-700 shadow-lg border-4 border-purple-400 transform hover:scale-105 transition-all"
                      >
                        🤖 Generate AI Feedback Analysis
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Citizen Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/95 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-gradient-to-br from-pink-200 to-pink-100 rounded-xl p-6 shadow-xl border-4 border-purple-600 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="absolute top-4 right-4 text-purple-700 text-4xl hover:text-pink-500 font-bold"
              >
                &times;
              </button>
              <h2 className="text-2xl font-black text-purple-900 mb-4">📢 Citizen Feedback</h2>
              {loadingFeedback ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : citizenFeedbacks.length > 0 ? (
                <>
                  <FeedbackVisualizer feedbacks={citizenFeedbacks} />
                  <div className="space-y-4 mt-6">
                    <h3 className="text-xl font-black text-purple-900 text-center">Detailed Feedback Entries</h3>
                    {citizenFeedbacks.map((feedback) => (
                      <div key={feedback._id} className="p-4 bg-white rounded-lg shadow-md border-2 border-pink-400 text-purple-800 space-y-2">
                        <p><strong>Submitted By:</strong> {feedback.submittedBy?.name || "Anonymous"}</p>
                        <p><strong>Date:</strong> {new Date(feedback.createdAt).toLocaleString()}</p>
                        <hr className="border-purple-300" />
                        <p><strong>Issue Resolved:</strong> <span className="font-bold">{feedback.resolved}</span></p>
                        <p><strong>Resolution Time:</strong> {feedback.resolutionTime}</p>
                        <p><strong>Resolution Quality:</strong> {feedback.resolutionQuality}</p>
                        <p><strong>Staff Professionalism:</strong> {feedback.staffProfessionalism}</p>
                        <hr className="border-purple-300" />
                        <p><strong>Overall Satisfaction:</strong> <span className="font-bold">{feedback.satisfactionRating} / 5</span></p>
                        <p><strong>Complaint Taken Seriously:</strong> {feedback.takenSeriously}</p>
                        <p><strong>Clear Communication:</strong> {feedback.clearCommunication}</p>
                        <p><strong>Future Trust:</strong> {feedback.futureTrust}</p>
                        <p><strong>Would Use System Again:</strong> {feedback.useSystemAgain}</p>
                        {feedback.suggestions && (
                          <div>
                            <strong>Suggestions:</strong>
                            <blockquote className="mt-1 p-2 bg-purple-100 border-l-4 border-purple-400 italic">{feedback.suggestions}</blockquote>
                          </div>
                        )}
                        {feedback.additionalComments && (
                          <div>
                            <strong>Additional Comments:</strong>
                            <blockquote className="mt-1 p-2 bg-purple-100 border-l-4 border-purple-400 italic">{feedback.additionalComments}</blockquote>
                          </div>
                        )}
                        {feedback.photos && feedback.photos.length > 0 && (
                          <div>
                            <h3 className="font-bold mt-4">Attached Photos:</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                              {feedback.photos.map((photo, idx) => (
                                <img key={idx} src={photo} alt="Feedback" className="w-full h-24 object-cover rounded-md border-2 border-purple-400" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
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
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/95 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-gradient-to-br from-pink-200 to-pink-100 rounded-xl p-6 shadow-xl border-4 border-purple-600 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setShowReportModal(false)}
                className="absolute top-4 right-4 text-purple-700 text-4xl hover:text-pink-500 font-bold"
              >
                &times;
              </button>
              <h2 className="text-2xl font-black text-purple-900 mb-4">📜 Supervisor Resolution Report</h2>
              {loadingReport ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
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
                        {supervisorReport.images.map((img, idx) => (
                          <img key={idx} src={img} alt="Resolution" className="w-full h-32 object-cover rounded-lg border-2 border-purple-400" />
                        ))}
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
                            <p className="text-lg font-black text-purple-700">Rating: {staff.rating} / 5</p>
                          </div>
                          {staff.comment && (
                            <blockquote className="mt-2 text-sm p-2 bg-gray-50 border-l-4 border-gray-300 italic">"{staff.comment}"</blockquote>
                          )}
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

      {/* AI Analysis Modal */}
      <AnimatePresence>
        {showAnalysisModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/95 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-gradient-to-br from-pink-200 to-pink-100 rounded-xl p-6 shadow-xl border-4 border-purple-600 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="absolute top-4 right-4 text-purple-700 text-4xl hover:text-pink-500 font-bold"
              >
                &times;
              </button>
              <h2 className="text-2xl font-black text-purple-900 mb-4">🤖 AI Feedback Analysis</h2>
              {isGeneratingAnalysis ? (
                <div className="flex flex-col justify-center items-center h-48 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                  <p className="font-semibold text-purple-700">Generating summary, please wait...</p>
                </div>
              ) : (
                <AnalysisRenderer analysis={aiAnalysis} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Timeline
        issueId={issue._id}
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
      />
    </div>
  );
}

export default IssueDetailsMunicipality;

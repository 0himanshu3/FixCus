import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";

function IssueDetailsMunicipality() {
  const { slug } = useParams();
  const [issue, setIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showImageSlider, setShowImageSlider] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [staffAssignments, setStaffAssignments] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [staffEmail, setStaffEmail] = useState(""); // ✅ use staff email instead of ID
  const { user } = useSelector((state) => state.auth);

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
        setStaffAssignments(data.issue.staffAssignments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [slug]);

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

  const handleAssignStaff = async () => {
    if (!roleName || !staffEmail) return alert("Role name and staff email are required");
    try {
      const res = await fetch(`http://localhost:3000/api/v1/issues/assign-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ issueId: issue._id, role: roleName, staffEmail }), // ✅ pass staff email
      });
      if (res.ok) {
        setRoleName("");
        setStaffEmail("");
        fetchIssue();
      }
    } catch (err) {
      console.error(err);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">{issue.title}</h1>
      <div className="flex flex-wrap gap-3">
        {issue.category && (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            {issue.category}
          </span>
        )}
        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
          Priority: {issue.priority}
        </span>
        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
          Status: {issue.status}
        </span>
      </div>

      <p className="text-gray-600">
        <strong>Location:</strong> {issue.issueLocation}
      </p>
      <p className="text-gray-600">
        <strong>Published:</strong>{" "}
        {new Date(issue.issuePublishDate).toLocaleDateString()}
      </p>

      {/* Images Section */}
      {issue.images && issue.images.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {issue.images.slice(0, 3).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Issue ${idx}`}
                className="w-full h-32 object-cover rounded-md cursor-pointer hover:scale-105 transition-transform"
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
              className="mt-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
            >
              View More
            </button>
          )}
        </div>
      )}

      {/* Image Slider Modal */}
      <AnimatePresence>
        {showImageSlider && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="absolute top-5 right-5 text-white text-3xl"
              onClick={() => setShowImageSlider(false)}
            >
              &times;
            </button>

            <div className="relative w-4/5 max-w-3xl">
              <img
                src={issue.images[currentImageIdx]}
                alt={`Slide ${currentImageIdx}`}
                className="w-full h-96 object-contain rounded-md"
              />
              <button
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-3xl"
                onClick={handlePrevImage}
              >
                &#8592;
              </button>
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-3xl"
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
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Videos</h2>
          {issue.videos.map((vid, idx) => (
            <video
              key={idx}
              src={vid}
              controls
              className="w-full h-64 rounded-md"
            />
          ))}
        </div>
      )}

      {/* Upvotes / Downvotes (View Only) */}
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 bg-green-500 text-white rounded-md">
          Upvotes: {issue.upvotes?.length || 0}
        </div>
        <div className="px-4 py-2 bg-red-500 text-white rounded-md">
          Downvotes: {issue.downvotes?.length || 0}
        </div>
      </div>

      {/* Comments (View Only) */}
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Comments</h2>
        <div className="space-y-2">
          {issue.comments && issue.comments.length > 0 ? (
            issue.comments.map((c) => (
              <div
                key={c._id}
                className="border border-gray-200 rounded-md p-2 bg-gray-50"
              >
                <p className="text-gray-700">{c.content}</p>
                <p className="text-xs text-gray-500">
                  By {c.user.name} on {new Date(c.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No comments yet.</p>
          )}
        </div>
      </div>

      {/* Municipality Action: Take Up Issue */}
      {issue.status === "Open" && !issue.issueTakenUpBy && (
        <div className="mt-6 space-y-2 border-t border-gray-300 pt-4">
          <h2 className="text-xl font-semibold">Take Up Issue</h2>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
            min={new Date().toISOString().split("T")[0]} // prevent past dates
          />
          <button
            onClick={handleTakeUpIssue}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Take Up & Set Deadline
          </button>
        </div>
      )}

      {/* Municipality Action: Assign Staff */}
{issue.issueTakenUpBy && issue.issueTakenUpBy._id === user._id && (
  <div className="mt-6 space-y-2 border-t border-gray-300 pt-4">
    <h2 className="text-xl font-semibold">Assign Staff</h2>
    <input
      type="text"
      placeholder="Role Name"
      value={roleName}
      onChange={(e) => setRoleName(e.target.value)}
      className="border border-gray-300 rounded-md px-3 py-2 w-full"
    />
    <input
      type="email"
      placeholder="Staff Email"
      value={staffEmail}
      onChange={(e) => setStaffEmail(e.target.value)}
      className="border border-gray-300 rounded-md px-3 py-2 w-full"
    />
    <button
      onClick={handleAssignStaff}
      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
    >
      Assign Staff
    </button>

    {/* Display assigned staff */}
    <div className="mt-4 space-y-2">
      <h3 className="font-semibold text-lg">Assigned Staff</h3>
      {issue.staffsAssigned && issue.staffsAssigned.length > 0 ? (
        issue.staffsAssigned.map((s, idx) => (
          <div
            key={idx}
            className="p-2 bg-gray-100 rounded-md border border-gray-200"
          >
            <p>
              <strong>Role:</strong> {s.role}
            </p>
            <p>
              <strong>Name:</strong> {s.user?.name || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {s.user?.email || "N/A"}
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No staff assigned yet.</p>
      )}
    </div>
  </div>
)}

    </div>
  );
}

export default IssueDetailsMunicipality;

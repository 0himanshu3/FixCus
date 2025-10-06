import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { app } from "../firebase"; // Ensure you have this file configured
import Timeline from "./Timeline";

function IssueDetails() {
  const { slug } = useParams();
  const [issue, setIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [showImageSlider, setShowImageSlider] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const { user, isAuthenticated } = useSelector((state) => state.auth); // State for the new Feedback Modal

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    resolved: "",
    resolutionTime: "",
    resolutionQuality: "",
    staffProfessionalism: "",
    satisfactionRating: 5,
    takenSeriously: "",
    clearCommunication: "",
    suggestions: "",
    futureTrust: "",
    useSystemAgain: "",
    additionalComments: "",
  });
  const [feedbackFiles, setFeedbackFiles] = useState([]);
  const [feedbackUploadProgress, setFeedbackUploadProgress] = useState([]);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

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

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const originalOverflow = window.getComputedStyle(document.body).overflow;
    if (isFeedbackModalOpen || showImageSlider || isTimelineModalOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFeedbackModalOpen, showImageSlider, isTimelineModalOpen]);

  const uploadFilesToFirebase = async (files, setProgress) => {
    if (!files || files.length === 0) return [];
    const storage = getStorage(app);
    const urls = [];
    const progressArr = Array(files.length).fill(0);
    setProgress(progressArr);

    await Promise.all(
      files.map((file, idx) => {
        const fileRef = ref(storage, `feedback/${Date.now()}-${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);
        return new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const pct = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              progressArr[idx] = pct;
              setProgress([...progressArr]);
            },
            (err) => reject(err),
            async () => {
              try {
                const downloadUrl = await getDownloadURL(
                  uploadTask.snapshot.ref
                );
                urls.push(downloadUrl);
                resolve();
              } catch (e) {
                reject(e);
              }
            }
          );
        });
      })
    );

    setTimeout(() => setProgress([]), 600);
    return urls;
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackData.resolved || !feedbackData.satisfactionRating) {
      return alert("Please fill out all required feedback fields.");
    }
    setIsSubmittingFeedback(true);
    try {
      const imageUrls = await uploadFilesToFirebase(
        feedbackFiles,
        setFeedbackUploadProgress
      );
      const res = await fetch(`http://localhost:3000/api/v1/issues/submitFeedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          issueId: issue._id,
          ...feedbackData,
          photos: imageUrls,
        }),
      });

      if (res.ok) {
        alert("Thank you for your feedback!");
        setIsFeedbackModalOpen(false);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit feedback.");
      }
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleUpvote = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/issues/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ issueId: issue._id }),
      });
      if (res.ok) fetchIssue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownvote = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/issues/downvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ issueId: issue._id }),
      });
      if (res.ok) fetchIssue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await fetch(`http://localhost:3000/api/v1/issues/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ issueId: issue._id, content: comment }),
      });
      if (res.ok) {
        setComment("");
        fetchIssue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingContent.trim()) return;
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/issues/comment/${commentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: editingContent }),
        }
      );
      if (res.ok) {
        setEditingCommentId(null);
        setEditingContent("");
        fetchIssue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/issues/comment/${commentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (res.ok) fetchIssue();
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
            <p className="text-gray-500">Issue not found.</p>  {" "}
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-pink-400 to-pink-300 rounded-2xl p-6 shadow-2xl border-4 border-purple-600">
          <h1 className="text-4xl font-black text-purple-900 tracking-tight overflow-hidden">
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

        <div className="mt-4 p-5 bg-pink-200 border-4 border-purple-500 text-purple-900 rounded-lg shadow-md">
        <h3 className="font-bold text-2xl mb-3 text-pink-700 flex items-center gap-2">📝 Description</h3>
        <p className="text-base whitespace-pre-line font-medium">
          {issue.content || "No additional details provided."}
        </p>
      </div>


        <div className="bg-pink-200 rounded-xl p-5 shadow-lg border-4 border-purple-500">
          <ul className="space-y-1 text-purple-900 font-semibold text-lg">
            <li>
              <strong className="text-purple-700">📍 Location:</strong> {issue.issueDistrict}, {issue.issueState}, {issue.issueCountry}
            </li>
            <li>
              <strong className="text-purple-700">📅 Published:</strong> {new Date(issue.issuePublishDate).toLocaleDateString()}
            </li>
            {issue.deadline && <li>
              <strong className="text-purple-700">🕒 Deadline:</strong> {new Date(issue.deadline).toLocaleDateString()}
            </li>}
          </ul>
        </div>

        {issue.images && issue.images.length > 0 && (
          <div className="bg-gradient-to-br from-pink-300 to-pink-200 rounded-xl p-5 shadow-xl border-4 border-purple-600">
            <h2 className="text-2xl font-black text-purple-900 mb-4 overflow-hidden">
              🎨 Images
            </h2>
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
                className="mt-4 px-6 py-3 bg-purple-700 text-pink-100 rounded-full font-bold hover:bg-purple-800 shadow-lg border-2 border-pink-300 transform hover:scale-105 transition-all">
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
              onClick={() => setShowImageSlider(false)}>
              <button
                className="absolute top-5 right-5 text-pink-300 text-5xl hover:text-pink-100 font-bold"
                onClick={() => setShowImageSlider(false)}>
                &times;
              </button>

              <div className="relative w-4/5 max-w-3xl" onClick={(e) => e.stopPropagation()}>
                <img
                  src={issue.images[currentImageIdx]}
                  alt={`Slide ${currentImageIdx}`}
                  className="w-full h-96 object-contain rounded-xl border-4 border-pink-400 shadow-2xl"
                />
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-300 text-5xl hover:text-pink-100 bg-purple-800/50 rounded-full w-14 h-14 flex items-center justify-center"
                  onClick={handlePrevImage}>
                  &#8592;
                </button>
                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-pink-300 text-5xl hover:text-pink-100 bg-purple-800/50 rounded-full w-14 h-14 flex items-center justify-center"
                  onClick={handleNextImage}>
                  &#8594;
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {issue.videos && issue.videos.length > 0 && (
          <div className="bg-gradient-to-br from-pink-300 to-pink-200 rounded-xl p-5 shadow-xl border-4 border-purple-600">
            <h2 className="text-2xl font-black text-purple-900 mb-4 overflow-hidden">
              🎬 Videos
            </h2>
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

        <div className="flex items-center gap-4 justify-center">
          <button
            onClick={handleUpvote}
            className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full font-black text-lg shadow-xl border-4 border-purple-600 hover:scale-105 transform transition-all">
            👍 Upvote ({issue.upvotes?.length || 0})
          </button>
          <button
            onClick={handleDownvote}
            className="px-6 py-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-full font-black text-lg shadow-xl border-4 border-purple-600 hover:scale-105 transform transition-all">
            👎 Downvote ({issue.downvotes?.length || 0})
          </button>
        </div>

        {/* Timeline Button */}
        <div className="text-center">
          <button
            onClick={() => setIsTimelineModalOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-pink-100 font-black text-lg rounded-full shadow-lg hover:from-purple-700 hover:to-purple-800 border-4 border-pink-400 transform hover:scale-105 transition-all">
            📅 View Issue Timeline
          </button>
        </div>

        <div className="bg-pink-200 rounded-xl p-5 shadow-xl border-4 border-purple-600">
          <h2 className="text-2xl font-black text-purple-900 mb-4 overflow-hidden">
            💬 Comments
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-grow border-4 border-purple-500 rounded-lg px-4 py-3 font-semibold text-purple-900 focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
            />
            <button
              onClick={handleAddComment}
              className="px-6 py-3 bg-purple-700 text-pink-100 rounded-full font-bold hover:bg-purple-800 shadow-md border-2 border-pink-300 transform hover:scale-105 transition-all">
              💬 Comment
            </button>
          </div>

          <div className="space-y-3">
            {issue.comments && issue.comments.length > 0 ? (
              issue.comments.map((c) => (
                <div
                  key={c._id}
                  className="bg-white rounded-lg p-4 shadow-md border-2 border-pink-400 flex justify-between items-start">
                  {editingCommentId === c._id ? (
                    <div className="flex-grow space-y-2">
                      <input
                        type="text"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full border-2 border-purple-500 rounded-lg px-3 py-2 font-semibold text-purple-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-300"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditComment(c._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 shadow-md border-2 border-purple-300">
                          ✅ Save
                        </button>
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="px-3 py-1 bg-gray-300 text-purple-900 rounded-full font-bold hover:bg-gray-400 border-2 border-purple-300">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow">
                      <p className="text-purple-900 font-semibold">
                        {c.content}
                      </p>
                      <p className="text-sm text-purple-600 mt-2">
                        🎪 By {c.user.name} on{" "}
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {c.user._id === user._id && editingCommentId !== c._id && (
                    <div className="flex flex-col gap-1 ml-2">
                      <button
                        onClick={() => {
                          setEditingCommentId(c._id);
                          setEditingContent(c.content);
                        }}
                        className="text-purple-700 text-sm font-bold hover:text-purple-900">
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="text-red-600 text-sm font-bold hover:text-red-800">
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-purple-700 font-semibold">No comments yet.</p>
            )}
          </div>
        </div>

        {issue.status === "Resolved" && (
          <div className="bg-gradient-to-r from-pink-300 to-pink-200 rounded-xl p-6 shadow-xl border-4 border-purple-600 text-center">
            <h2 className="text-2xl font-black text-purple-900 mb-3 overflow-hidden">
              🎊 Resolution Feedback
            </h2>
            <p className="text-purple-800 font-semibold mb-4">
              Your feedback is valuable for improving our services.
            </p>
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="px-8 py-4 bg-purple-700 text-pink-100 font-black text-lg rounded-full shadow-lg hover:bg-purple-800 border-4 border-pink-400 transform hover:scale-105 transition-all">
              ⭐ Leave Feedback on Resolution
            </button>
          </div>
        )}

        <AnimatePresence>
          {isFeedbackModalOpen && (
            <motion.div
              key="feedback-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-purple-900/95 z-50 overflow-y-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
              onClick={() => setIsFeedbackModalOpen(false)}>
              <div className="min-h-screen px-4 py-8 flex items-center justify-center">
                <div
                  className="bg-gradient-to-br from-pink-200 to-pink-300 p-6 rounded-2xl shadow-2xl w-full max-w-2xl relative border-4 border-purple-600"
                  style={{
                    maxHeight: "calc(100vh - 4rem)",
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                    overscrollBehavior: "contain",
                  }}
                  onClick={(e) => e.stopPropagation()}>
                  <button
                    className="absolute top-3 right-4 text-3xl font-black text-purple-900 hover:text-purple-700"
                    onClick={() => setIsFeedbackModalOpen(false)}>
                    &times;
                  </button>
                  <h3 className="text-2xl font-black text-purple-900 mb-4 overflow-hidden">
                    🎪 Resolution Feedback
                  </h3>

                  <div className="space-y-6">
                    <FeedbackSection title="Resolution Experience">
                      <RadioGroup
                        label="Was the issue resolved?"
                        name="resolved"
                        options={["Yes", "Partially", "No"]}
                        feedbackData={feedbackData}
                        setFeedbackData={setFeedbackData}
                      />
                      <RadioGroup
                        label="Time taken to resolve the issue"
                        name="resolutionTime"
                        options={[
                          "Very fast",
                          "Acceptable",
                          "Too slow",
                          "Still pending",
                        ]}
                        feedbackData={feedbackData}
                        setFeedbackData={setFeedbackData}
                      />
                      <RadioGroup
                        label="Quality of resolution"
                        name="resolutionQuality"
                        options={[
                          "Fully satisfactory",
                          "Partially satisfactory",
                          "Unsatisfactory",
                        ]}
                        feedbackData={feedbackData}
                        setFeedbackData={setFeedbackData}
                      />
                      <RadioGroup
                        label="Did officials/staff respond politely and professionally?"
                        name="staffProfessionalism"
                        options={["Yes", "No"]}
                        feedbackData={feedbackData}
                        setFeedbackData={setFeedbackData}
                      />
                    </FeedbackSection>

                    <FeedbackSection title="Citizen Satisfaction">
                      <SelectGroup
                        label="Overall satisfaction with the service (1=Very Poor, 5=Excellent)"
                        name="satisfactionRating"
                        options={[1, 2, 3, 4, 5]}
                        feedbackData={feedbackData}
                        setFeedbackData={setFeedbackData}
                      />
                      <RadioGroup
                        label="Do you feel your complaint was taken seriously?"
                        name="takenSeriously"
                        options={["Yes", "No", "To some extent"]}
                        feedbackData={feedbackData}
                        setFeedbackData={setFeedbackData}
                      />
                      <RadioGroup
                        label="Was communication about progress clear?"
                        name="clearCommunication"
                        options={["Yes", "No"]}
                        feedbackData={feedbackData}
                        setFeedbackData={setFeedbackData}
                      />
                      <TextArea
                        label="Suggestions for improvement"
                        name="suggestions"
                        feedbackData={feedbackData}
                        setFeedbackData={setFeedbackData}
                      />
                    </FeedbackSection>

                    <FeedbackSection title="Transparency & Trust">
                      <RadioGroup
                        label="Do you trust the municipality to resolve issues in the future?"
                        name="futureTrust"
                        options={["Yes", "No", "Not sure"]}
                        feedbackData={feedbackData}
                        setFeedbackData={setFeedbackData}
                      />
                      <RadioGroup
                        label="Would you use this complaint system again?"
                        name="useSystemAgain"
                        options={["Yes", "No"]}
                        feedbackData={feedbackData}
                        setFeedbackData={setFeedbackData}
                      />
                    </FeedbackSection>

                    <FeedbackSection title="Additional Feedback">
                      <TextArea
                        label="Additional comments"
                        name="additionalComments"
                        feedbackData={feedbackData}
                        setFeedbackData={setFeedbackData}
                      />
                      <div>
                        <label className="block text-sm font-bold text-purple-900 mb-2">
                          📸 Upload additional photos (optional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) =>
                            setFeedbackFiles(Array.from(e.target.files))
                          }
                          className="w-full text-sm text-purple-900 font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-2 file:border-purple-500 file:text-sm file:font-bold file:bg-pink-100 file:text-purple-900 hover:file:bg-pink-200"
                        />
                        {feedbackUploadProgress.length > 0 && (
                          <div className="mt-2 text-xs text-purple-800 font-semibold bg-white p-2 rounded border-2 border-purple-300">
                            {feedbackUploadProgress.map((p, i) => (
                              <div key={i}>
                                Uploading file {i + 1}: {p}%
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FeedbackSection>
                  </div>

                  <div className="flex justify-end gap-4 mt-6 pt-4 border-t-2 border-purple-500">
                    <button
                      onClick={() => setIsFeedbackModalOpen(false)}
                      className="px-4 py-2 bg-gray-300 text-purple-900 rounded-full font-bold border-2 border-purple-500 hover:bg-gray-400">
                      Cancel
                    </button>
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={isSubmittingFeedback}
                      className="px-4 py-2 bg-purple-700 text-pink-100 rounded-full font-bold border-2 border-pink-400 hover:bg-purple-800 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed">
                      {isSubmittingFeedback
                        ? "Submitting..."
                        : "✅ Submit Feedback"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline Modal */}
        <Timeline 
          issueId={issue._id} 
          isOpen={isTimelineModalOpen} 
          onClose={() => setIsTimelineModalOpen(false)} 
        />
      </div>
    </div>
  );
}

// Helper components for the modal form to keep the main component clean
const FeedbackSection = ({ title, children }) => (
  <div className="p-4 border border-gray-200 rounded-lg">
      <h4 className="text-lg font-semibold mb-3 text-gray-800">{title}</h4> {" "}
    <div className="space-y-3">{children}</div>{" "}
  </div>
);

const RadioGroup = ({
  label,
  name,
  options,
  feedbackData,
  setFeedbackData,
}) => (
  <div>
     {" "}
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {" "}
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
        {" "}
      {options.map((option) => (
        <label key={option} className="flex items-center space-x-2 text-sm">
              {" "}
          <input
            type="radio"
            name={name}
            value={option}
            checked={feedbackData[name] === option}
            onChange={(e) =>
              setFeedbackData({ ...feedbackData, [name]: e.target.value })
            }
            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
          />
               <span>{option}</span>   {" "}
        </label>
      ))}
       {" "}
    </div>
    {" "}
  </div>
);

const SelectGroup = ({
  label,
  name,
  options,
  feedbackData,
  setFeedbackData,
}) => (
  <div>
     {" "}
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {" "}
    <select
      name={name}
      value={feedbackData[name]}
      onChange={(e) =>
        setFeedbackData({ ...feedbackData, [name]: Number(e.target.value) })
      }
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
        {" "}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
       {" "}
    </select>
    {" "}
  </div>
);

const TextArea = ({ label, name, feedbackData, setFeedbackData }) => (
  <div>
     {" "}
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
     {" "}
    <textarea
      id={name}
      name={name}
      rows={3}
      value={feedbackData[name]}
      onChange={(e) =>
        setFeedbackData({ ...feedbackData, [name]: e.target.value })
      }
      className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"></textarea>
    {" "}
  </div>
);

export default IssueDetails;

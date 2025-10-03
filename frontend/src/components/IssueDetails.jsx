import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";

function IssueDetails() {
  const { slug } = useParams();
  const [issue, setIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [showImageSlider, setShowImageSlider] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
   const {user,isAuthenticated}= useSelector((state)=>state.auth)
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

     {/* Upvote / Downvote */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleUpvote}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Upvote ({issue.upvotes?.length || 0})
        </button>
        <button
          onClick={handleDownvote}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Downvote ({issue.downvotes?.length || 0})
        </button>
      </div>

      {/* Comments */}
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Comments</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-grow border border-gray-300 rounded-md px-3 py-2"
          />
          <button
            onClick={handleAddComment}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Comment
          </button>
        </div>

        <div className="space-y-2">
          {issue.comments && issue.comments.length > 0 ? (
            issue.comments.map((c) => (
              <div
                key={c._id}
                className="border border-gray-200 rounded-md p-2 bg-gray-50 flex justify-between items-start"
              >
                {editingCommentId === c._id ? (
                  <div className="flex-grow space-y-2">
                    <input
                      type="text"
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditComment(c._id)}
                        className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="px-2 py-1 bg-gray-300 text-black rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow">
                    <p className="text-gray-700">{c.content}</p>
                    <p className="text-xs text-gray-500">
                      By {c.user.name} on{" "}
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
                      className="text-blue-600 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComment(c._id)}
                      className="text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No comments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default IssueDetails;

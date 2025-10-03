import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Issues() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("http://localhost:3000/api/v1/issues/all", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          console.log(data);
          setIssues(data.issues || []);
        } else {
          console.error("Error:", res.status, res.statusText);
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, []);

  const handleAddIssue = () => {
    navigate("/create");
  };

  const handleViewIssue = (slug) => {
    navigate(`/event/${slug}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Issues</h1>
        <button
          onClick={handleAddIssue}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg shadow transition-colors duration-200 flex items-center gap-2"
        >
          Publish Issue
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="mt-4 text-lg font-medium text-gray-900">No issues found</h3>
          <p className="mt-2 text-gray-500">Get started by creating your first issue.</p>
          <button
            onClick={handleAddIssue}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Publish Issue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {issues.map((event) => (
            <motion.div
              key={event._id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300 group flex flex-col"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {event.image ? (
                <div className="h-48 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              <div className="p-6 flex-grow">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                  {event.title}
                </h2>

                {event.category && (
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    {event.category}
                  </span>
                )}

                <p className="text-sm text-gray-500 mb-2">
                  <strong>Priority:</strong> {event.priority}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  <strong>Status:</strong> {event.status}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  <strong>Location:</strong> {event.eventLocation}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  <strong>Published:</strong>{" "}
                  {new Date(event.issuePublishDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  <strong>Donation:</strong> ₹{event.donation}
                </p>

                <div
                  className="text-gray-600 text-base leading-relaxed mb-4 line-clamp-3"
                  dangerouslySetInnerHTML={{
                    __html: event?.content
                      ? event.content.split(" ").slice(0, 30).join(" ") + "..."
                      : "",
                  }}
                />
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={() => handleViewIssue(event.slug)}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Issues;

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector } from "react-redux"; // ✅ to get logged in user

const priorityLevels = ["Very Low", "Low", "Medium", "High", "Critical"];
const issueCategories = [
  "Education & Skill Development",
  "Sports & Cultural Events",
  "Health & Well-being",
  "Women Empowerment",
  "Environmental Sustainability",
  "Social Inclusion & Awareness",
];
const statusOptions = ["Open", "In Progress", "Resolved"];

function IssuesMunicipality() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const adminDistrict = user?.district || null;  

  const [filters, setFilters] = useState({
    title: searchParams.get("title") || "",
    category: searchParams.get("category") || "",
    priority: searchParams.get("priority") || "",
    status: searchParams.get("status") || "",
    recency: searchParams.get("recency") || "",
  });

  const fetchFilteredIssues = async (appliedFilters) => {
  setIsLoading(true);
  try {
    const query = new URLSearchParams();

    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });

    if (adminDistrict) {
      query.append("district", adminDistrict);
    }

    const res = await fetch(
      `http://localhost:3000/api/v1/issues/all?${query.toString()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

    if (res.ok) {
      const data = await res.json();

      const validIssues = (data.issues || []).filter(
        (issue) => issue.issueDistrict &&
          issue.issueDistrict.trim() !== "" &&
          issue.issueDistrict === adminDistrict
      );

      setIssues(validIssues);
    } else {
      console.error("Error fetching issues:", res.statusText);
    }
  } catch (error) {
    console.error("Error fetching issues:", error);
  } finally {
    setIsLoading(false);
  }
};


  useEffect(() => {
    if (adminDistrict) {
      fetchFilteredIssues(filters);
    }
  }, [adminDistrict]); // wait until user is loaded


  const handleViewIssue = (slug) => navigate(`/issue/${slug}`);

  const handleApplyFilters = () => {
    setSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
    );
    fetchFilteredIssues(filters);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      title: "",
      category: "",
      priority: "",
      status: "",
      recency: "",
    };
    setFilters(resetFilters);
    setSearchParams({});
    fetchFilteredIssues(resetFilters);
    setIsFilterOpen(false);
  };

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Issues</h1>
          <div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-lg shadow transition-colors duration-200"
            >
              Filter
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No issues found
            </h3>
            <p className="mt-2 text-gray-500">Try adjusting your filters.</p>
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
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => handleViewIssue(event.slug)}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 z-10">
            <h2 className="text-xl font-semibold mb-4">Filter Issues</h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={filters.title}
                onChange={(e) =>
                  setFilters({ ...filters, title: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Categories</option>
                {issueCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Priorities</option>
                {priorityLevels.map((level, idx) => (
                  <option key={idx} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Status</option>
                {statusOptions.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {/* <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              /> */}
              <select
                value={filters.recency}
                onChange={(e) =>
                  setFilters({ ...filters, recency: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Sort by Recency</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IssuesMunicipality;

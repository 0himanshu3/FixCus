import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import IssuesHeatmap from "./IssuesHeatmap";

const priorityLevels = ["Very Low", "Low", "Medium", "High", "Critical"];
const issueCategories = [
    "Road damage",
    "Waterlogging / Drainage Issues",
    "Improper Waste Management",
    "Street lights/Exposed Wires",
    "Unauthorized loudspeakers",
    "Burning of garbage",
    "Encroachment / Illegal Construction",
    "Damaged Public Property",
    "Stray Animal Menace",
    "General Issue"
  ];
const statusOptions = ["Open", "In Progress", "Resolved"];

function IssuesMunicipality() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);

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
    const priorityValues = {
      "Very Low": 0,
      "Low": 1,
      "Medium": 2,
      "High": 3,
      "Critical": 4,
    };

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
          (issue) =>
            issue.issueDistrict &&
            issue.issueDistrict.trim() !== "" &&
            issue.issueDistrict === adminDistrict
        );

        const isAnyFilterActive = Object.values(appliedFilters).some(value => !!value);

        let finalIssues;
        if (isAnyFilterActive) {
          finalIssues = validIssues;
        } else {
          finalIssues = validIssues.sort((a, b) => {
            const priorityDifference = priorityValues[b.priority] - priorityValues[a.priority];
            if (priorityDifference !== 0) {
              return priorityDifference;
            }
            return new Date(a.issuePublishDate) - new Date(b.issuePublishDate);
          });
        }

        setIssues(finalIssues);

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
    if (adminDistrict) fetchFilteredIssues(filters);
  }, [adminDistrict]);

  const handleApplyFilters = () => {
    setSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
    );
    fetchFilteredIssues(filters);
    setIsFilterOpen(false);
  };
  const handleViewIssue = (slug) => navigate(`/issue/${slug}`);

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
const fetchAllIssuesForHeatmap = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/v1/issues/all",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();
        setAllIssuesForHeatmap(data.issues || []);
      } else {
        console.error("Error fetching all issues for heatmap:", res.statusText);
      }
    } catch (error) {
      console.error("Error fetching all issues for heatmap:", error);
    }
  };
  const handleHeatmapOpen = () => setIsHeatmapOpen(true);

  return (
  <div className="relative min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-r from-pink-400 to-pink-300 rounded-2xl p-6 shadow-2xl border-4 border-purple-600 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-4xl font-black text-purple-900 overflow-hidden">🎪 All Issues</h1>
          <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-pink-100 py-2 px-6 rounded-full shadow-lg font-bold border-2 border-pink-300 transition-all duration-200 will-change-transform"
            >
              🔍 Filter
            </button>

            <button
              onClick={handleHeatmapOpen}
              className="bg-pink-500 hover:bg-pink-600 text-white py-2 px-6 rounded-full shadow-lg font-bold border-2 border-purple-300 transition-all duration-200 will-change-transform"
            >
              🗺 View Heatmap
            </button>
          </div>

          {/* <button
            onClick={() => window.location.assign("demo.html")}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg shadow transition-colors duration-200"
          >
            Demo
          </button> */}
        </div>
       

        </div>
      </div>

      

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-400"></div>
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl border-4 border-purple-600 shadow-xl">
          <h3 className="mt-4 text-2xl font-black text-purple-900">
            🎭 No issues found
          </h3>
          <p className="mt-2 text-purple-800 font-semibold">
            Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {issues.map((event) => (
            <motion.div
              key={event._id}
              className="relative bg-gradient-to-br from-yellow-100 to-pink-200 rounded-2xl shadow-xl border-8 border-double border-purple-700 hover:shadow-2xl transition-shadow duration-300 overflow-hidden group"
              whileTap={{ scale: 0.98 }}
            >
              {/* Shimmer overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none"></div>

              {/* Animated corner decorations */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-pink-500 rounded-tl-2xl group-hover:border-yellow-400 transition-all duration-300 animate-pulse"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-pink-500 rounded-tr-2xl group-hover:border-yellow-400 transition-all duration-300 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-pink-500 rounded-bl-2xl group-hover:border-yellow-400 transition-all duration-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-pink-500 rounded-br-2xl group-hover:border-yellow-400 transition-all duration-300 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              
              {/* Priority ribbon with hover bounce */}
              <div className="absolute top-6 -left-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-1 font-black text-xs shadow-lg transform -rotate-12 border-2 border-red-800 group-hover:scale-110 transition-transform duration-300">
                ⚡ {event.priority}
              </div>
              
              {/* Status badge with hover bounce */}
              <div className="absolute top-6 -right-2 bg-purple-700 text-yellow-300 px-6 py-1 font-black text-xs shadow-lg transform rotate-12 border-2 border-yellow-300 group-hover:scale-110 transition-transform duration-300">
                {event.status}
              </div>
              
              <div className="p-8 pt-12">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="text-xs font-black text-purple-700 tracking-widest mb-1">MUNICIPAL ISSUE</div>
                  <h2 className="text-3xl font-black text-purple-900 overflow-hidden uppercase leading-tight group-hover:text-pink-700 transition-colors duration-300 truncate" style={{ textShadow: '2px 2px 0px rgba(236, 72, 153, 0.3)' }}>
                    {event.title}
                  </h2>
                  <div className="text-xs font-black text-purple-700 tracking-widest mt-1">━━ COMPLAINT REPORT ━━</div>
                </div>
                
                {/* Category badge with glow */}
                {event.category && (
                  <div className="text-center mb-4 overflow-hidden">
                    <span className="inline-block bg-purple-700 text-yellow-300 text-sm font-black px-5 py-2 rounded-full border-4 border-yellow-300 uppercase shadow-lg group-hover:shadow-yellow-300/50 transition-shadow duration-300">
                      🎪 {event.category}
                    </span>
                  </div>
                )}
                
                {/* Info box with border color change */}
                <div className="bg-white/70 rounded-lg p-4 mb-4 border-4 border-purple-500 shadow-inner group-hover:border-pink-500 group-hover:bg-white/90 transition-all duration-300">
                  <div className="space-y-2 text-sm text-purple-900 font-bold">
                    <p className="flex items-center justify-between">
                      <span>📍 DISTRICT:</span>
                      <span className="text-right">{event.issueDistrict}</span>
                    </p>
                    <div className="border-t-2 border-dashed border-purple-300"></div>
                    <p className="flex items-center justify-between">
                      <span>📅 REPORTED:</span>
                      <span>{new Date(event.issuePublishDate).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                
                {/* Button with gradient animation */}
                <div className="overflow-hidden">
                  <button
                    onClick={() => handleViewIssue(event.slug)}
                    className="w-full bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 text-yellow-300 py-4 rounded-full font-black shadow-lg border-4 border-yellow-300 uppercase text-lg tracking-wider hover:brightness-110 hover:shadow-yellow-300/50 transition-all duration-300 will-change-transform relative overflow-hidden group"
                  >
                    <span className="relative z-10 cursor-pointer">VIEW ISSUE DETAILS</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                  </button>
                </div>
              </div>
              
              {/* Ticket stub ID with bounce */}
              <div className="absolute bottom-2 right-2 bg-purple-900 text-yellow-300 px-2 py-1 rounded font-black text-xs border border-yellow-300 group-hover:scale-110 transition-transform duration-300">
                #{event._id.slice(-6).toUpperCase()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>

    {/* Heatmap Modal */}
    <IssuesHeatmap show={isHeatmapOpen} onClose={() => setIsHeatmapOpen(false)} />

    {/* Filter Modal */}
    {isFilterOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-purple-900/90 backdrop-blur-sm"
          onClick={() => setIsFilterOpen(false)}
        />

        <div className="relative bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 border-4 border-purple-600">
          <h2 className="text-2xl font-black text-purple-900 mb-4 overflow-hidden">🔍 Filter Issues</h2>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={filters.title}
              onChange={(e) =>
                setFilters({ ...filters, title: e.target.value })
              }
              className="w-full border-4 border-purple-500 rounded-lg px-4 py-3 font-semibold text-purple-900 focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
            />

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="w-full border-4 border-purple-500 rounded-lg px-4 py-3 font-semibold text-purple-900 focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
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
              className="w-full border-4 border-purple-500 rounded-lg px-4 py-3 font-semibold text-purple-900 focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
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
              className="w-full border-4 border-purple-500 rounded-lg px-4 py-3 font-semibold text-purple-900 focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
            >
              <option value="">All Status</option>
              {statusOptions.map((s, idx) => (
                <option key={idx} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filters.recency}
              onChange={(e) =>
                setFilters({ ...filters, recency: e.target.value })
              }
              className="w-full border-4 border-purple-500 rounded-lg px-4 py-3 font-semibold text-purple-900 focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
            >
              <option value="">Sort by Recency</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className="flex justify-end mt-6 gap-3 overflow-hidden">
            <button
              onClick={handleResetFilters}
              className="px-6 py-2 bg-gray-300 text-purple-900 rounded-full font-bold border-2 border-purple-500 hover:bg-gray-400 transition-all duration-200 will-change-transform"
            >
              🔄 Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-purple-700 text-pink-100 rounded-full font-bold border-2 border-pink-400 hover:bg-purple-800 shadow-md transition-all duration-200 will-change-transform"
            >
              ✅ Apply
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

}

export default IssuesMunicipality;
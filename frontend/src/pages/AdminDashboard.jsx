import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaRupeeSign, FaUsers, FaBuilding, FaFilter, FaHandHoldingHeart, FaSignOutAlt, FaCheckCircle, FaTasks, FaUserFriends, FaFileAlt, FaInfoCircle, FaComments } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
   const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [completedIssues, setCompletedIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueDetails, setIssueDetails] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMunicipalities: 0,
  });

  const handleLogout = async () => {
    try {
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const fetchUsers = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/v1/auth/getusers', {
      withCredentials: true
    });
    setUsers(res.data.users || []);
    setStats(prev => ({ ...prev, totalUsers: res.data.users.length }));
  } catch (err) {
    console.error('Error fetching users:', err);
    setUsers([]);
  }
};


const fetchMunicipalities = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/v1/auth/getmunicipalities', {
      withCredentials: true
    });
    setMunicipalities(res.data.users || []);
    setStats(prev => ({
      ...prev,
      totalMunicipalities: res.data.users.length
    }));
  } catch (err) {
    console.error('Error fetching Municipalities:', err);
    setMunicipalities([]);
  }
};


  const fetchCompletedIssues = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/v1/issues/completed-issues`, { withCredentials: true });
      setCompletedIssues(res.data.issues || []);
    } catch (err) {
      console.error('Error fetching completed issues:', err);
      setCompletedIssues([]);
    }
  };

  const fetchIssueDetails = async (issueId) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/v1/issue/issue-details/${issueId}`, { withCredentials: true });
      setIssueDetails(res.data.issue);
    } catch (err) {
      console.error('Error fetching issue details:', err);
    }
  };



  const generateAiReport = async (issueId) => {
    try {
      // const res = await axios.post(`http://localhost:3000/api/v1/admin/generate-feedback-report`, 
      //   { issueId },
      //   { withCredentials: true }
      // );
      setAiReport({});
      setShowReportModal(true);
    } catch (err) {
      console.error('Error generating AI report:', err);
      toast.error('Failed to generate report');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUsers(), 
          fetchMunicipalities(),
          fetchCompletedIssues()
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

 
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-blue-900"
        >
          Admin Dashboard
        </motion.h1>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 flex items-center rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <FaSignOutAlt className="mr-2" />
          Logout
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-2 rounded-full ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('completed-issues')}
          className={`px-6 py-2 rounded-full ${
            activeTab === 'completed-issues'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Completed Issues
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Stat Cards */}
          <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<FaUsers className="mr-4" />}
              color="from-green-600 to-green-400"
            />
            <StatCard
              title="Total Municipalities"
              value={stats.totalMunicipalities}
              icon={<FaBuilding className="mr-4" />}
              color="from-purple-600 to-purple-400"
            />
          </div>

            {/* Users Table */}
          <DataTable
            title="All Users"
            icon={<FaUsers className="mr-2" />}
            data={users}
            columns={[
              { label: 'Name', key: 'name' },
              { label: 'Email', key: 'email' },
              { label: 'District', key: 'district' }
            ]}
          />

          {/* Municipalities Table */}
          <DataTable
            title="All Municipalities"
            icon={<FaBuilding className="mr-2" />}
            data={municipalities}
            columns={[
              { label: 'Name', key: 'name' },
              { label: 'Email', key: 'email' },
              { label: 'District', key: 'issuedistrict' },
              
            ]}
          />
        </>
      ) : (
        <div className="mt-8">
          <div className="flex space-x-4">
            {/* Vertical Tabs */}
            <div className="w-1/4 bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">Completed Issues</h3>
              <div className="space-y-2">
                {completedIssues.map((issue) => (
                  <button
                    key={issue._id}
                    onClick={() => setSelectedIssue(issue)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedIssue?._id === issue._id
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium truncate">{issue.title}</p>
                    <p className="text-sm text-gray-500 truncate">{issue.issueDistrict}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Issue Details and Actions */}
            <div className="w-3/4 bg-white rounded-lg shadow-md p-6">
              {selectedIssue ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedIssue.title}</h2>
                      <p className="text-gray-600">{selectedIssue.issueDistrict}</p>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          setSelectedIssue(selectedIssue);
                          fetchIssueDetails(selectedIssue._id);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                      >
                        <FaInfoCircle className="mr-2" />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedIssue(selectedIssue);
                          fetchIssueFeedback(selectedIssue._id);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                      >
                        <FaComments className="mr-2" />
                        View Feedback
                      </button>
                      <button
                        onClick={() => generateAiReport(selectedIssue._id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                      >
                        <FaFileAlt className="mr-2" />
                        Generate Report
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select an issue to view details
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Issue Details Modal */}
      {selectedIssue && issueDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{issueDetails.title}</h3>
              <button
                onClick={() => {
                  setSelectedIssue(null);
                  setIssueDetails(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{issueDetails.issueLocation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Assigned Municipality</p>
                    <p className="font-medium">{issueDetails.assignedTo || 'Not Assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Posted By</p>
                    <p className="font-medium">{issueDetails.postedBy.name}</p>
                    <p className="text-sm text-gray-500">{issueDetails.postedBy.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Engagement</p>
                    <div className="flex space-x-4">
                      <span className="text-green-600">↑ {issueDetails.upvotes}</span>
                      <span className="text-red-600">↓ {issueDetails.downvotes}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {issueDetails.tags.map((tag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{issueDetails.content}</p>
              </div>

              {/* Volunteer Positions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Volunteer Positions</h4>
                <div className="space-y-4">
                  {issueDetails.volunteerPositions.map((pos, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-lg">{pos.position}</h5>
                        <span className="text-sm text-gray-500">
                          {pos.registeredVolunteers.length}/{pos.slots} slots filled
                        </span>
                      </div>
                      <div className="space-y-2">
                        {pos.registeredVolunteers.map((vol, volIndex) => (
                          <div key={volIndex} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                            <div>
                              <p className="font-medium">{vol.name}</p>
                              <p className="text-gray-500">{vol.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Media Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Images */}
                {issueDetails.images?.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Images</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {issueDetails.images.map((img, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={img.url} 
                            alt={img.caption || `Issue image ${index + 1}`} 
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          {img.caption && (
                            <p className="text-sm text-gray-500 mt-1">{img.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {issueDetails.videos?.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Videos</h4>
                    <div className="space-y-4">
                      {issueDetails.videos.map((video, index) => (
                        <div key={index} className="relative">
                          <video 
                            src={video.url} 
                            controls
                            className="w-full rounded-lg"
                          />
                          {video.caption && (
                            <p className="text-sm text-gray-500 mt-1">{video.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

     
      {/* AI Report Modal */}
      {showReportModal && aiReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">AI Analysis Report</h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setAiReport(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              {/* Overall Rating */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Overall Rating</h4>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-blue-600 mr-2">{aiReport.overallRating}</span>
                  <span className="text-blue-600">/10</span>
                </div>
                <p className="text-blue-700 mt-2">{aiReport.resolutionStatus}</p>
              </div>

              {/* Key Highlights */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Key Highlights</h4>
                <ul className="list-disc list-inside space-y-1">
                  {aiReport.keyHighlights.map((highlight, index) => (
                    <li key={index} className="text-green-700">{highlight}</li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Areas for Improvement</h4>
                <ul className="list-disc list-inside space-y-1">
                  {aiReport.areasForImprovement.map((area, index) => (
                    <li key={index} className="text-yellow-700">{area}</li>
                  ))}
                </ul>
              </div>

              {/* Actionable Suggestions */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Actionable Suggestions</h4>
                <ul className="list-disc list-inside space-y-1">
                  {aiReport.actionableSuggestions.map((suggestion, index) => (
                    <li key={index} className="text-purple-700">{suggestion}</li>
                  ))}
                </ul>
              </div>

              {/* Final Verdict */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Final Verdict</h4>
                <p className="text-gray-700">{aiReport.finalVerdict}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Components

const StatCard = ({ title, value, icon, color, rightIcon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gradient-to-r ${color} text-white rounded-xl shadow-lg p-6`}
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="text-lg font-semibold mb-2">{title}</p>
        <div className="text-3xl font-bold flex items-center">{icon}{value}</div>
      </div>
      {rightIcon && rightIcon}
    </div>
  </motion.div>
);

const DataTable = ({ title, icon, data, columns }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="bg-white rounded-xl shadow-md p-6 mb-10"
  >
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-semibold text-blue-800 flex items-center">{icon}{title}</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto text-left">
        <thead>
          <tr className="bg-gray-50">
            {columns.map(col => (
              <th key={col.key} className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item._id} className="hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="px-6 py-4 text-sm text-gray-700">
                  {col.render ? col.render(item[col.key]) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);


const CompletedIssueCard = ({ issue, onViewDetails, onViewFeedback, onGenerateReport }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-xl shadow-md p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-blue-900">{issue.title}</h3>
      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
        Completed
      </span>
    </div>
    <div className="space-y-3">
      <div className="flex items-center text-gray-600">
        <FaUserFriends className="mr-2" />
        <span>{issue.totalVolunteers} Volunteers</span>
      </div>
      <div className="flex items-center text-gray-600">
        <FaBuilding className="mr-2" />
        <span>{issue.MunicipalityName}</span>
      </div>
      <div className="flex items-center text-gray-600">
        <FaTasks className="mr-2" />
        <span>{issue.totalPositions} Positions</span>
      </div>
    </div>
    <div className="mt-6 flex space-x-4">
      <button
        onClick={onViewDetails}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
      >
        <FaInfoCircle className="mr-2" />
        View Details
      </button>
      <button
        onClick={onViewFeedback}
        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
      >
        <FaComments className="mr-2" />
        View Feedback
      </button>
      <button
        onClick={onGenerateReport}
        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
      >
        <FaFileAlt className="mr-2" />
        Generate Report
      </button>
    </div>
  </motion.div>
);

export default AdminDashboard;

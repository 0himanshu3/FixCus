import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaRupeeSign, FaUsers, FaBuilding, FaFilter, FaHandHoldingHeart, FaSignOutAlt, FaCheckCircle, FaTasks, FaUserFriends, FaFileAlt, FaInfoCircle, FaComments } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
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
  const [feedbackList, setFeedbackList] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMunicipalities: 0,
  });

  const states = [...new Set(
  users.map(u => u.state).filter(Boolean)
  .concat(municipalities.map(m => m.state).filter(Boolean))
)];

const districts = selectedState
  ? [...new Set(
      users.filter(u => u.state === selectedState).map(u => u.district).filter(Boolean)
      .concat(municipalities.filter(m => m.state === selectedState).map(m => m.issueDistrict).filter(Boolean))
    )]
  : [];


  // States/Districts derived from completed issues for the Completed tab filters
  const completedStates = [...new Set(completedIssues.map(i => i.issueState).filter(Boolean))];
  const completedDistricts = selectedState
    ? [...new Set(completedIssues.filter(i => i.issueState === selectedState).map(i => i.issueDistrict).filter(Boolean))]
    : [...new Set(completedIssues.map(i => i.issueDistrict).filter(Boolean))];

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
    const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/auth/getusers`, {
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
    const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/auth/getmunicipalities`, {
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
      const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/issues/completed-issues`, { withCredentials: true });
      setCompletedIssues(res.data.issues || []);
    } catch (err) {
      console.error('Error fetching completed issues:', err);
      setCompletedIssues([]);
    }
  };

  const fetchIssueDetails = async (issueId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/issues/issue-details/${issueId}`, { withCredentials: true });
      setIssueDetails(res.data.issue);
    } catch (err) {
      console.error('Error fetching issue details:', err);
    }
  };

  const fetchIssueFeedback = async (issueId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/feedbacks/feedback/${issueId}`, { withCredentials: true });
      setFeedbackList(res.data.feedbacks || []);
      setShowFeedbackModal(true);
    } catch (err) {
      console.error('Error fetching issue feedback:', err);
      setFeedbackList([]);
      setShowFeedbackModal(true);
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
   const filteredUsers = users.filter(u => 
    (!selectedState || u.state === selectedState) &&
    (!selectedDistrict || u.district === selectedDistrict)
  );

  const filteredMunicipalities = municipalities.filter(m =>
    (!selectedState || m.state === selectedState) &&
    (!selectedDistrict || m.issueDistrict === selectedDistrict)
  );
  const filteredCompletedIssues = completedIssues.filter(issue =>
    (!selectedState || issue.issueState === selectedState) &&
    (!selectedDistrict || issue.issueDistrict === selectedDistrict)
  );

return (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 p-8">
    {/* Header - NO LOGOUT BUTTON */}
    <div className="mb-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-black text-yellow-300 overflow-hidden"
        style={{ textShadow: '3px 3px 0px rgba(236, 72, 153, 0.5)' }}
      >
        🎪 Admin Dashboard
      </motion.h1>
    </div>

    {/* Tabs */}
    <div className="flex space-x-4 mb-8 overflow-hidden">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`px-6 py-3 rounded-full font-bold border-2 transition-all duration-200 will-change-transform ${
          activeTab === 'dashboard'
            ? 'bg-pink-500 text-white border-yellow-300 shadow-lg'
            : 'bg-pink-200 text-purple-900 border-purple-500 hover:bg-pink-300'
        }`}
      >
        📊 Dashboard
      </button>
      <button
        onClick={() => setActiveTab('completed-issues')}
        className={`px-6 py-3 rounded-full font-bold border-2 transition-all duration-200 will-change-transform ${
          activeTab === 'completed-issues'
            ? 'bg-pink-500 text-white border-yellow-300 shadow-lg'
            : 'bg-pink-200 text-purple-900 border-purple-500 hover:bg-pink-300'
        }`}
      >
        ✅ Completed Issues
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
            color="from-green-400 to-green-600"
          />
          <StatCard
            title="Total Municipalities"
            value={stats.totalMunicipalities}
            icon={<FaBuilding className="mr-4" />}
            color="from-purple-400 to-purple-600"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-6 overflow-hidden">
          <div>
            <label className="block text-sm font-black text-pink-200 mb-1">🗺️ State</label>
            <select
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); }}
              className="border-4 border-purple-500 rounded-lg px-4 py-2 font-bold text-black focus:border-pink-400 focus:ring-4 focus:ring-pink-300"
            >
              <option value="">All States</option>
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-pink-200 mb-1">📍 District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="border-4 border-purple-500 rounded-lg px-4 py-2 font-bold text-black focus:border-pink-400 focus:ring-4 focus:ring-pink-300"
              disabled={!selectedState}
            >
              <option value="">All Districts</option>
              {districts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table - SCROLLABLE */}
        <DataTable
          title="All Users"
          icon={<FaUsers className="mr-2" />}
          data={filteredUsers}
          columns={[
            { label: 'Name', key: 'name' },
            { label: 'Email', key: 'email' },
            { label: 'District', key: 'district' }
          ]}
        />

        {/* Municipalities Table - SCROLLABLE */}
        <DataTable
          title="All Municipalities"
          icon={<FaBuilding className="mr-2" />}
          data={filteredMunicipalities}
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
          <div className="w-1/4 bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl shadow-xl p-4 border-4 border-purple-600">
            <h3 className="text-xl font-black text-purple-900 mb-4 overflow-hidden">✅ Completed Issues</h3>

            {/* Filter Dropdowns */}
            <div className="mb-4 space-y-2">
              <select
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); }}
                className="w-full p-2 border-4 border-purple-500 rounded-lg font-bold text-purple-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-300"
              >
                <option value="">All States</option>
                {completedStates.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full p-2 border-4 border-purple-500 rounded-lg font-bold text-purple-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-300"
                disabled={selectedState === undefined}
              >
                <option value="">All Districts</option>
                {completedDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* SCROLLABLE ISSUE LIST */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#9333ea #f9a8d4' }}>
              {filteredCompletedIssues.map((issue) => (
                <button
                  key={issue._id}
                  onClick={() => setSelectedIssue(issue)}
                  className={`w-full text-left p-3 rounded-lg font-bold transition-all duration-200 ${
                    selectedIssue?._id === issue._id
                      ? 'bg-purple-700 text-yellow-300 border-2 border-yellow-300'
                      : 'bg-white text-purple-900 border-2 border-purple-400 hover:bg-purple-100'
                  }`}
                >
                  <p className="font-black truncate">{issue.title}</p>
                  <p className="text-sm truncate">📍 {issue.issueDistrict}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Issue Details and Actions */}
          <div className="w-3/4 bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl shadow-xl p-6 border-4 border-purple-600">
            {selectedIssue ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-black text-purple-900 overflow-hidden">{selectedIssue.title}</h2>
                    <p className="text-purple-700 font-bold">📍 {selectedIssue.issueDistrict}</p>
                  </div>
                  <div className="flex space-x-4 overflow-hidden">
                    <button
                      onClick={() => {
                        setSelectedIssue(selectedIssue);
                        fetchIssueDetails(selectedIssue._id);
                      }}
                      className="bg-purple-700 hover:bg-purple-800 text-pink-100 px-4 py-2 rounded-full flex items-center font-bold border-2 border-pink-300 shadow-md transition-all duration-200 will-change-transform"
                    >
                      <FaInfoCircle className="mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedIssue(selectedIssue);
                        fetchIssueFeedback(selectedIssue._id);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full flex items-center font-bold border-2 border-white shadow-md transition-all duration-200 will-change-transform"
                    >
                      <FaComments className="mr-2" />
                      View Feedback
                    </button>
                    <button
                      onClick={() => generateAiReport(selectedIssue._id)}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full flex items-center font-bold border-2 border-purple-700 shadow-md transition-all duration-200 will-change-transform"
                    >
                      <FaFileAlt className="mr-2" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-purple-700 font-bold text-xl">🎭 Select an issue to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Issue Details Modal */}
  {selectedIssue && issueDetails && (
      <div className="fixed inset-0 bg-purple-900/95 flex items-center justify-center p-4 z-50" onClick={() => { setSelectedIssue(null); setIssueDetails(null); }}>
        <div className="bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-600 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-black text-purple-900 overflow-hidden">{issueDetails.title}</h3>
            <button
              onClick={() => {
                setSelectedIssue(null);
                setIssueDetails(null);
              }}
              className="text-3xl font-black text-purple-900 hover:text-purple-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 p-4 rounded-lg border-2 border-purple-400">
              <div className="font-bold text-purple-900 mb-2">Overview</div>
              <div className="text-sm text-purple-800 space-y-1">
                <div><span className="font-semibold">Category:</span> {issueDetails.category}</div>
                <div><span className="font-semibold">Priority:</span> {issueDetails.priority}</div>
                <div><span className="font-semibold">Status:</span> {issueDetails.status}</div>
                <div><span className="font-semibold">Published:</span> {new Date(issueDetails.issuePublishDate).toLocaleString()}</div>
                <div><span className="font-semibold">Location:</span> {issueDetails.issueLocation}</div>
                <div><span className="font-semibold">District:</span> {issueDetails.issueDistrict}</div>
                <div><span className="font-semibold">State:</span> {issueDetails.issueState}</div>
                <div><span className="font-semibold">Country:</span> {issueDetails.issueCountry}</div>
              </div>
            </div>
            <div className="bg-white/80 p-4 rounded-lg border-2 border-purple-400">
              <div className="font-bold text-purple-900 mb-2">Description</div>
              <div className="text-sm text-purple-800 whitespace-pre-wrap">{issueDetails.content || 'No description provided.'}</div>
            </div>
            {Array.isArray(issueDetails.images) && issueDetails.images.length > 0 && (
              <div className="md:col-span-2 bg-white/80 p-4 rounded-lg border-2 border-purple-400">
                <div className="font-bold text-purple-900 mb-2">Images</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {issueDetails.images.map((src, idx) => (
                    <img key={idx} src={src} alt={`issue-${idx}`} className="w-full h-32 object-cover rounded border" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

  {/* Feedback Modal */}
  {showFeedbackModal && (
    <div className="fixed inset-0 bg-purple-900/95 flex items-center justify-center p-4 z-50" onClick={() => setShowFeedbackModal(false)}>
      <div className="bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto border-4 border-purple-600 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-black text-purple-900 overflow-hidden">Citizen Feedback</h3>
          <button
            onClick={() => setShowFeedbackModal(false)}
            className="text-3xl font-black text-purple-900 hover:text-purple-700"
          >
            ✕
          </button>
        </div>
        {feedbackList.length === 0 ? (
          <p className="text-purple-700 font-semibold">No feedback found for this issue.</p>
        ) : (
          <div className="space-y-3">
            {feedbackList.map((fb) => (
              <div key={fb._id} className="bg-white rounded-lg p-4 border-2 border-purple-400">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-purple-900">{fb.submittedBy?.name || 'Anonymous'}</div>
                  <div className="text-sm text-purple-600">{new Date(fb.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-purple-800">
                  <div><span className="font-semibold">Resolved:</span> {String(fb.resolved)}</div>
                  <div><span className="font-semibold">Satisfaction:</span> {fb.satisfactionRating}/5</div>
                  {fb.suggestions && (<div className="mt-1"><span className="font-semibold">Suggestions:</span> {fb.suggestions}</div>)}
                  {fb.additionalComments && (<div className="mt-1"><span className="font-semibold">Comments:</span> {fb.additionalComments}</div>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}

    {/* AI Report Modal - same as before */}
    {showReportModal && aiReport && (
      <div className="fixed inset-0 bg-purple-900/95 flex items-center justify-center p-4 z-50" onClick={() => setShowReportModal(false)}>
        {/* Same content as before */}
      </div>
    )}
  </div>
);
};

// Updated DataTable with FIXED HEIGHT and SCROLLBAR
const DataTable = ({ title, icon, data, columns }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl shadow-xl p-6 mb-10 border-4 border-purple-600"
  >
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-3xl font-black text-purple-900 flex items-center overflow-hidden">{icon}{title}</h2>
    </div>
    {/* SCROLLABLE CONTAINER WITH FIXED HEIGHT */}
    <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#9333ea #f9a8d4' }}>
      <table className="min-w-full table-auto text-left">
        <thead className="sticky top-0 z-10">
          <tr className="bg-purple-700 text-yellow-300">
            {columns.map(col => (
              <th key={col.key} className="px-6 py-3 text-sm font-black uppercase tracking-wider">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-300">
          {data.map((item) => (
            <tr key={item._id} className="hover:bg-pink-100 bg-white/70">
              {columns.map(col => (
                <td key={col.key} className="px-6 py-4 text-sm font-bold text-purple-900">
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

const StatCard = ({ title, value, icon, color, rightIcon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gradient-to-r ${color} text-white rounded-2xl shadow-xl p-6 border-4 border-white`}
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="text-lg font-black mb-2">{title}</p>
        <div className="overflow-hidden text-4xl font-black flex items-center">{icon}{value}</div>
      </div>
      {rightIcon && rightIcon}
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

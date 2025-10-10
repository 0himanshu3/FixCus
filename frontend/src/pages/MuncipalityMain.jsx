import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  FaSearch, FaUsers, FaMapMarkerAlt, FaClipboardList, FaTasks, FaCheckCircle,
  FaHourglassHalf, FaUserCheck, FaStar, FaRegStar, FaRobot, FaCommentDots,
  FaThumbsUp, FaBullhorn, FaLightbulb
} from 'react-icons/fa'

export default function MunicipalityMain() {
  const user = useSelector((s) => s.auth.user)
  const navigate = useNavigate()

  // Data state
  const [issues, setIssues] = useState([])
  const [resolvedIssues, setResolvedIssues] = useState([])
  const [staff, setStaff] = useState([])

  // Loading flags
  const [loadingIssues, setLoadingIssues] = useState(false)
  const [loadingResolved, setLoadingResolved] = useState(false)
  const [loadingStaff, setLoadingStaff] = useState(false)

  // Filters / UI
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')

  // Feedback modal (resolved issues)
  const [feedbackModal, setFeedbackModal] = useState(null) // holds issueId
  const [feedbackList, setFeedbackList] = useState([])
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [loadingAIAnalysis, setLoadingAIAnalysis] = useState(false)

  // Staff details modal
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [selectedStaffDetails, setSelectedStaffDetails] = useState(null)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [loadingStaffDetails, setLoadingStaffDetails] = useState(false)

  // Assign new municipality staff modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignEmail, setAssignEmail] = useState('')
  const [assignExpertises, setAssignExpertises] = useState([])
  const [assigningLoading, setAssigningLoading] = useState(false)
  const [assignError, setAssignError] = useState('')
  const [assignSuccess, setAssignSuccess] = useState('')

  // Edit expertises (per staff) modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editStaff, setEditStaff] = useState(null)
  const [editExpertises, setEditExpertises] = useState([])
  const [editingLoading, setEditingLoading] = useState(false)
  const [editingError, setEditingError] = useState('')
  const [editingSuccess, setEditingSuccess] = useState('')

  // canonical issue categories (exact strings used in dropdowns)
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
  ]

  // Derived KPI values
  const totalPending = issues.length
  const highPriorityCount = issues.filter(i => (i.priority || '').toLowerCase() === 'high').length
  const avgAgeHours = (() => {
    if (!issues.length) return 0
    const totalHours = issues.reduce((sum, it) => {
      const created = new Date(it.createdAt)
      const now = new Date(it.resolvedAt || Date.now())
      return sum + (now - created) / (1000 * 60 * 60)
    }, 0)
    return Math.round(totalHours / issues.length)
  })()

  useEffect(() => {
    if (!user) return

    if (!user.accountApproved) {
      navigate('/fill-application-page')
      return
    }

    fetchStaff()
    fetchIssues()
    fetchResolvedIssues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Fetchers
  async function fetchIssues() {
    try {
      setLoadingIssues(true)
      const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/issues/pending`, {
        withCredentials: true
      })
      setIssues(res.data.pendingIssues || res.data.issues || [])
    } catch (err) {
      console.error('fetchIssues', err)
      setIssues([])
    } finally {
      setLoadingIssues(false)
    }
  }

  async function fetchResolvedIssues() {
    try {
      setLoadingResolved(true)
      const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/issues/completed-issuesbymuni`, {
        withCredentials: true
      })
      const arr = res.data.completedIssues ?? res.data.issues ?? res.data ?? []
      setResolvedIssues(Array.isArray(arr) ? arr : [])
    } catch (err) {
      console.error('fetchResolvedIssues', err)
      setResolvedIssues([])
    } finally {
      setLoadingResolved(false)
    }
  }

  async function fetchStaff() {
    try {
      setLoadingStaff(true)
      const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/auth/staff`, {
        withCredentials: true
      })
      setStaff(res.data || [])
    } catch (err) {
      console.error('fetchStaff', err)
      setStaff([])
    } finally {
      setLoadingStaff(false)
    }
  }

  // Feedback / AI
  const openFeedbackModal = async (issueId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/issues/feedback/${issueId}`, { withCredentials: true })
      setFeedbackList(res.data.feedbacks || [])
      setFeedbackModal(issueId)
    } catch (err) {
      console.error('Error fetching feedback:', err)
      setFeedbackList([])
      setFeedbackModal(issueId)
    }
  }

  const generateAIAnalysis = async (issueId) => {
    if (!issueId) return
    try {
      setLoadingAIAnalysis(true)
      setAiAnalysis('')
      const res = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/issues/analyze-feedback`, { issueId }, {
        withCredentials: true
      })
      setAiAnalysis(res.data.analysis || '')
    } catch (err) {
      console.error('Error generating AI analysis:', err)
      const errorMsg = err.response?.data?.message || 'Failed to generate AI analysis. Please try again.'
      setAiAnalysis(errorMsg)
    } finally {
      setLoadingAIAnalysis(false)
    }
  }

  const closeFeedbackModal = () => {
    setFeedbackModal(null)
    setFeedbackList([])
    setAiAnalysis('')
    setLoadingAIAnalysis(false)
  }

  // Staff details modal
  const handleViewStaffDetails = async (staffMember) => {
    if (!staffMember?._id) return
    try {
      setSelectedStaff(staffMember)
      setLoadingStaffDetails(true)
      setIsStaffModalOpen(true)
      const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/issues/staff-dashboard/${staffMember._id}`, {
        withCredentials: true
      })
      setSelectedStaffDetails(res.data.dashboardData)
    } catch (err) {
      console.error('Error fetching staff details:', err)
      setSelectedStaffDetails(null)
    } finally {
      setLoadingStaffDetails(false)
    }
  }

  const closeStaffModal = () => {
    setIsStaffModalOpen(false)
    setSelectedStaff(null)
    setSelectedStaffDetails(null)
  }

  // Search & filters
  const handleSearchChange = (e) => setQuery(e.target.value)

  const filteredIssues = issues
    .filter(i => priorityFilter === 'all' ? true : (String(i.priority || '').toLowerCase() === priorityFilter.toLowerCase()))
    .filter(i => {
      if (!query) return true
      const q = query.toLowerCase()
      return (i.title || '').toLowerCase().includes(q) || (i.location || i.issueDistrict || '').toLowerCase().includes(q)
    })

  const notResolvedIssues = issues.filter(i => (i.status || '').toLowerCase() === 'not resolved')

  const StaffOverview = () => {
    const total = staff.length
    return (
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-3 rounded-lg text-white"><FaUsers size={20} /></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">👥 Staff Overview</h3>
              <p className="text-sm text-purple-600 font-medium">Current staff in your district</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-900">{total}</div>
            <div className="text-sm text-purple-600">Total staff</div>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
          {loadingStaff ? (
            <div className="text-sm text-purple-600 font-medium">Loading staff...</div>
          ) : staff.length === 0 ? (
            <div className="text-sm text-purple-600 font-medium">No staff found</div>
          ) : (
            staff.map(s => (
              <div key={s._id} className="flex items-center justify-between bg-white p-3 rounded-lg hover:bg-purple-50 transition border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-sm ${s.available ? 'bg-green-500' : 'bg-gray-400'}`}>
                    {s.name?.slice(0, 1).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    <div className="text-xs text-purple-600 font-medium">{s.role || 'Staff'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewStaffDetails(s)}
                    className="px-3 py-1 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  const count = (a) => (Array.isArray(a) ? a.length : typeof a === 'number' ? a : 0)

  //Assign New Municipality Staff handlers
  const openAssignModal = () => {
    setAssignEmail('')
    setAssignExpertises([])
    setAssignError('')
    setAssignSuccess('')
    setIsAssignModalOpen(true)
  }

  const closeAssignModal = () => {
    setIsAssignModalOpen(false)
    setAssignError('')
    setAssignSuccess('')
  }

  const toggleExpertise = (value) => {
    if (assignExpertises.includes(value)) {
      setAssignExpertises(assignExpertises.filter(v => v !== value))
    } else {
      setAssignExpertises([...assignExpertises, value])
    }
  }

  const assignNewStaff = async (e) => {
    e?.preventDefault?.()
    setAssignError('')
    setAssignSuccess('')

    if (!assignEmail || !assignEmail.includes('@')) {
      setAssignError('Please enter a valid email.')
      return
    }
    if (!assignExpertises || assignExpertises.length === 0) {
      setAssignError('Please select at least one expertise.')
      return
    }

    try {
      setAssigningLoading(true)
      const res = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/auth/assign-municipality-staff`, {
        email: assignEmail,
        expertises: assignExpertises
      }, {
        withCredentials: true
      })

      setAssignSuccess(res.data?.message || 'User promoted to Municipality Staff successfully.')
      await fetchStaff()
      setAssignEmail('')
      setAssignExpertises([])

      setTimeout(() => {
        closeAssignModal()
      }, 900)
    } catch (err) {
      console.error('Error assigning staff:', err)
      const msg = err.response?.data?.message || 'Failed to assign staff. Please try again.'
      setAssignError(msg)
    } finally {
      setAssigningLoading(false)
    }
  }

  // Edit Expertises handlers (per staff)
  const openEditExpertisesModal = (staffMember) => {
    setIsStaffModalOpen(false)
    setEditStaff(staffMember)
    setEditExpertises(Array.isArray(staffMember?.expertises) ? [...staffMember.expertises] : [])
    setEditingError('')
    setEditingSuccess('')
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditStaff(null)
    setEditExpertises([])
    setEditingError('')
    setEditingSuccess('')
  }

  const toggleEditExpertise = (value) => {
    if (editExpertises.includes(value)) {
      setEditExpertises(editExpertises.filter(v => v !== value))
    } else {
      setEditExpertises([...editExpertises, value])
    }
  }

  const saveExpertisesForStaff = async (e) => {
    e?.preventDefault?.()
    if (!editStaff?._id) {
      setEditingError('Invalid staff selected.')
      return
    }
    if (!Array.isArray(editExpertises) || editExpertises.length === 0) {
      setEditingError('Select at least one expertise.')
      return
    }

    try {
      setEditingLoading(true)
      setEditingError('')
      setEditingSuccess('')
      const res = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/auth/staff/${editStaff._id}/expertises`,
        { expertises: editExpertises },
        { withCredentials: true }
      )

      setEditingSuccess(res.data?.message || 'Expertises updated.')
      await fetchStaff()

      setTimeout(() => {
        closeEditModal()
      }, 700)
    } catch (err) {
      console.error('Error updating expertises:', err)
      const msg = err.response?.data?.message || 'Failed to update expertises. Try again.'
      setEditingError(msg)
    } finally {
      setEditingLoading(false)
    }
  }

  // Render
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-200 via-pink-200 to-purple-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Pending issues list and Resolved issues below */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">📋 Pending Issues</h2>
            <p className="text-sm text-purple-600 font-medium mt-1">Issues reported in your district that need attention</p>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={handleSearchChange}
                placeholder="Search by title or location"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-purple-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
              />
              <div className="absolute left-3 top-3 text-purple-400"><FaSearch /></div>
            </div>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="py-2.5 px-4 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 font-medium bg-white"
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="very low">Very Low</option>
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden mb-6">
            <div className="max-h-[420px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-purple-100 to-pink-100 sticky top-0 border-b-2 border-purple-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-purple-900 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-purple-900 uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {loadingIssues ? (
                    <tr><td colSpan="3" className="p-6 text-center text-purple-600 font-medium">Loading issues...</td></tr>
                  ) : filteredIssues.length === 0 ? (
                    <tr><td colSpan="3" className="p-6 text-center text-purple-600 font-medium">No pending issues found.</td></tr>
                  ) : (
                    filteredIssues.map(issue => (
                      <tr key={issue._id} className="hover:bg-purple-50 transition cursor-pointer" onClick={() => navigate(`/issue/${issue.slug}`)}>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{issue.title}</div>
                          <div className="text-xs text-purple-600 font-medium mt-1">📅 {new Date(issue.createdAt).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2 text-sm text-gray-700 font-medium">
                            <FaMapMarkerAlt className="text-purple-500" />
                            {issue.issueDistrict || issue.location || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                            (issue.priority || '').toLowerCase() === 'high' ? 'bg-red-100 text-red-700 border-red-300' :
                              (issue.priority || '').toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                'bg-green-100 text-green-700 border-green-300'
                          }`}>
                            {(issue.priority || 'normal').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">✅ Resolved Issues</h3>
                <p className="text-sm text-purple-600">Recently completed issues — view feedback</p>
              </div>
              <div className="text-sm text-purple-600 font-medium">{resolvedIssues.length} resolved</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
              <div className="max-h-[260px] overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                {loadingResolved ? (
                  <div className="text-purple-600 text-sm">Loading resolved issues...</div>
                ) : resolvedIssues.length === 0 ? (
                  <div className="text-purple-600 text-sm">No resolved issues found.</div>
                ) : (
                  resolvedIssues.map(ri => (
                    <div key={ri._id} className="flex items-center justify-between bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <div className="flex-1 pr-3">
                        <div className="font-semibold text-gray-900 text-sm truncate">{ri.title}</div>
                        <div className="text-xs text-purple-600 mt-1">
                          Resolved: {new Date(ri.resolvedAt || ri.updatedAt || ri.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-600 font-medium bg-white px-2 py-1 rounded border border-purple-200">
                          ↑ {count(ri.upvotes)} • ↓ {count(ri.downvotes)}
                        </div>
                        <button onClick={() => openFeedbackModal(ri._id)} className="px-3 py-1 rounded bg-purple-700 text-white text-sm font-bold hover:bg-purple-800 transition">
                          View Feedback
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* NEW: Not Resolved Issues Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">❗ Not Resolved Issues</h3>
                <p className="text-sm text-purple-600">Issues flagged as "Not Resolved" </p>
              </div>
              <div className="text-sm text-red-600 font-medium">{notResolvedIssues.length} not resolved</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border-2 border-red-100 overflow-hidden">
              <div className="max-h-[260px] overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                {loadingIssues ? (
                  <div className="text-purple-600 text-sm">Loading issues...</div>
                ) : notResolvedIssues.length === 0 ? (
                  <div className="text-purple-600 text-sm">No "Not Resolved" issues found.</div>
                ) : (
                  notResolvedIssues.map(nr => (
                    <div key={nr._id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-50">
                      <div className="flex-1 pr-3">
                        <div className="font-semibold text-gray-900 text-sm truncate">{nr.title}</div>
                        <div className="text-xs text-gray-500 mt-1">Reported: {new Date(nr.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-purple-600 mt-1">{nr.issueDistrict || nr.location || '—'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          {nr.status || 'Not Resolved'}
                        </span>
                        <button onClick={() => navigate(`/issue/${nr.slug}`)} className="px-3 py-1 rounded bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition">
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          {/* END Not Resolved Section */}

        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-1">
          {user?.accountApproved && (
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-bold hover:from-purple-700 hover:to-purple-800 shadow-lg transition"
                onClick={() => navigate('/issues')}
              >
                📋 All Issues
              </button>
              <button
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg font-bold hover:from-pink-600 hover:to-pink-700 shadow-lg transition"
                onClick={() => navigate('/monthly-analysis')}
              >
                📊 Monthly Analysis
              </button>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-3 rounded-lg text-white"><FaClipboardList size={20} /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">⚡ Quick Summary</h3>
                  <p className="text-sm text-purple-600 font-medium">Pending workload snapshot</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-900">{totalPending}</div>
                <div className="text-sm text-purple-600">Pending</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-xs text-purple-600 font-semibold">High priority</div>
                <div className="text-lg font-bold text-gray-900">{highPriorityCount}</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-xs text-purple-600 font-semibold">Avg age</div>
                <div className="text-lg font-bold text-gray-900">{avgAgeHours}h</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-xs text-purple-600 font-semibold">Staff</div>
                <div className="text-lg font-bold text-gray-900">{staff.length}</div>
              </div>
            </div>
          </div>

          {/* Assign New Municipality Staff */}
          <div className="flex gap-3">
            <button
              onClick={openAssignModal}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-teal-700 shadow-lg transition"
            >
              ➕ Assign New Municipality Staff
            </button>
          </div>

          <StaffOverview />
        </div>
      </div>

      
      {/* Assign New Municipality Staff Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="absolute inset-0 backdrop-blur-sm pointer-events-auto" onClick={closeAssignModal} />
          <form onSubmit={assignNewStaff} className="relative pointer-events-auto bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border-2 border-green-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Assign Municipality Staff</h3>
                <p className="text-sm text-green-600 font-medium mt-1">Promote a user to Municipality Staff and set expertises</p>
              </div>
              <button type="button" onClick={closeAssignModal} className="text-2xl text-gray-400 hover:text-gray-700 font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">User Email</label>
                <input
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full mt-2 p-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-green-400 bg-white"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Expertises (select one or more)</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-auto p-2 border rounded-lg border-gray-100 bg-gray-50">
                  {issueCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-2 p-2 rounded hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        value={cat}
                        checked={assignExpertises.includes(cat)}
                        onChange={() => toggleExpertise(cat)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{cat}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Expertises can only be set for users who will be Municipality Staff.</p>
              </div>

              {assignError && <div className="text-sm text-red-600 font-medium">{assignError}</div>}
              {assignSuccess && <div className="text-sm text-green-600 font-medium">{assignSuccess}</div>}

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={closeAssignModal} className="px-4 py-2 rounded-lg border border-gray-200">Cancel</button>
                <button type="submit" disabled={assigningLoading} className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-60">
                  {assigningLoading ? 'Assigning...' : 'Assign Staff'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Edit Expertises Modal (per staff) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="absolute inset-0 backdrop-blur-sm pointer-events-auto" onClick={closeEditModal} />
          <form onSubmit={saveExpertisesForStaff} className="relative pointer-events-auto bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl border-2 border-yellow-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Edit Expertises</h3>
                <p className="text-sm text-yellow-600 font-medium mt-1">Update expertises for {editStaff?.name || 'staff member'}</p>
              </div>
              <button type="button" onClick={closeEditModal} className="text-2xl text-gray-400 hover:text-gray-700 font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Expertises (select one or more)</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-auto p-2 border rounded-lg border-gray-100 bg-gray-50">
                  {issueCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-2 p-2 rounded hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        value={cat}
                        checked={editExpertises.includes(cat)}
                        onChange={() => toggleEditExpertise(cat)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{cat}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Expertises are only meaningful for Municipality Staff.</p>
              </div>

              {editingError && <div className="text-sm text-red-600 font-medium">{editingError}</div>}
              {editingSuccess && <div className="text-sm text-green-600 font-medium">{editingSuccess}</div>}

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={closeEditModal} className="px-4 py-2 rounded-lg border border-gray-200">Cancel</button>
                <button type="submit" disabled={editingLoading} className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-bold hover:bg-yellow-600 disabled:opacity-60">
                  {editingLoading ? 'Saving...' : 'Save Expertises'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Staff details modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="absolute inset-0 backdrop-blur-sm pointer-events-auto" onClick={closeStaffModal} />
          <div className="relative pointer-events-auto bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border-2 border-purple-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedStaff?.name || 'Staff Details'}</h3>
                <p className="text-sm text-purple-600 font-medium mt-1">{selectedStaff?.role || 'Performance Overview'}</p>
              </div>
              <button onClick={closeStaffModal} className="text-2xl text-purple-400 hover:text-purple-600 font-bold">✕</button>
            </div>

            {loadingStaffDetails ? (
              <div className="text-center p-10"><div className="text-purple-600 font-semibold">Loading details...</div></div>
            ) : selectedStaffDetails ? (
              <div className="space-y-6">
                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><FaClipboardList /> Issues Assigned</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard icon={<FaUserCheck />} label="Total Issues" value={selectedStaffDetails.issueStats.total} color="blue" />
                    <StatCard icon={<FaCheckCircle />} label="Completed" value={selectedStaffDetails.issueStats.completed} color="green" />
                    <StatCard icon={<FaHourglassHalf />} label="Pending" value={selectedStaffDetails.issueStats.pending} color="yellow" />
                  </div>
                  <ProgressBar label="Issue Completion" percentage={selectedStaffDetails.issueStats.completionPercentage} color="purple" />
                </div>

                <div className="bg-pink-50 p-4 rounded-lg border-2 border-pink-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><FaTasks /> Tasks Assigned</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard icon={<FaTasks />} label="Total Tasks" value={selectedStaffDetails.taskStats.total} color="blue" />
                    <StatCard icon={<FaCheckCircle />} label="Completed" value={selectedStaffDetails.taskStats.completed} color="green" />
                    <StatCard icon={<FaHourglassHalf />} label="Pending" value={selectedStaffDetails.taskStats.pending} color="yellow" />
                  </div>
                  <ProgressBar label="Task Completion" percentage={selectedStaffDetails.taskStats.completionPercentage} color="pink" />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2"><FaStar /> Areas of Expertise</h4>
                        <button 
                            onClick={() => openEditExpertisesModal(selectedStaff)}
                            className="px-3 py-1 text-xs font-bold bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition shadow-sm"
                        >
                            Edit
                        </button>
                    </div>
                    {selectedStaff?.expertises && selectedStaff.expertises.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {selectedStaff.expertises.map(exp => (
                                <span key={exp} className="px-3 py-1 bg-white text-blue-800 text-xs font-semibold rounded-full border-2 border-blue-200">
                                    {exp}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No expertises listed for this staff member.</p>
                    )}
                </div>
              </div>
            ) : (
              <div className="text-center p-10"><div className="text-red-600 font-semibold">Could not load staff details.</div></div>
            )}
          </div>
        </div>
      )}

      {/* Feedback modal */}
      {feedbackModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm pointer-events-auto" onClick={closeFeedbackModal} />
          <div className="relative pointer-events-auto bg-gray-50 w-full max-w-3xl max-h-[90vh] flex flex-col p-6 rounded-xl shadow-2xl border-2 border-purple-300">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2"><FaCommentDots /> Citizen Feedback</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => generateAIAnalysis(feedbackModal)}
                  disabled={loadingAIAnalysis || feedbackList.length === 0}
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md flex items-center gap-2"
                >
                  <FaRobot /> {loadingAIAnalysis ? "Analyzing..." : "Generate AI Analysis"}
                </button>
                <button onClick={closeFeedbackModal} className="text-2xl text-purple-400 hover:text-purple-600 font-bold">✕</button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-4 pr-2" style={{ scrollbarWidth: 'thin' }}>
              {feedbackList.length === 0 ? (
                <p className="text-sm text-purple-600 text-center py-8">No feedback has been submitted for this issue.</p>
              ) : (
                feedbackList.map((fb) => (
                  <div key={fb._id} className="p-4 border-2 border-purple-200 rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800">{fb.submittedBy?.name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{new Date(fb.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-600">Overall Satisfaction</p>
                        <StarRating rating={fb.satisfactionRating} />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <FeedbackItem icon={<FaThumbsUp className="text-green-500" />} label="Resolution Quality" value={fb.resolutionQuality} />
                      <FeedbackItem icon={<FaBullhorn className="text-blue-500" />} label="Communication" value={fb.communication} />
                      <FeedbackItem icon={<FaHourglassHalf className="text-yellow-500" />} label="Resolution Time" value={fb.resolutionTime} />
                      <FeedbackItem icon={<FaLightbulb className="text-purple-500" />} label="Suggestions" value={fb.suggestions || 'None'} />
                    </div>
                  </div>
                ))
              )}

              {(loadingAIAnalysis || aiAnalysis) && (
                <div className="mt-4 p-4 border-2 border-teal-300 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50 shadow-md">
                  <h4 className="font-bold text-teal-800 text-lg mb-3 flex items-center gap-2"><FaRobot /> AI-Powered Summary</h4>
                  {loadingAIAnalysis ? (
                    <div className="flex justify-center items-center p-6"><div className="text-teal-700 font-medium">Generating insights...</div></div>
                  ) : (
                    <AIAnalysisDisplay analysis={aiAnalysis} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* Helper UI components */

const StarRating = ({ rating = 0 }) => (
  <div className="flex items-center text-yellow-500 mt-1">
    {[...Array(5)].map((_, i) => (
      i < rating ? <FaStar key={i} /> : <FaRegStar key={i} />
    ))}
    <span className="ml-2 text-xs font-bold text-gray-500">({rating}/5)</span>
  </div>
)

const FeedbackItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <div className="mt-1">{icon}</div>
    <div>
      <p className="font-semibold text-gray-500">{label}</p>
      <p className="text-gray-800">{value || 'N/A'}</p>
    </div>
  </div>
)

const AIAnalysisDisplay = ({ analysis }) => {
  const getIconForHeading = (line) => {
    const lowerLine = line.toLowerCase()
    if (lowerLine.includes('positive') || lowerLine.includes('strength')) return '👍'
    if (lowerLine.includes('improvement') || lowerLine.includes('concern')) return '⚠️'
    if (lowerLine.includes('suggestion') || lowerLine.includes('actionable')) return '💡'
    if (lowerLine.includes('summary') || lowerLine.includes('overall')) return '📊'
    return '🔹'
  }

  const lines = (analysis || '').split('\n').filter(line => line.trim() !== '')

  return (
    <div className="space-y-3 font-sans">
      {lines.map((line, index) => {
        const trimmedLine = line.trim()
        if (trimmedLine.endsWith(':')) {
          return (
            <h5 key={index} className="font-semibold text-teal-900 text-base flex items-center gap-2 pt-2">
              <span className="text-lg">{getIconForHeading(trimmedLine)}</span>
              {trimmedLine.slice(0, -1)}
            </h5>
          )
        }
        if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          return (
            <p key={index} className="pl-6 text-gray-800 flex items-start gap-2.5">
              <span className="text-teal-600 mt-1.5">∙</span>
              <span>{trimmedLine.substring(1).trim()}</span>
            </p>
          )
        }
        return (
          <p key={index} className="pl-6 text-gray-700">
            {trimmedLine}
          </p>
        )
      })}
    </div>
  )
}

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600'
  }
  return (
    <div className="bg-white p-4 rounded-lg flex items-center gap-4 border border-purple-200">
      <div className={`text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <div className="text-sm font-bold text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
      </div>
    </div>
  )
}

const ProgressBar = ({ label, percentage, color }) => {
  const colors = {
    purple: { bg: 'bg-purple-200', fill: 'bg-purple-600' },
    pink: { bg: 'bg-pink-200', fill: 'bg-pink-600' }
  }
  const c = colors[color] || colors.purple

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-800">{percentage}%</span>
      </div>
      <div className={`w-full ${c.bg} rounded-full h-2.5`}>
        <div className={`${c.fill} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}

/* Utility count function used in main render (kept outside for reuse) */
const count = (a) => (Array.isArray(a) ? a.length : typeof a === 'number' ? a : 0)

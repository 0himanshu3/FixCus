import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaUsers, FaMapMarkerAlt, FaClipboardList } from 'react-icons/fa'

export default function MunicipalityMain() {
  const user = useSelector((s) => s.auth.user)
  const navigate = useNavigate()
  const [issues, setIssues] = useState([])
  const [staff, setStaff] = useState([])
  const [loadingIssues, setLoadingIssues] = useState(false)
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedIssue, setSelectedIssue] = useState(null)

  // derived KPI
  const totalPending = issues.length
  const highPriorityCount = issues.filter(i => i.priority === 'high').length
  const avgAgeHours = (() => {
    if (!issues.length) return 0
    const totalHours = issues.reduce((sum, it) => {
      const created = new Date(it.createdAt)
      const now = new Date()
      return sum + (now - created) / (1000 * 60 * 60)
    }, 0)
    return Math.round(totalHours / issues.length)
  })()

  useEffect(() => {
    if (!user) return
    fetchStaff()
    fetchIssues()
  }, [user])

  async function fetchIssues() {
    try {
      setLoadingIssues(true)
      const res = await axios.get(`http://localhost:3000/api/v1/issues/pending`, {
        withCredentials: true
      })
      
      setIssues(res.data.pendingIssues || [])
    } catch (err) {
      console.error('fetchIssues', err)
      setIssues([])
    } finally {
      setLoadingIssues(false)
    }
  }

  async function fetchStaff() {
    try {
      setLoadingStaff(true)
      const res = await axios.get(`http://localhost:3000/api/v1/auth/staff`, {
        withCredentials: true
      })
      console.log(res.data);
      setStaff(res.data || [])
    } catch (err) {
      console.error('fetchStaff', err)
      setStaff([])
    } finally {
      setLoadingStaff(false)
    }
  }

  const handleSearchChange = (e) => setQuery(e.target.value)

  const filteredIssues = issues
    .filter(i => priorityFilter === 'all' ? true : i.priority === priorityFilter)
    .filter(i => {
      console.log(priorityFilter);
      if (!query) return true
      
      const q = query.toLowerCase()
      return (i.title || '').toLowerCase().includes(q) || (i.location || '').toLowerCase().includes(q)
    })

  const StaffOverview = () => {
  const total = staff.length
  const available = staff.filter(s => s.available).length
  const assigned = total - available
  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-3 rounded-lg text-white"><FaUsers size={20}/></div>
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

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-white rounded-lg border border-purple-200">
          <div className="text-xs text-purple-600 font-semibold">Available</div>
          <div className="text-lg font-bold text-gray-900">{available}</div>
        </div>
        <div className="p-3 bg-white rounded-lg border border-purple-200">
          <div className="text-xs text-purple-600 font-semibold">Assigned</div>
          <div className="text-lg font-bold text-gray-900">{assigned}</div>
        </div>
        <div className="p-3 bg-white rounded-lg border border-purple-200">
          <div className="text-xs text-purple-600 font-semibold">Avg response</div>
          <div className="text-lg font-bold text-gray-900">{avgAgeHours}h</div>
        </div>
      </div>

      <div className="space-y-2 max-h-44 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        {loadingStaff ? (
          <div className="text-sm text-purple-600 font-medium">Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="text-sm text-purple-600 font-medium">No staff found</div>
        ) : (
          staff.map(s => (
            <div key={s._id} className="flex items-center justify-between bg-white p-3 rounded-lg hover:bg-purple-50 transition border border-purple-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-sm ${s.available ? 'bg-green-500' : 'bg-gray-400'}`}>
                  {s.name?.slice(0,1).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{s.name}</div>
                  <div className="text-xs text-purple-600 font-medium">{s.role || 'Staff'}</div>
                </div>
              </div>
              <div className={`text-xs font-semibold px-2 py-1 rounded-full ${s.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {s.available ? '✓ Available' : '⏳ Busy'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

return (
  <div className="min-h-screen p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left — Pending issues list */}
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
            <div className="absolute left-3 top-3 text-purple-400"><FaSearch/></div>
          </div>
          <select 
            value={priorityFilter} 
            onChange={e=>setPriorityFilter(e.target.value)} 
            className="py-2.5 px-4 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 font-medium bg-white"
          >
            <option value="all">All priorities</option>
            <option value="high">High priority</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="verylow">Very Low</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
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
                    <tr key={issue._id} className="hover:bg-purple-50 transition cursor-pointer" onClick={()=>setSelectedIssue(issue)}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{issue.title}</div>
                        <div className="text-xs text-purple-600 font-medium mt-1">📅 {new Date(issue.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 text-sm text-gray-700 font-medium">
                          <FaMapMarkerAlt className="text-purple-500" />
                          {issue.issueDistrict || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                          issue.priority === 'high' ? 'bg-red-100 text-red-700 border-red-300' : 
                          issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
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
      </div>

      {/* Right — Buttons + Quick summary + Staff overview */}
      <div className="space-y-6">

        {/* Top-right buttons */}
        {user?.accountApproved && (
          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-bold hover:from-purple-700 hover:to-purple-800 shadow-lg transition"
              onClick={() => navigate('/issues')}
            >
              📋 Issues
            </button>
            <button
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg font-bold hover:from-pink-600 hover:to-pink-700 shadow-lg transition"
              onClick={() => navigate('/monthly-analysis')}
            >
              📊 Analysis
            </button>
          </div>
        )}

        {/* Quick Summary Card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg text-white"><FaClipboardList size={20}/></div>
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

        {/* Staff Overview Card */}
        <StaffOverview />

      </div>
    </div>

    {/* Issue details modal */}
    {selectedIssue && (
      <div className="fixed inset-0 bg-purple-900/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-50">
        <div className="bg-white rounded-t-xl lg:rounded-xl w-full lg:w-3/5 max-h-[90vh] overflow-y-auto p-6 shadow-2xl border-2 border-purple-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{selectedIssue.title}</h3>
              <p className="text-sm text-purple-600 font-medium mt-1">📍 {selectedIssue.location} • 📅 {new Date(selectedIssue.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={()=>setSelectedIssue(null)} className="text-2xl text-purple-400 hover:text-purple-600 font-bold">✕</button>
          </div>

          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <h4 className="font-bold text-gray-900 mb-2">📝 Description</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedIssue.message || selectedIssue.description || '—'}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <h4 className="font-bold text-gray-900 mb-2">📎 Supporting Documents</h4>
              {selectedIssue.supportingDocuments && selectedIssue.supportingDocuments.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {selectedIssue.supportingDocuments.map((f, i)=> (
                    <a key={i} href={f.url || '#'} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 border-2 border-purple-300">
                      📄 Document {i+1}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-purple-600 font-medium">No documents</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={()=>setSelectedIssue(null)} className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-lg transition">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

  </div>
)


}

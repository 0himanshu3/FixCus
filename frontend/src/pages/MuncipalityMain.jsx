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
      setIssues(res.data.issues || [])
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
      if (!query) return true
      const q = query.toLowerCase()
      return (i.title || '').toLowerCase().includes(q) || (i.location || '').toLowerCase().includes(q)
    })

  const StaffOverview = () => {
    const total = staff.length
    const available = staff.filter(s => s.available).length
    const assigned = total - available
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600"><FaUsers/></div>
            <div>
              <h3 className="text-lg font-semibold">Staff Overview</h3>
              <p className="text-sm text-gray-500">Current staff in your district</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">{total}</div>
            <div className="text-sm text-gray-500">Total staff</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Available</div>
            <div className="font-semibold">{available}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Assigned</div>
            <div className="font-semibold">{assigned}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Avg response (hrs)</div>
            <div className="font-semibold">{avgAgeHours}</div>
          </div>
        </div>

        <div className="space-y-2 max-h-44 overflow-auto">
          {loadingStaff ? (
            <div className="text-sm text-gray-500">Loading staff...</div>
          ) : staff.length === 0 ? (
            <div className="text-sm text-gray-500">No staff found</div>
          ) : (
            staff.map(s => (
              <div key={s._id} className="flex items-center justify-between bg-white p-2 rounded border">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${s.available ? 'bg-green-500' : 'bg-gray-400'}`}> {s.name?.slice(0,1) || 'U'} </div>
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-gray-500">{s.role || 'Staff'}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">{s.available ? 'Available' : 'Busy'}</div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Pending issues list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Pending Issues</h2>
              <p className="text-sm text-gray-500">Issues reported in your district that need attention</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  value={query}
                  onChange={handleSearchChange}
                  placeholder="Search by title or location"
                  className="pl-10 pr-4 py-2 rounded-lg border w-72 focus:outline-none"
                />
                <div className="absolute left-3 top-2 text-gray-400"><FaSearch/></div>
              </div>
              <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} className="py-2 px-3 border rounded-lg">
                <option value="all">All priorities</option>
                <option value="high">High priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow divide-y">
            <div className="p-4 grid grid-cols-12 gap-4 text-sm font-semibold text-gray-500 border-b">
              <div className="col-span-6">Title</div>
              <div className="col-span-2 text-center">Location</div>
              <div className="col-span-2 text-center">Priority</div>
            </div>

            <div>
              {loadingIssues ? (
                <div className="p-6 text-gray-500">Loading issues...</div>
              ) : filteredIssues.length === 0 ? (
                <div className="p-6 text-gray-500">No pending issues found.</div>
              ) : (
                filteredIssues.map(issue => (
                  <div key={issue._id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50">
                    <div className="col-span-6">
                      <div className="font-medium">{issue.title}</div>
                      <div className="text-xs text-gray-500">Reported: {new Date(issue.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="col-span-2 text-center"><div className="inline-flex items-center gap-2 justify-center"><FaMapMarkerAlt className="text-gray-400" /> <span className="text-sm">{issue.location || '—'}</span></div></div>
                    <div className="col-span-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${issue.priority === 'high' ? 'bg-red-100 text-red-700' : issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {issue.priority || 'normal'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right — Buttons + Quick summary + Staff overview */}
        <div className="space-y-6">

          {/* Top-right buttons */}
          {user?.accountApproved && (
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => navigate('/issues')}
              >
                Issues
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => navigate('/monthly-analysis')}
              >
                Monthly Analysis
              </button>
            </div>
          )}

          {/* Quick Summary Card */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600"><FaClipboardList/></div>
                <div>
                  <h3 className="text-lg font-semibold">Quick Summary</h3>
                  <p className="text-sm text-gray-500">Snapshot of pending workload</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{totalPending}</div>
                <div className="text-sm text-gray-500">Pending issues</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">High priority</div>
                <div className="font-semibold">{highPriorityCount}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">Avg age (hrs)</div>
                <div className="font-semibold">{avgAgeHours}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">Staff</div>
                <div className="font-semibold">{staff.length}</div>
              </div>
            </div>
          </div>

          {/* Staff Overview Card */}
          <StaffOverview />

        </div>
      </div>

      {/* Issue details modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white rounded-t-xl lg:rounded-xl w-full lg:w-3/5 max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{selectedIssue.title}</h3>
                <p className="text-sm text-gray-500">{selectedIssue.location} • Reported: {new Date(selectedIssue.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={()=>setSelectedIssue(null)} className="text-gray-500 hover:text-gray-800">Close</button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Description</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedIssue.message || selectedIssue.description || '—'}</p>
              </div>

              <div>
                <h4 className="font-semibold">Supporting Documents</h4>
                {selectedIssue.supportingDocuments && selectedIssue.supportingDocuments.length > 0 ? (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selectedIssue.supportingDocuments.map((f, i)=> (
                      <a key={i} href={f.url || '#'} target="_blank" rel="noreferrer" className="px-2 py-1 bg-gray-100 rounded text-sm">Document {i+1}</a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No documents</p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={()=>setSelectedIssue(null)} className="px-4 py-2 bg-gray-200 rounded">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

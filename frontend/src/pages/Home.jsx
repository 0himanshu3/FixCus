import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { logout } from '../redux/slices/authSlice'
import { FaArrowUp, FaArrowDown, FaClock, FaTasks } from 'react-icons/fa'

const LoadingBox = ({ text = 'Loading...' }) => (
  <div className="py-8 flex items-center justify-center text-gray-600">{text}</div>
)

const ErrorBox = ({ message }) => (
  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{message}</div>
)

const SummaryCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
    <div>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
    <div className="text-3xl text-gray-300">{icon}</div>
  </div>
)

const IssueRow = ({ issue, onView }) => (
  <div className="p-3 rounded-lg hover:bg-gray-50 flex items-start justify-between border-b last:border-b-0">
    <div className="flex-1 pr-4">
      <div className="font-medium text-gray-800">{issue.title || 'Untitled issue'}</div>
      <div className="text-xs text-gray-500 mt-1">
        {issue.issueLocation || issue.location || '—'} • {new Date(issue.createdAt).toLocaleDateString()}
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <div className="text-xs text-gray-500">{issue.upvotes?.length ?? issue.upvotes ?? 0} ↑</div>
      <div className="text-xs text-gray-500">{issue.downvotes?.length ?? issue.downvotes ?? 0} ↓</div>
      <button onClick={() => onView(issue)} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">View</button>
    </div>
  </div>
)

export default function Home() {
  const state = useSelector((s) => s.auth)
  const user = state.user
  const dispatch = useDispatch()
  const nav = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [topUpvoted, setTopUpvoted] = useState([])
  const [topDownvoted, setTopDownvoted] = useState([])
  const [supervisorIssues, setSupervisorIssues] = useState([])
  const [coordinatorIssues, setCoordinatorIssues] = useState([])
  const [workerIssues, setWorkerIssues] = useState([])
  const [avgTimes, setAvgTimes] = useState({ supervisor: 0, coordinator: 0, worker: 0 })
  const [refreshFlag, setRefreshFlag] = useState(0)

  useEffect(() => {
    if (!user) return
    setError(null)
    setLoading(true)

    const loadForUser = async () => {
      try {
        const [upRes, downRes] = await Promise.all([
          axios.get('http://localhost:3000/api/v1/issues/top', { params: { sortBy: 'upvotes', limit: 5 }, withCredentials: true }),
          axios.get('http://localhost:3000/api/v1/issues/top', { params: { sortBy: 'downvotes', limit: 5 }, withCredentials: true })
        ])
        setTopUpvoted(upRes.data.issues || upRes.data || [])
        setTopDownvoted(downRes.data.issues || downRes.data || [])
      } catch (err) {
        console.error(err)
        setError('Failed to load top issues for your district.')
      } finally {
        setLoading(false)
      }
    }

    const loadForStaff = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/issues/staff-summary', { withCredentials: true })
        const data = res.data || {}
        console.log(data);
        setSupervisorIssues(data.supervisor || [])
        setCoordinatorIssues(data.coordinator || [])
        setWorkerIssues(data.worker || [])
        setAvgTimes(data.resolvedPercent || { supervisor: 0, coordinator: 0, worker: 0 })
      } catch (err) {
        console.error(err)
        setError('Failed to load staff issues/metrics.')
      } finally {
        setLoading(false)
      }
    }

    if (user.role === 'User') loadForUser()
    else if (user.role === 'Municipality Staff') loadForStaff()
    else setLoading(false)

  }, [user, refreshFlag])

  const handleLogout = () => dispatch(logout())
  const toIssue = (issue) => { if(issue?._id) nav(`/issue/${issue.slug}`)
 }

  if (!state.isAuthenticated) return <Navigate to="/login" />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-gray-500 mt-1">{user?.role === 'User' ? `Top issues in ${user?.district || 'your area'}` : 'Your assigned issue buckets & metrics'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setRefreshFlag(f => f + 1)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">Refresh</button>
          </div>
        </div>

        {error && <ErrorBox message={error} />}
        {loading ? <LoadingBox /> : user.role === 'User' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard title="District" value={user.district || '—'} icon={<FaTasks />} />
              <SummaryCard title="Top upvoted" value={topUpvoted.length} icon={<FaArrowUp />} />
              <SummaryCard title="Top downvoted" value={topDownvoted.length} icon={<FaArrowDown />} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><FaArrowUp className="text-green-500" /> Top Upvoted Issues</h3>
                {topUpvoted.length === 0 ? <p className="text-gray-500">No data available.</p> : <div className="divide-y">{topUpvoted.map(issue => <IssueRow key={issue._id} issue={issue} onView={toIssue} />)}</div>}
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><FaArrowDown className="text-red-500" /> Top Downvoted Issues</h3>
                {topDownvoted.length === 0 ? <p className="text-gray-500">No data available.</p> : <div className="divide-y">{topDownvoted.map(issue => <IssueRow key={issue._id} issue={issue} onView={toIssue} />)}</div>}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['supervisor', 'coordinator', 'worker'].map((role, idx) => (
                <div key={role} className="bg-white rounded-xl shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
                      <div className="text-xl font-bold">
                        {role === 'supervisor' ? supervisorIssues.length : role === 'coordinator' ? coordinatorIssues.length : workerIssues.length}
                      </div>
                      <div className="text-xs text-gray-400">
                        Avg completion: {avgTimes[role] ? `${Math.round(avgTimes[role])} %` : 'N/A'}
                      </div>
                    </div>
                    <div className="text-2xl text-gray-300">{role === 'supervisor' ? <FaArrowUp /> : role === 'coordinator' ? <FaClock /> : <FaTasks />}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {['supervisor', 'coordinator', 'worker'].map(role => {
                const list = role === 'supervisor' ? supervisorIssues : role === 'coordinator' ? coordinatorIssues : workerIssues
                return (
                  <div key={role} className="bg-white rounded-xl shadow p-4">
                    <h4 className="text-lg font-semibold mb-3">{role.charAt(0).toUpperCase() + role.slice(1)} Issues</h4>
                    {list.length === 0 ? <p className="text-gray-500">No issues</p> : <div className="divide-y">{list.map(i => <IssueRow key={i._id} issue={i} onView={toIssue} />)}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaArrowUp, FaArrowDown, FaTasks } from 'react-icons/fa'

// --- Utility Components ---
const LoadingBox = ({ text = 'Loading...' }) => (
  <div className="py-8 flex items-center justify-center text-gray-600">{text}</div>
)

const ErrorBox = ({ message }) => (
  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{message}</div>
)

const EmptyState = ({ text = 'No data available.' }) => (
  <div className="py-6 text-center text-gray-500">{text}</div>
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
        {issue.issueDistrict || issue.issueLocation || '—'} • {new Date(issue.issuePublishDate).toLocaleDateString()}
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <div className="text-xs text-gray-500">{issue?.upvotesCount ?? 0} ↑</div>
      <div className="text-xs text-gray-500">{issue?.downvotesCount ?? 0} ↓</div>
      <button onClick={() => onView(issue)} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">View</button>
    </div>
  </div>
)

export default function Dashboard() {
  const state = useSelector((s) => s.auth)
  const user = state.user
  const nav = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [topUpvoted, setTopUpvoted] = useState([])
  const [topDownvoted, setTopDownvoted] = useState([])
  const [refreshFlag, setRefreshFlag] = useState(0)

  // Redirect to login if not authenticated
  if (!state.isAuthenticated) return <Navigate to="/login" />

  // Only show content for normal users
  if (user?.role !== 'User') return null

  useEffect(() => {
    if (!user) return
    setError(null)
    setLoading(true)

    const loadTopIssues = async () => {
      try {
        const [upRes, downRes] = await Promise.all([
          axios.get('http://localhost:3000/api/v1/issues/top', { params: { sortBy: 'upvotes', limit: 5 }, withCredentials: true }),
          axios.get('http://localhost:3000/api/v1/issues/top', { params: { sortBy: 'downvotes', limit: 5 }, withCredentials: true })
        ])

        const upvoted = upRes.data.topUpvoted || upRes.data.issues || []
        let downvoted = downRes.data.topDownvoted || downRes.data.issues || []

        // Remove duplicates: keep only in upvoted if total issues < 10
        const totalIssues = upvoted.length + downvoted.length
        if (totalIssues < 10) {
          const upvotedIds = new Set(upvoted.map(i => i._id))
          downvoted = downvoted.filter(i => !upvotedIds.has(i._id))
        }

        setTopUpvoted(upvoted)
        setTopDownvoted(downvoted)
      } catch (err) {
        console.error(err)
        setError('Failed to load top issues for your district.')
      } finally {
        setLoading(false)
      }
    }

    loadTopIssues()
  }, [user, refreshFlag])

  const toIssue = (issue) => { 
    if(issue?._id) nav(`/issue/${issue.slug}`) 
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-gray-500 mt-1">{`Top issues in ${user?.district || 'your area'}`}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => nav('/municipality-view')} className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">View Municipalities</button>
            <button onClick={() => setRefreshFlag(f => f + 1)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">Refresh</button>
          </div>
        </div>

        {error && <ErrorBox message={error} />}
        {loading ? <LoadingBox /> : (
          <div className="space-y-6">
            {/* --- Summary Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard title="District" value={user.district || '—'} icon={<FaTasks />} />
              <SummaryCard title="Top upvoted" value={topUpvoted.length} icon={<FaArrowUp />} />
              <SummaryCard title="Top downvoted" value={topDownvoted.length} icon={<FaArrowDown />} />
            </div>

            {/* --- Top Issues --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><FaArrowUp className="text-green-500" /> Top Upvoted Issues</h3>
                {topUpvoted.length === 0 ? <EmptyState text="No top upvoted issues available." /> : (
                  <div className="divide-y">{topUpvoted.map(issue => <IssueRow key={issue._id} issue={issue} onView={toIssue} />)}</div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><FaArrowDown className="text-red-500" /> Top Downvoted Issues</h3>
                {topDownvoted.length === 0 ? <EmptyState text="No top downvoted issues available." /> : (
                  <div className="divide-y">{topDownvoted.map(issue => <IssueRow key={issue._id} issue={issue} onView={toIssue} />)}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

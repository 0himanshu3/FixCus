import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaArrowUp, FaArrowDown, FaTasks, FaEye, FaClock } from 'react-icons/fa'

// --- Utility Components ---
const LoadingBox = ({ text = 'Loading...' }) => (
  <div className="py-8 flex items-center justify-center text-purple-600">{text}</div>
)

const ErrorBox = ({ message }) => (
  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{message}</div>
)

const EmptyState = ({ text = 'No data available.' }) => (
  <div className="py-6 text-center text-gray-400">{text}</div>
)

const SummaryCard = ({ title, value, icon }) => (
  <div className="bg-white/90 rounded-xl shadow p-4 flex items-center justify-between border border-purple-50">
    <div>
      <div className="text-sm text-purple-500">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
    <div className="text-3xl text-purple-300">{icon}</div>
  </div>
)

const IssueRow = ({ issue, onView }) => (
  <div className="p-3 rounded-lg hover:bg-white/60 flex items-start justify-between border-b last:border-b-0">
    <div className="flex-1 pr-4">
      <div className="font-medium text-gray-800">{issue.title || 'Untitled issue'}</div>
      <div className="text-xs text-gray-500 mt-1">
        {issue.issueDistrict || issue.issueLocation || '—'} • {new Date(issue.issuePublishDate || issue.createdAt).toLocaleDateString()}
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <div className="text-xs text-gray-500">{issue?.upvotesCount ?? (Array.isArray(issue?.upvotes) ? issue.upvotes.length : 0)} ↑</div>
      <div className="text-xs text-gray-500">{issue?.downvotesCount ?? (Array.isArray(issue?.downvotes) ? issue.downvotes.length : 0)} ↓</div>
      <button onClick={() => onView(issue)} className="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-sm">View</button>
    </div>
  </div>
)

// helper to count upvotes/downvotes consistently
const count = (a) => (Array.isArray(a) ? a.length : typeof a === 'number' ? a : 0)

export default function Dashboard() {
  const state = useSelector((s) => s.auth)
  const user = state.user
  const nav = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [topUpvoted, setTopUpvoted] = useState([])
  const [topDownvoted, setTopDownvoted] = useState([])
  const [myReported, setMyReported] = useState([])
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
        // parallel requests
        const [upRes, downRes, myRes] = await Promise.allSettled([
          axios.get('http://localhost:3000/api/v1/issues/top', { params: { sortBy: 'upvotes', limit: 5 }, withCredentials: true }),
          axios.get('http://localhost:3000/api/v1/issues/top', { params: { sortBy: 'downvotes', limit: 5 }, withCredentials: true }),
          axios.get('http://localhost:3000/api/v1/issues/my', { withCredentials: true })
        ])

        const upvoted = (upRes.status === 'fulfilled' ? (upRes.value.data.topUpvoted || upRes.value.data.issues || upRes.value.data || []) : [])
        let downvoted = (downRes.status === 'fulfilled' ? (downRes.value.data.topDownvoted || downRes.value.data.issues || downRes.value.data || []) : [])

        // Remove duplicates on backend-specified rule: if total < 10 keep only in upvoted
        const totalIssues = upvoted.length + downvoted.length
        if (totalIssues < 10) {
          const upvotedIds = new Set(upvoted.map(i => i._id))
          downvoted = downvoted.filter(i => !upvotedIds.has(i._id))
        }

        setTopUpvoted(upvoted)
        setTopDownvoted(downvoted)

        // handle my reported issues: if endpoint succeeded, use it; else fallback to filtering lists
          const myData = myRes.value.data?.issues || myRes.value.data || []
          setMyReported(Array.isArray(myData) ? myData : [])
        
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
    if (issue?._id) nav(`/issue/${issue.slug}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-purple-800">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-purple-600 mt-1">{`Top issues in ${user?.district || 'your area'}`}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => nav('/municipality-view')} className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">View Municipalities</button>
            <button onClick={() => setRefreshFlag(f => f + 1)} className="px-4 py-2 bg-white border border-purple-100 hover:bg-purple-50 rounded text-sm">Refresh</button>
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

            {/* --- My Reported Issues --- */}
            <div className="bg-white rounded-xl shadow p-4 border border-purple-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-purple-800">My Reported Issues</h3>
                  <div className="text-sm text-gray-500">Issues you reported — quick glance.</div>
                </div>
                <div className="text-sm text-gray-500">{myReported.length} issues</div>
              </div>

              {myReported.length === 0 ? (
                <div className="py-6 text-center text-gray-400">You haven't reported any issues yet.</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {myReported.map((issue) => (
                    <article key={issue._id} className="p-3 bg-purple-50/60 rounded-lg flex items-start justify-between">
                      <div className="flex-1 pr-3">
                        <div className="text-sm font-semibold text-gray-900 truncate">{issue.title || 'Untitled'}</div>
                        <div className="text-xs text-gray-600 mt-1">{issue.category || issue.category || 'General'} • {issue.priority || '—'}</div>
                        <div className="text-xs text-gray-500 mt-2 line-clamp-2">{issue.content || issue.description || ''}</div>
                        <div className="mt-2 text-xs text-gray-400">{issue.issueDistrict || '—'} • {new Date(issue.issuePublishDate || issue.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs text-gray-600">↑ {count(issue.upvotes)} • ↓ {count(issue.downvotes)}</div>
                        <button onClick={() => toIssue(issue)} className="mt-2 px-3 py-1 rounded bg-purple-700 text-white text-sm">View</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* --- Top Issues --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow p-4 border border-purple-50">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-purple-800"><FaArrowUp className="text-green-500" /> Top Upvoted Issues</h3>
                {topUpvoted.length === 0 ? <EmptyState text="No top upvoted issues available." /> : (
                  <div className="divide-y">{topUpvoted.map(issue => <IssueRow key={issue._id} issue={issue} onView={toIssue} />)}</div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow p-4 border border-purple-50">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-purple-800"><FaArrowDown className="text-red-500" /> Top Downvoted Issues</h3>
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

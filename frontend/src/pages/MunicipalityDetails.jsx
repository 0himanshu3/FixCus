import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaThumbsUp,
  FaThumbsDown,
  FaEye,
  FaTimes,
} from 'react-icons/fa'
import { PieChart, Pie, Cell,Tooltip, ResponsiveContainer } from 'recharts'

/* ---------- helpers ---------- */
const formatDate = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const priorityColor = (p) => {
  const key = String(p || '').toLowerCase()
  switch (key) {
    case 'very low':
      return { bg: 'bg-green-100', text: 'text-green-800' }
    case 'low':
      return { bg: 'bg-lime-100', text: 'text-lime-800' }
    case 'medium':
      return { bg: 'bg-amber-100', text: 'text-amber-800' }
    case 'high':
      return { bg: 'bg-red-100', text: 'text-red-800' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' }
  }
}

const categoryBadge = (cat) => (
  <div className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
    {cat || 'General'}
  </div>
)

const countArrayOrNumber = (field) => {
  if (Array.isArray(field)) return field.length
  if (typeof field === 'number') return field
  return 0
}

const isResolvedStatus = (s) => {
  if (!s) return false
  const v = String(s).toLowerCase()
  return v === 'resolved' || v === 'completed' || v === 'closed'
}

/* pie chart colors */
const COLORS = ['#7C3AED', '#E9D5FF'] // purple and light purple

/* ---------- component ---------- */
export default function MunicipalityDetails() {
  const { slug } = useParams()
  const [municipality, setMunicipality] = useState(null)
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // modal / lightbox / timeline state
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    const fetch = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/v1/issues/municipality/${slug}`,
          { withCredentials: true }
        )
        const data = res.data ?? {}
        const issuesList =
          data.issues ??
          data.issuesList ??
          data.issuesData ??
          (Array.isArray(data) ? data : [])
        const muni = data.municipalityInfo ?? null

        if (mounted) {
          setIssues(Array.isArray(issuesList) ? issuesList : [])
          setMunicipality(muni)
        }
      } catch (err) {
        console.error('Failed to load municipality issues', err)
        if (mounted) setError('Failed to load municipality issues. Please login or try again.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => {
      mounted = false
    }
  }, [slug])

  const openIssueModal = async (issue) => {
    setSelectedIssue(issue)
    setLightboxIndex(0)
    setLightboxOpen(false)
    setTimeline([])
    setTimelineLoading(true)
    try {
      // timeline endpoint — adjust if needed
      const res = await axios.get(`http://localhost:3000/api/v1/issues/timeline/${issue._id}`, {
        withCredentials: true,
      })
      const data = res.data ?? {}
  
      const events = data.timelineEvents  ?? []
      setTimeline(Array.isArray(events) ? events : [])
    } catch (err) {
      console.error('Failed to fetch timeline', err)
      setTimeline([])
    } finally {
      setTimelineLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedIssue(null)
    setTimeline([])
    setLightboxOpen(false)
  }
  const openLightboxAt = (idx) => {
    setLightboxIndex(idx)
    setLightboxOpen(true)
  }

  // ---------- derived stats ----------
  const stats = useMemo(() => {
    const total = issues.length
    const resolvedItems = issues.filter((it) => isResolvedStatus(it.status))
    const resolved = resolvedItems.length
    const pending = total - resolved

  
    const durations = resolvedItems
      .map((it) => {
        if (!it.issueTakenUpTime || !it.resolvedAt) return null
        const start = new Date(it.issueTakenUpTime).getTime()
        const end = new Date(it.resolvedAt).getTime()
        if (!start || !end || end <= start) return null
        return (end - start) / (1000 * 60 * 60) // hours
      })
      .filter(Boolean)
    const avgHours =
      durations.length === 0 ? 0 : durations.reduce((a, b) => a + b, 0) / durations.length

    // staff count: try multiple possible fields
    const staffCount = municipality?.staffCount

    return {
      total,
      resolved,
      pending,
      avgHours,
      staffCount,
    }
  }, [issues, municipality])
  const COLORS = ['#22c55e', '#f97316'];
  const total = stats.pending+stats.resolved||1;
  const pieData = [
  { name: 'Resolved', value: total === 0 ? 0 : Math.round((stats.resolved / total) * 10000) / 100 },
  { name: 'Pending', value: total === 0 ? 0 : Math.round((stats.pending / total) * 10000) / 100 },
];

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* centered header */}
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-purple-800">Municipality — {slug}</h1>
          <p className="text-sm text-purple-600 mt-1 max-w-xl mx-auto">
            Issues taken up by this municipality. Select an issue to view details, images and timeline.
          </p>
        </header>

        {/* two-column layout: left list, right stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: issues list (col-span 8) */}
          <div className="lg:col-span-8 space-y-4">
            {loading ? (
              <div className="py-20 text-center text-purple-500">Loading issues…</div>
            ) : error ? (
              <div className="py-6 px-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
            ) : issues.length === 0 ? (
              <div className="py-16 text-center text-gray-500">No issues found for this municipality.</div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => {
                  const pri = String(issue.priority || issue.priorityLevel || '').trim()
                  const priCol = priorityColor(pri)
                  const upcount = countArrayOrNumber(issue.upvotes)
                  const downcount = countArrayOrNumber(issue.downvotes)

                  return (
                    <div
                      key={issue._id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-4 flex flex-col md:flex-row gap-3 items-stretch max-w-3xl"
                    >
                      {/* main left content */}
                      <div className="flex-1 flex flex-col gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{issue.title || 'Untitled issue'}</h3>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {categoryBadge(issue.category || issue.issueCategory)}
                            <div className={`px-2 py-1 rounded-full text-sm font-medium ${priCol.bg} ${priCol.text}`}>
                              {pri || '—'}
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2">{issue.content || issue.description || ''}</p>

                        <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-4 items-center">
                          <div className="flex items-center gap-2"><FaMapMarkerAlt className="text-purple-400" /> {issue.issueDistrict || '—'}</div>
                          <div className="flex items-center gap-2"><FaCalendarAlt className="text-purple-400" /> {formatDate(issue.issuePublishDate || issue.createdAt)}</div>
                          <div className="flex items-center gap-2">Status:
<span
  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
    issue.status === 'Not Resolved'
      ? 'bg-red-100 text-red-800'
      : isResolvedStatus(issue.status)
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-50 text-yellow-800'
  }`}
>
  {issue.status || '—'}
</span>
                          </div>
                        </div>

                        {/* last updated anchored to bottom of this left column */}
                        <div className="mt-auto text-xs text-gray-400">Last updated: {formatDate(issue.updatedAt)}</div>
                      </div>

                      {/* small right column */}
                      <div className="flex-shrink-0 w-full sm:w-48 flex flex-col justify-between gap-3">
                        <div className="flex flex-col text-sm">
                          <div className="text-gray-500">State</div>
                          <div className="font-medium text-gray-700">{issue.issueState || issue.state || '—'}</div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-500 flex items-center gap-1"><FaThumbsUp /> <span className="ml-1">{upcount}</span></div>
                            <div className="text-sm text-gray-500 flex items-center gap-1"><FaThumbsDown /> <span className="ml-1">{downcount}</span></div>
                          </div>
                        </div>

                        <button
                          onClick={() => openIssueModal(issue)}
                          className="mt-auto inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-purple-600 text-white text-sm hover:bg-purple-700"
                        >
                          <FaEye /> View
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: stats panel (col-span 4) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-purple-800 mb-3">Municipality Stats</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-purple-50 rounded">
                    <div className="text-xs text-purple-600">Total issues</div>
                    <div className="text-lg font-bold text-purple-800">{stats.total}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <div className="text-xs text-green-600">Resolved</div>
                    <div className="text-lg font-bold text-green-800">{stats.resolved}</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded">
                    <div className="text-xs text-yellow-600">Pending</div>
                    <div className="text-lg font-bold text-yellow-800">{stats.pending}</div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="text-xs text-gray-500">Staffs</div>
                    <div className="text-lg font-bold text-gray-800">{stats.staffCount}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-gray-500">Avg resolution time (hrs)</div>
                  <div className="text-xl font-semibold text-gray-800">{stats.avgHours ? stats.avgHours.toFixed(1) : '—'}</div>
                </div>
              </div>

         <div className="bg-white rounded-2xl p-4 shadow-sm">
  <h4 className="text-sm font-semibold text-purple-800 mb-3">Issues breakdown</h4>
  <div className="flex items-center justify-between">
    {/* Pie chart */}
    <div style={{ width: 120, height: 120 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            paddingAngle={4}
            label={({ name, value }) => `${name}: ${value}%`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
           <Tooltip formatter={(value, name) => `${value}% ${name}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>

    {/* Legend on top-right */}
    <div className="flex flex-col gap-2 ml-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-sm bg-green-500"></div>
        <span className="text-sm text-gray-700">Resolved</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-sm bg-orange-500"></div>
        <span className="text-sm text-gray-700">Pending</span>
      </div>
    </div>
  </div>
</div>


              <div className="bg-white rounded-2xl p-4 shadow-sm text-sm text-gray-600">
                <div className="font-medium text-gray-800">Municipality</div>
                <div className="mt-1">{municipality?.municipalityName ?? '—'}</div>
                <div className="mt-3 text-xs text-gray-500">District: {municipality?.district ?? '—'}</div>
                <div className="mt-1 text-xs text-gray-500">State: {municipality?.state ?? '—'}</div>
              </div>
            </div>
          </aside>
        </div>

        {/* Modal (issue details + images + timeline) */}
        {selectedIssue && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-auto max-h-[85vh]">
              <div className="p-5 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedIssue.title}</h2>
                  <div className="text-sm text-gray-500 mt-1">{selectedIssue.issueDistrict} • {formatDate(selectedIssue.issuePublishDate || selectedIssue.createdAt)}</div>
                </div>
                <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100 text-gray-600"><FaTimes /></button>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedIssue.content || selectedIssue.description || 'No description provided.'}</p>
                </div>

                {/* Images */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Images</h3>
                  {Array.isArray(selectedIssue.images) && selectedIssue.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedIssue.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => openLightboxAt(idx)}
                          className="overflow-hidden rounded-lg bg-gray-50 border"
                        >
                          <img src={img} alt={`issue-${idx}`} className="w-full h-40 object-cover transform hover:scale-105 transition" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No images available.</div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                 <h3 className="text-sm font-medium text-gray-700 mb-3">Timeline</h3>
                {timelineLoading ? (
                  <div className="text-sm text-purple-500">Loading…</div>
                ) : timeline.length === 0 ? (
                  <div className="text-sm text-gray-500">No events yet.</div>
                ) : (
                  <ul className="border-l-2 border-purple-200 pl-4 space-y-4">
                    {timeline.map((ev, i) => (
                      <li key={i} className="relative">
                        <div className="absolute -left-5 top-1 w-3 h-3 bg-purple-600 border-white border rounded-full"></div>
                        <div className="text-xs text-gray-400">{formatDate(ev.createdAt )}</div>
                        <div className="mt-0.5 font-semibold text-gray-800">{ev.title}</div>
                        <div className="text-sm text-gray-700">{ev.description}</div>
                        {ev.actorRole && (
                          <div className="text-xs mt-1 text-purple-600">By: {ev.actorRole}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxOpen && selectedIssue && Array.isArray(selectedIssue.images) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80">
            <button className="absolute top-6 right-6 text-white p-2 rounded-full" onClick={() => setLightboxOpen(false)}><FaTimes /></button>

            <div className="max-w-4xl w-full p-4">
              <div className="relative">
                <img src={selectedIssue.images[lightboxIndex]} alt="lightbox" className="w-full max-h-[80vh] object-contain rounded-lg" />
                {selectedIssue.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setLightboxIndex(i => (i - 1 + selectedIssue.images.length) % selectedIssue.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setLightboxIndex(i => (i + 1) % selectedIssue.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full"
                    >
                      ›
                    </button>
                  </>
                )}
                <div className="mt-2 text-center text-sm text-white">{lightboxIndex + 1} / {selectedIssue.images.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

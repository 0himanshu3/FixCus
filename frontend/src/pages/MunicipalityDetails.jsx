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

export default function MunicipalityDetails() {
  const { slug } = useParams()
  const [municipality, setMunicipality] = useState(null)
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // modal / lightbox state
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
        // backend may return { success: true, issues } or the municipality data + issues
        // We'll try to pick issues safely
        const data = res.data ?? {}
        // if returned object contains municipality meta + issues:
        const issuesList = data.issues ?? data.issuesList ?? data.issuesData ?? (Array.isArray(data) ? data : [])
        // municipality info fallback (if sending municipality itself)
        const muni = data.municipality ?? data.municipalityInfo ?? data.user ?? null

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
    return () => { mounted = false }
  }, [slug])

  const openIssueModal = async (issue) => {
    setSelectedIssue(issue)
    setLightboxIndex(0)
    setLightboxOpen(false)
    // fetch timeline events
    setTimeline([])
    setTimelineLoading(true)
    try {
      // Adjust route if your timeline endpoint differs
      const res = await axios.get(`http://localhost:3000/api/v1/issues/timeline/${issue._id}`, { withCredentials: true })
   
      const data = res.data.timelineEvents ?? {}
      const events =  []
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

  // nice memo for rendering
  const renderedIssues = useMemo(() => issues || [], [issues])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col items-center text-center">
        <h1 className="text-3xl font-extrabold text-purple-800">Municipality — {slug}</h1>
        <p className="text-sm text-purple-600 mt-1 max-w-md">
            Issues taken up by this municipality. Click View to see details, images and timeline.
        </p>
        </header>

        {loading ? (
          <div className="py-20 text-center text-purple-500">Loading issues…</div>
        ) : error ? (
          <div className="py-6 px-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
        ) : renderedIssues.length === 0 ? (
          <div className="py-16 text-center text-gray-500">No issues found for this municipality.</div>
        ) : (
          <div className="space-y-4">
            {renderedIssues.map((issue) => {
              const pri = String(issue.priority || issue.priorityLevel || '').trim()
              const priCol = priorityColor(pri)
              const upcount = countArrayOrNumber(issue.upvotes)
              const downcount = countArrayOrNumber(issue.downvotes)
              return (
             <div
            key={issue._id}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-4 flex flex-col md:flex-row gap-2 items-stretch max-w-3xl mx-auto"
            >
            {/* Left: main info */}
            <div className="flex-1 flex flex-col sm:flex-row gap-4 items-stretch">
                <div className="flex-1 flex flex-col gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{issue.title || 'Untitled issue'}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                    {categoryBadge(issue.category)}
                    <div className={`px-2 py-1 rounded-full text-sm font-medium ${priCol.bg} ${priCol.text}`}>
                    {pri || '—'}
                    </div>
                </div>

                <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><FaMapMarkerAlt className="text-purple-400" /> {issue.issueDistrict || '—'}</div>
                    <div className="flex items-center gap-2"><FaCalendarAlt className="text-purple-400" /> {formatDate(issue.issuePublishDate || issue.createdAt)}</div>
                    <div className="flex items-center gap-2">Status: 
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${issue.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>{issue.status || '—'}</span>
                    </div>
                </div>

                <div className="mt-auto text-xs text-gray-400">Last updated: {formatDate(issue.updatedAt)}</div>
                </div>

                {/* Right small column */}
                <div className="flex-shrink-0 w-full sm:w-1/3 flex flex-col justify-between">
                <div className="flex flex-col text-sm">
                    <div className="text-gray-500">State</div>
                    <div className="font-medium text-gray-700">{issue.issueState || '—'}</div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500 flex items-center gap-1"><FaThumbsUp /> <span className="ml-1">{upcount}</span></div>
                    <div className="text-sm text-gray-500 flex items-center gap-1"><FaThumbsDown /> <span className="ml-1">{downcount}</span></div>
                    </div>
                </div>

      {/* Compact View button */}
      <button
        onClick={() => openIssueModal(issue)}
        className="mt-auto inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-purple-600 text-white text-xs hover:bg-purple-700"
      >
        <FaEye className="text-sm" /> View
      </button>
    </div>
  </div>
</div>

              )
            })}
          </div>
        )}

        {/* Modal */}
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
                {/* Content */}
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
                    <div className="text-sm text-purple-500">Loading timeline…</div>
                  ) : timeline.length === 0 ? (
                    <div className="text-sm text-gray-500">No timeline events.</div>
                  ) : (
                    <ul className="border-l-2 border-purple-100 pl-4 space-y-4">
                      {timeline.map((ev, i) => (
                        <li key={i} className="relative">
                          <div className="absolute -left-5 top-0 w-3 h-3 rounded-full bg-purple-600 border-2 border-white"></div>
                          <div className="text-xs text-gray-400">{formatDate(ev.date || ev.createdAt || ev.time)}</div>
                          <div className="mt-1 text-sm text-gray-700">{ev.text || ev.message || ev.note || JSON.stringify(ev)}</div>
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

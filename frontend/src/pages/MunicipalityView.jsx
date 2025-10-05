// src/pages/MunicipalityView.jsx
import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { FaMapMarkerAlt, FaCalendarAlt, FaSearch, FaEye, FaSort } from 'react-icons/fa'

const LoadingGrid = ({ columns = 3, rows = 2 }) => {
  const items = Array.from({ length: columns * rows })
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((_, i) => (
        <div key={i} className="animate-pulse p-6 bg-white rounded-2xl shadow-md">
          <div className="h-6 w-1/2 bg-purple-100 rounded mb-4" />
          <div className="h-4 w-3/4 bg-purple-100 rounded mb-3" />
          <div className="h-3 w-1/2 bg-purple-100 rounded mb-6" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-20 bg-purple-100 rounded" />
            <div className="h-10 w-10 bg-purple-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

const EmptyState = ({ text = 'No municipalities found.' }) => (
  <div className="py-16 text-center text-purple-500">
    <div className="text-2xl font-semibold mb-2">{text}</div>
    <div className="text-sm">Try adjusting search or filters.</div>
  </div>
)

const formatDate = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

export default function MunicipalityView() {
  const nav = useNavigate()
  const [municipalities, setMunicipalities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 9

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    const fetchMunicipalities = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/auth/getmunicipalities', { withCredentials: true })
        const data = res.data?.users ?? res.data ?? []
        if (!Array.isArray(data)) throw new Error('Invalid response format')
        if (mounted) setMunicipalities(data)
      } catch (err) {
        console.error('Failed to fetch municipalities', err)
        if (mounted) setError('Failed to load municipalities. Try again later.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchMunicipalities()
    return () => { mounted = false }
  }, [])

  const slugFromEmail = (email = '') => {
    const left = (email.split('@')[0] || '').trim().toLowerCase()
    return left.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '')
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let arr = municipalities.filter((m) => {
      if (!q) return true
      return [m.municipalityName, m.email, m.district, m.state]
        .filter(Boolean)
        .some(field => String(field).toLowerCase().includes(q))
    })

    if (sortBy === 'name') {
      arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else if (sortBy === 'district') {
      arr.sort((a, b) => (a.district || '').localeCompare(b.district || ''))
    } else if (sortBy === 'est') {
      arr.sort((a, b) => {
        const A = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const B = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return B - A
      })
    }

    return arr
  }, [municipalities, query, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages])
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-purple-800">Municipalities</h2>
            <p className="mt-1 text-sm text-purple-500">Browse and manage all listed municipalities.</p>
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400"><FaSearch /></span>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                placeholder="Search by name, email, district..."
                className="pl-10 pr-4 py-2 w-72 rounded-full border border-purple-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-purple-200 bg-white shadow-sm">
                <FaSort className="text-purple-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-sm outline-none text-purple-800"
                >
                  <option value="name">Sort: Name</option>
                  <option value="district">Sort: District</option>
                  <option value="est">Sort: Newest</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        {loading ? (
          <LoadingGrid />
        ) : error ? (
          <div className="p-6 bg-red-100 border border-red-300 rounded text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((m) => (
                <div key={m._id || m.email} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-800">{m.municipalityName || 'Unnamed'}</h3>
                      <p className="text-sm text-gray-500 mt-1">{m.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">District</div>
                      <div className="text-sm font-medium text-gray-700">{m.district || '—'}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <FaMapMarkerAlt className="text-purple-400" />
                      {m.state || '—'}
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt className="text-purple-400" />
                      {formatDate(m.createdAt)}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-xs text-gray-400">Country: <span className="text-gray-700">{m.country || '—'}</span></div>
                    <button
                      onClick={() => nav(`/municipality/${slugFromEmail(m.email)}`)}
                      className="flex items-center gap-2 px-3 py-2 rounded-md bg-purple-600 text-white text-sm hover:bg-purple-700"
                    >
                      <FaEye /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-between items-center text-sm text-gray-600">
              <div>
                Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong> to <strong>{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length}</strong>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-purple-300 bg-white disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-3 py-1">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-purple-300 bg-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

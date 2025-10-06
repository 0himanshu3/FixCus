import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

export default function FillApplicationPage() {
  const { user } = useSelector((s) => s.auth || {})
  const navigate = useNavigate()

  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [formData, setFormData] = useState({
    address: '',
    supportingDocuments: [], // File objects (client-side)
    message: '',
    establishmentDate: '',
  })
  const [existingApplication, setExistingApplication] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // redirect to home if not logged in
  useEffect(() => {
    if (!user) navigate('/')
  }, [user, navigate])

  // fetch any existing application data for this user (if any)
  useEffect(() => {
    let mounted = true
    const fetchApplication = async () => {
      if (!user?._id) return
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get(
          `http://localhost:3000/api/v1/municipality/getInfo/${user._id}`,
          { withCredentials: true }
        )
        if (!mounted) return
        const payload = res.data?.application ?? res.data ?? null
        setExistingApplication(payload || null)
      } catch (err) {
        console.error('fetchApplication error', err)
        if (mounted) setError('Failed to load existing application (if any).')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchApplication()
    return () => { mounted = false }
  }, [user?._id])

  const canSubmitApplication = !existingApplication && !user?.accountApproved

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({ ...prev, supportingDocuments: files }))
  }

  const clearForm = () => {
    setFormData({
      address: '',
      supportingDocuments: [],
      message: '',
      establishmentDate: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?._id) {
      toast.error('You must be logged in.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = {
        address: formData.address,
        establishmentDate: formData.establishmentDate,
        message: formData.message,
        adminName: user?.name || '',
        municipalityName: user?.municipalityName || user?.name || '',
        userId: user?._id || '',
        supportingDocuments: formData.supportingDocuments.map((f) => f.name),
      }

      const res = await axios.post(
        'http://localhost:3000/api/v1/municipality/apply',
        payload,
        { withCredentials: true }
      )

      if (res.status >= 200 && res.status < 300) {
        toast.success('Application submitted successfully!')
        setShowApplicationForm(false)
        clearForm()
        // backend may return created application in res.data.application or res.data
        const data = res.data?.application ?? res.data ?? null
        setExistingApplication(data)
      } else {
        toast.error(res.data?.message || 'Submission failed.')
      }
    } catch (err) {
      console.error('submit application error', err)
      setError(err?.response?.data?.message || 'Failed to submit application.')
      toast.error(err?.response?.data?.message || 'Failed to submit application.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-purple-800">Municipality Application</h1>
          <p className="mt-2 text-sm text-purple-600">
            Apply to have your municipality account approved and linked to the platform.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-purple-600 py-8">Loading…</div>
        ) : (
          <>
            {/* If user already approved */}
            {user?.accountApproved ? (
              <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-200">
                <h2 className="text-xl font-semibold text-gray-900">Account Approved</h2>
                <p className="mt-2 text-sm text-purple-600">
                  Your municipality account is already approved. Thank you!
                </p>

                <div className="mt-4 text-sm text-gray-700">
                  <div><strong>Municipality:</strong> {user?.municipalityName ?? '—'}</div>
                  <div><strong>District:</strong> {user?.district ?? '—'}</div>
                </div>
              </div>
            ) : (
              <>
                {/* If existing application */}
                {existingApplication ? (
                  <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-200 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Application Status</h2>
                        <p className="mt-2 text-sm text-purple-600">
                          Your application is submitted and pending review.
                        </p>
                      </div>
                      <div className="text-sm text-gray-700">
                        <div className="font-medium">Status</div>
                        <div className="mt-1 text-sm text-purple-700">
                          {existingApplication.status ?? existingApplication.approvalStatus ?? 'Pending'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-700 space-y-2">
                      <div><strong>Municipality name:</strong> {existingApplication.municipalityName ?? existingApplication.name ?? '—'}</div>
                      <div><strong>Admin name:</strong> {existingApplication.adminName ?? existingApplication.admin ?? user?.name ?? '—'}</div>
                      <div><strong>Address:</strong> {existingApplication.address ?? '—'}</div>
                      <div><strong>Establishment date:</strong> {existingApplication.establishmentDate ? new Date(existingApplication.establishmentDate).toLocaleDateString() : '—'}</div>
                      <div>
                        <strong>Supporting documents:</strong>
                        {Array.isArray(existingApplication.supportingDocuments) && existingApplication.supportingDocuments.length > 0 ? (
                          <ul className="list-disc ml-5 mt-1 text-gray-600">
                            {existingApplication.supportingDocuments.map((d, idx) => <li key={idx}>{d}</li>)}
                          </ul>
                        ) : <span className="ml-2 text-gray-500"> None</span>}
                      </div>
                      <div className="mt-3">
                        <strong>Message:</strong>
                        <div className="mt-1 text-gray-700 whitespace-pre-wrap">{existingApplication.message ?? '—'}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">No Application Found</h2>
                    <p className="mt-2 text-sm text-purple-600">
                      You don't have a submitted application yet. You can submit one to request municipality access.
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      {!showApplicationForm && canSubmitApplication && (
                        <button
                          onClick={() => setShowApplicationForm(true)}
                          className="bg-indigo-600 cursor-pointer hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition"
                        >
                          Fill Application Form
                        </button>
                      )}

                      {!canSubmitApplication && (
                        <div className="text-sm text-gray-600">You cannot submit an application at the moment.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Application Form */}
                {showApplicationForm && !user?.accountApproved && (
                  <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Municipality Application Form</h2>
                      <button
                        onClick={() => { setShowApplicationForm(false); clearForm() }}
                        className="text-sm cursor-pointer text-gray-500 hover:text-gray-700"
                        title="Close form"
                      >
                        ✕
                      </button>
                    </div>

                    {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <input type="hidden" name="adminName" value={user?.name || ''} />
                      <input type="hidden" name="municipalityName" value={user?.municipalityName || ''} />

                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                        <textarea
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Enter your municipality address"
                        />
                      </div>

                      <div>
                        <label htmlFor="establishmentDate" className="block text-sm font-medium text-gray-700 mb-2">Establishment Date *</label>
                        <input
                          type="date"
                          id="establishmentDate"
                          name="establishmentDate"
                          value={formData.establishmentDate}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label htmlFor="supportingDocuments" className="block text-sm font-medium text-gray-700 mb-2">Supporting Documents (Images)</label>
                        <input
                          type="file"
                          id="supportingDocuments"
                          name="supportingDocuments"
                          onChange={handleFileChange}
                          multiple
                          accept="image/*,application/pdf"
                          className="w-full"
                        />
                        {formData.supportingDocuments.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Selected files:</p>
                            <ul className="text-sm text-gray-500 list-disc ml-5">
                              {formData.supportingDocuments.map((file, index) => (
                                <li key={index}>• {file.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Describe your municipality and why you need access to this platform"
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={saving}
                          className="bg-green-600 cursor-pointer hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-60"
                        >
                          {saving ? 'Submitting…' : 'Submit Application'}
                        </button>

                        <button
                          type="button"
                          onClick={() => { setShowApplicationForm(false); clearForm() }}
                          className="bg-gray-300 cursor-pointer hover:bg-gray-400 text-gray-900 font-semibold py-2 px-6 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'

const MuncipalityMain = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [formData, setFormData] = useState({
    address: '',
    supportingDocuments: [],
    message: '',
    establishmentDate: '',
  })
  const [existingApplication, setExistingApplication] = useState(null)

  useEffect(() => {
    if (!user) navigate('/')
  }, [user, navigate])

  useEffect(() => {
    const fetchApplication = async () => {
      if (!user?._id) return
      try {
        const res = await fetch(`http://localhost:3000/api/v1/municipality/getInfo/${user._id}`)
        const data = await res.json()
        if (res.ok) setExistingApplication(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchApplication()
  }, [user?._id])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setFormData(prev => ({ ...prev, supportingDocuments: files }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      address: formData.address,
      establishmentDate: formData.establishmentDate,
      message: formData.message,
      adminName: user?.name || '',
      municipalityName: user?.municipalityName || '',
      userId: user?._id || '',
      supportingDocuments: formData.supportingDocuments.map(f => f.name)
    }

    try {
      const res = await fetch('http://localhost:3000/api/v1/municipality/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        alert('Application submitted successfully!')
        setShowApplicationForm(false)
        setFormData({ address: '', supportingDocuments: [], message: '', establishmentDate: '' })
        setExistingApplication(data)
      } else {
        alert(data?.message || 'Submission failed.')
      }
    } catch (err) {
      console.error(err)
      alert('Something went wrong.')
    }
  }

  const canSubmitApplication =
    !existingApplication || existingApplication.status === 'rejected'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">
            Welcome, {user?.name}!
          </h1>
          {user?.accountApproved && (
            <Link
              to="/municipality/issues"
              className="ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Issues
            </Link>
          )}
        </div>

        {/* Message section */}
        <div className="text-center mb-8">
          {user?.accountApproved ? (
            <p className="text-lg text-gray-600">
              Your municipality account is approved. You can now operate in your district.
            </p>
          ) : (
            <>
              <p className="text-lg text-gray-600 mb-6">
                Your municipality account is pending approval.
              </p>
              {!showApplicationForm && canSubmitApplication && (
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-200"
                >
                  Fill Application Form
                </button>
              )}
            </>
          )}
        </div>

        {/* Application Form */}
        {showApplicationForm && !user?.accountApproved && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Municipality Application Form</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="hidden" name="adminName" value={user?.name || ''} />
              <input type="hidden" name="municipalityName" value={user?.municipalityName || ''} />

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter your municipality address"
                />
              </div>

              <div>
                <label htmlFor="establishmentDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Establishment Date *
                </label>
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
                <label htmlFor="supportingDocuments" className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Documents (Images) 
                </label>
                <input
                  type="file"
                  id="supportingDocuments"
                  name="supportingDocuments"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {formData.supportingDocuments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Selected files:</p>
                    <ul className="text-sm text-gray-500">
                      {formData.supportingDocuments.map((file, index) => (
                        <li key={index}>• {file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
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
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
                >
                  Submit Application
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default MuncipalityMain

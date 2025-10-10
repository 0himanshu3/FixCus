import React, { useEffect, useState } from 'react'

const ApplicationRequest = () => {
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/municipality/requests/pending`, {
        method: 'GET',
        credentials: 'include', 
        headers: {
          'Content-Type': 'application/json'
        }
      })

        const data = await res.json()
        if (res.ok) setRequests(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchRequests()
  }, [])

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/municipality/requests/${id}/approve`, {
      method: 'PATCH',
      credentials: 'include', 
      headers: {
        'Content-Type': 'application/json'
      }
    });
      if (res.ok) setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'approved' } : r))
      setSelectedRequest(null)
    } catch (err) { console.error(err) }
  }

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/municipality/requests/${id}/reject`, 
        { method: 'PATCH',
      credentials: 'include', 
      headers: {
        'Content-Type': 'application/json'
      }
    })
      if (res.ok) setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'rejected' } : r))
      setSelectedRequest(null)
    } catch (err) { console.error(err) }
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 py-8">
    <div className="max-w-5xl mx-auto px-4">
      <h1 className="text-4xl font-black text-yellow-300 mb-6 overflow-hidden" style={{ textShadow: '3px 3px 0px rgba(236, 72, 153, 0.5)' }}>
        🏛️ Pending Municipality Applications
      </h1>

      <div className="bg-gradient-to-br from-pink-200 to-pink-300 shadow-xl rounded-2xl border-4 border-purple-600 overflow-hidden">
        {/* SCROLLABLE TABLE */}
        <div className="max-h-[600px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#9333ea #f9a8d4' }}>
          <table className="min-w-full divide-y divide-purple-300">
            <thead className="bg-purple-700 text-yellow-300 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-center text-sm font-black uppercase tracking-wider">
                  Municipality Name
                </th>
                <th className="px-6 py-3 text-center text-sm font-black uppercase tracking-wider">
                  Admin Name
                </th>
                <th className="px-6 py-3 text-center text-sm font-black uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-sm font-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-purple-300">
              {requests.map(request => (
                <tr key={request._id} className="hover:bg-pink-100 bg-white/70 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-purple-900">{request.municipalityName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-purple-900">{request.adminName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-black rounded-full border-2 ${
                      request.status === 'pending' ? 'bg-yellow-300 text-purple-900 border-yellow-500' :
                      request.status === 'approved' ? 'bg-green-400 text-white border-green-600' :
                      'bg-red-400 text-white border-red-600'
                    }`}>
                      {request.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center overflow-hidden">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="bg-purple-700 text-pink-100 px-4 py-2 rounded-full font-bold hover:bg-purple-800 border-2 border-pink-300 shadow-md transition-all duration-200 will-change-transform"
                    >
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-purple-900/95 flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative border-4 border-purple-600 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-3 right-3 text-3xl font-black text-purple-900 hover:text-purple-700"
            >
              ✕
            </button>
            
            <h2 className="text-3xl font-black text-purple-900 mb-4 overflow-hidden">
              {selectedRequest.municipalityName}
            </h2>
            <p className="text-xl font-bold text-purple-800 mb-6">👤 {selectedRequest.adminName}</p>
            
            <div className="space-y-4">
              <div className="bg-white/70 p-4 rounded-lg border-4 border-purple-500">
                <p className="font-bold text-purple-900">
                  <strong className="text-purple-700">📋 Status:</strong>{' '}
                  <span className={`px-3 py-1 rounded-full text-sm font-black ${
                    selectedRequest.status === 'pending' ? 'bg-yellow-300 text-purple-900' :
                    selectedRequest.status === 'approved' ? 'bg-green-400 text-white' :
                    'bg-red-400 text-white'
                  }`}>
                    {selectedRequest.status.toUpperCase()}
                  </span>
                </p>
              </div>

              <div className="bg-white/70 p-4 rounded-lg border-4 border-purple-500">
                <p className="font-bold text-purple-900">
                  <strong className="text-purple-700">📍 Address:</strong> {selectedRequest.address}
                </p>
              </div>

              <div className="bg-white/70 p-4 rounded-lg border-4 border-purple-500">
                <p className="font-bold text-purple-700 mb-2">💬 Message:</p>
                <p className="font-semibold text-purple-900">{selectedRequest.message}</p>
              </div>

              <div className="bg-white/70 p-4 rounded-lg border-4 border-purple-500">
                <p className="font-bold text-purple-700 mb-2">📎 Supporting Documents:</p>
                {selectedRequest.supportingDocuments.length === 0 ? (
                  <p className="font-semibold text-purple-600 italic">No documents uploaded.</p>
                ) : (
                 <ul className="list-disc ml-5 space-y-1">
                  {selectedRequest.supportingDocuments.map((doc, idx) => (
                    <li key={idx} className="font-semibold text-purple-900 flex items-center gap-3">
                      <span>File {idx + 1}</span>
                      <a
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-700 hover:bg-purple-800 text-white px-2 py-1 text-xs rounded shadow"
                      >
                        View PDF
                      </a>
                    </li>
                  ))}
                </ul>


                )}
              </div>
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="flex justify-end gap-4 mt-6 overflow-hidden">
                <button
                  onClick={() => handleReject(selectedRequest._id)}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-full font-black hover:brightness-110 border-2 border-white shadow-lg transition-all duration-200 will-change-transform"
                >
                  ❌ Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest._id)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full font-black hover:brightness-110 border-2 border-white shadow-lg transition-all duration-200 will-change-transform"
                >
                  ✅ Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);

}

export default ApplicationRequest

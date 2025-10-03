import React, { useEffect, useState } from 'react'

const ApplicationRequest = () => {
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/v1/municipality/requests/pending')
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
      const res = await fetch(`http://localhost:3000/api/v1/municipality/requests/${id}/approve`, { method: 'PATCH' })
      if (res.ok) setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'approved' } : r))
      setSelectedRequest(null)
    } catch (err) { console.error(err) }
  }

  const handleReject = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/municipality/requests/${id}/reject`, { method: 'PATCH' })
      if (res.ok) setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'rejected' } : r))
      setSelectedRequest(null)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Pending Municipality Applications</h1>

        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
        Municipality Name
      </th>
      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
        Admin Name
      </th>
      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
        Status
      </th>
      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
        Actions
      </th>
    </tr>
  </thead>

            <tbody className="divide-y divide-gray-200">
              {requests.map(request => (
                <tr key={request._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{request.municipalityName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.adminName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${request.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-200 text-green-800' :
                        'bg-red-200 text-red-800'}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-2/3 max-w-2xl p-6 relative">
              <button
                onClick={() => setSelectedRequest(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold mb-4">{selectedRequest.municipalityName} - {selectedRequest.adminName}</h2>
              <p className="mb-2"><strong>Status:</strong> <span className="text-yellow-600">{selectedRequest.status}</span></p>
              <p className="mb-4"><strong>Address:</strong> {selectedRequest.address}</p>
              <p className="mb-4"><strong>Message:</strong> {selectedRequest.message}</p>

              <div className="mb-4">
                <strong>Supporting Documents:</strong>
                {selectedRequest.supportingDocuments.length === 0 ? (
                  <p className="text-gray-500">No documents uploaded.</p>
                ) : (
                  <ul className="list-disc ml-5">
                    {selectedRequest.supportingDocuments.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end gap-4">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReject(selectedRequest._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequest._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default ApplicationRequest

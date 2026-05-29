import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPatients } from '../services/patientService'

export default function Dashboard() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toDateString()
  const todayCount = patients.filter(p => {
    if (!p.createdAt) return false
    const d = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt)
    return d.toDateString() === today
  }).length

  const byType = (type) => patients.filter(p => p.visitType === type).length

  const stats = [
    { 
      label: 'Total Patients', 
      value: patients.length, 
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-600 shadow-lg shadow-blue-500/20 backdrop-blur-xl', 
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ) 
    },
    { 
      label: "Today's Patients", 
      value: todayCount, 
      color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-lg shadow-emerald-500/20 backdrop-blur-xl', 
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ) 
    },
    { 
      label: 'Free Camp', 
      value: byType('Free Camp'), 
      color: 'bg-orange-500/10 border-orange-500/20 text-orange-600 shadow-lg shadow-orange-500/20 backdrop-blur-xl', 
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V8l7-5 7 5v13" />
        </svg>
      ) 
    },
    { 
      label: 'Clinic Visits', 
      value: byType('Clinic Visit'), 
      color: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-600 shadow-lg shadow-fuchsia-500/20 backdrop-blur-xl', 
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ) 
    },
    { 
      label: 'Online Patients', 
      value: byType('Online Patient'), 
      color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 shadow-lg shadow-cyan-500/20 backdrop-blur-xl', 
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ) 
    },
  ]

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalPages = Math.ceil(patients.length / itemsPerPage)
  const currentPatients = patients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome to BLUETEETH Patient Portal</p>
        </div>
        <Link
          to="/add-patient"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Patient
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 p-5 hover:shadow-md transition-all hover:-translate-y-1">
            <div className={`w-12 h-12 ${s.color} rounded-xl border flex items-center justify-center mb-4 transition-transform`}>
              {s.icon}
            </div>
            <p className="text-3xl font-extrabold text-gray-800">{s.value}</p>
            <p className="text-gray-500 text-xs mt-1 font-medium tracking-wide uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent patients */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Recent Patients
          </h2>
          <Link to="/patients" className="text-indigo-600 text-sm font-bold hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
            View All
          </Link>
        </div>

        {patients.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>No patients added yet.</p>
            <Link to="/add-patient" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
              Add your first patient
            </Link>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Mobile</th>
                    <th className="px-6 py-4 text-left">Disease</th>
                    <th className="px-6 py-4 text-left">Visit Type</th>
                    <th className="px-6 py-4 text-left">Doctor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentPatients.map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{p.patientName}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{p.mobile}</td>
                      <td className="px-6 py-4 text-slate-600">{p.disease}</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          {p.visitType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{p.doctorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <p className="text-sm text-gray-500 font-medium">
                  Showing <span className="font-bold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, patients.length)}</span> of <span className="font-bold text-gray-800">{patients.length}</span> records
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-white hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-white hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

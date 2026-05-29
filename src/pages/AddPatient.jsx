import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addPatient } from '../services/patientService'

const VISIT_TYPES = ['Clinic Visit', 'Free Camp', 'Website Patient']

const initialForm = {
  patientName: '',
  age: '',
  mobile: '',
  address: '',
  disease: '',
  treatment: '',
  treatmentCharge: '',
  doctorName: '',
  visitType: 'Clinic Visit',
}

export default function AddPatient() {
  const [form, setForm] = useState(initialForm)
  const [reportFile, setReportFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.patientName || !form.mobile) {
      setError('Patient name and mobile number are required.')
      return
    }
    if (form.mobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits.')
      return
    }
    if (reportFile && reportFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await addPatient(form, reportFile)
      navigate('/patients')
    } catch (err) {
      setError(err.message || 'Failed to save patient. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          type="button"
          className="p-2 -ml-2 rounded-full hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm transition-all text-gray-500 hover:text-blue-600"
          title="Go Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add New Patient</h1>
          <p className="text-gray-500 text-sm mt-0.5">Fill in the patient details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">

        {/* Personal Info */}
        <div>
          <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-4">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name <span className="text-red-500">*</span>
              </label>
              <input
                name="patientName"
                value={form.patientName}
                onChange={e => setForm(prev => ({ ...prev, patientName: e.target.value.replace(/\b\w/g, c => c.toUpperCase()) }))}
                placeholder="Full name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                name="age"
                type="number"
                value={form.age}
                onChange={e => {
                  const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  setForm(prev => ({ ...prev, age: val === 0 && e.target.value === '' ? '' : String(val) }))
                }}
                placeholder="e.g. 35"
                min="0"
                max="100"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                name="mobile"
                type="tel"
                value={form.mobile}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setForm(prev => ({ ...prev, mobile: val }))
                }}
                placeholder="10-digit number"
                maxLength={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                name="address"
                value={form.address}
                onChange={e => setForm(prev => ({ ...prev, address: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) }))}
                placeholder="Patient address"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Medical Info */}
        <div>
          <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-4">
            Medical Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disease / Complaint</label>
              <input
                name="disease"
                value={form.disease}
                onChange={e => setForm(prev => ({ ...prev, disease: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) }))}
                placeholder="e.g. Tooth Infection"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
              <input
                name="treatment"
                value={form.treatment}
                onChange={e => setForm(prev => ({ ...prev, treatment: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) }))}
                placeholder="e.g. Root Canal"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Charge (₹)</label>
              <input
                name="treatmentCharge"
                type="number"
                value={form.treatmentCharge}
                onChange={handleChange}
                placeholder="e.g. 3500"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
              <input
                name="doctorName"
                value={form.doctorName}
                onChange={e => setForm(prev => ({ ...prev, doctorName: e.target.value.replace(/\b\w/g, c => c.toUpperCase()) }))}
                placeholder="e.g. Dr. Aman"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
              <div className="relative">
                <select
                  name="visitType"
                  value={form.visitType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none"
                >
                  {VISIT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Report Upload */}
        <div>
          <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-4">
            Report Upload (Optional)
          </h3>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Report (PDF / JPG / PNG)
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setReportFile(e.target.files[0])}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600 file:text-sm cursor-pointer"
          />
          {reportFile && (
            <p className="text-green-600 text-xs mt-1">
              ✓ {reportFile.name} ({(reportFile.size / 1024).toFixed(0)} KB)
              {reportFile.size > 5 * 1024 * 1024 && <span className="text-red-500 ml-2">File too large (max 5MB)</span>}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? (reportFile ? 'Uploading...' : 'Saving...') : 'Save Patient'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

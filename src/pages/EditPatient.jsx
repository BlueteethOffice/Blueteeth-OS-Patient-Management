import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPatient, updatePatient } from '../services/patientService'
import ServiceDropdown from '../components/ServiceDropdown'

const getReportUrl = (url) => {
  if (!url) return url
  return url
}

const VISIT_TYPES = ['Clinic Visit', 'Free Camp', 'Online Patient']

const today = new Date().toISOString().split('T')[0]

export default function EditPatient() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [reportFile, setReportFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getPatient(id)
      .then(data => setForm(data))
      .catch(() => setError('Patient not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.patientName || !form.mobile) {
      setError('Patient name and mobile number are required.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await updatePatient(id, form, reportFile)
      navigate('/patients')
    } catch (err) {
      setError('Failed to update patient. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (!form) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-3">⚠️</p>
      <p>Patient not found.</p>
    </div>
  )

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
          <h1 className="text-2xl font-bold text-gray-800">Edit Patient</h1>
          <p className="text-gray-500 text-sm mt-0.5">Update details for {form.patientName}</p>
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
                  setForm(prev => ({ ...prev, age: e.target.value === '' ? '' : String(val) }))
                }}
                min="0" max="100"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Treatment Date — editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Date
                <span className="ml-1.5 text-xs text-blue-500 font-normal">● Editable</span>
              </label>
              <input
                name="visitDate"
                type="date"
                value={form.visitDate || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>

            {/* Record Submit Date — locked */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Record Submit Date
                <span className="ml-1.5 text-xs text-emerald-600 font-normal">🔒 Auto</span>
              </label>
              <div className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500 flex items-center gap-2 cursor-not-allowed select-none">
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {form.createdAt
                  ? (form.createdAt.toDate ? form.createdAt.toDate() : new Date(form.createdAt))
                      .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                }
                <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Original</span>
              </div>
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
            {/* Services Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
              <ServiceDropdown
                value={form.disease || ''}
                onChange={(val) => setForm(prev => ({ ...prev, disease: val }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
              <input
                name="treatment"
                value={form.treatment}
                onChange={e => setForm(prev => ({ ...prev, treatment: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) }))}
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

        {/* Report */}
        <div>
          <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-4">
            Report
          </h3>
          {form.reportURL && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700">Current report: {form.reportName || 'View file'}</span>
              <a
                href={getReportUrl(form.reportURL)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-xs hover:underline"
              >
                Open ↗
              </a>
            </div>
          )}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {form.reportURL ? 'Replace Report' : 'Upload Report'} (PDF / JPG / PNG)
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setReportFile(e.target.files[0])}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600 file:text-sm cursor-pointer"
          />
          {reportFile && (
            <p className="text-green-600 text-xs mt-1">✓ {reportFile.name}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            {saving ? 'Saving...' : 'Update Patient'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

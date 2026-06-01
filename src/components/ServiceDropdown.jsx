import React, { useState, useRef, useEffect } from 'react'

export const DENTAL_SERVICES = [
  'Dental Implant',
  'PFM Crown',
  'CAD-CAM/DMLS Crown',
  'Zirconia Crown',
  'Zirconia Premium Crown',
  'Re-cementation (GIC)',
  'Ceramic Veneer',
  'Teeth Aligners',
  'Tooth Coloured Braces',
  'Metal Braces',
  "Hawley's Retainer",
  'Fixed Retainer',
  'Oral Prophylaxis',
  'Flap Surgery',
  'Root Planing',
  'Mobile Teeth Splinting',
  'Complete Dentures (Upper & Lower)',
  'Single Denture',
  'Acrylic Partial Denture (Per Tooth)',
  'Flexible Partial Denture',
  'Root Canal Treatment (Simple)',
  'Re-Root Canal Treatment',
  'Core Build-up (Low Compressive Strength)',
  'Core Build-up (High Compressive Strength)',
  'Simple Extraction Per Tooth',
  'Complicated Extraction Per Tooth',
  'Simple Wisdom Tooth Removal',
  'Complicated Wisdom Tooth Removal',
  "Doctor's Consultation",
  'Periapical X Ray',
  'Composite Resin',
  'Glass Ionomer Cement',
  'Temporary Cement',
]

export default function ServiceDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  const searchRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search when opened
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus()
  }, [open])

  const filtered = DENTAL_SERVICES.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (service) => {
    onChange(service)
    setOpen(false)
    setSearch('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-blue-400
          ${open ? 'border-blue-400 ring-2 ring-blue-400' : 'border-gray-300'}
          ${value ? 'text-gray-800' : 'text-gray-400'}
          bg-white`}
      >
        <span className="truncate">{value || '— Select Service —'}</span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {value && (
            <span
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500 cursor-pointer p-0.5 rounded transition-colors"
              title="Clear"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown panel — always opens downward */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search box */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search service..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Options list — fixed height, scrollable */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No services found</li>
            ) : (
              filtered.map(service => (
                <li
                  key={service}
                  onClick={() => handleSelect(service)}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors
                    ${value === service
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {service}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

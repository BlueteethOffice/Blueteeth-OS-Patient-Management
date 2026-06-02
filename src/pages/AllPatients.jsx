import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getPatients, deletePatient } from '../services/patientService'
import { useAuth } from '../context/AuthContext'
import jsPDF from 'jspdf'
import { PDFDocument } from 'pdf-lib'
import blueteethLogo from '../assets/blueteeth-logo.png'

const getReportUrl = (url) => {
  if (!url) return url
  // Using direct URL instead of Google Docs Viewer to prevent getting stuck
  return url
}

const isPdfDownload = (url) => {
  return false // User specifically requested NOT to download
}

const VISIT_BADGE = {
  'Clinic Visit': 'bg-blue-100 text-blue-700',
  'Free Camp': 'bg-orange-100 text-orange-700',
  'Online Patient': 'bg-teal-100 text-teal-700',
}

export default function AllPatients() {
  const { user } = useAuth()
  const isAdmin = user?.email === 'admin@blueteeth.in'
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [visitFilter, setVisitFilter] = useState('All')
  const [deleting, setDeleting] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)

  const load = () => {
    setLoading(true)
    getPatients()
      .then(data => {
        const enriched = data.map((p, i) => ({
          ...p,
          serialId: String(data.length - i).padStart(3, '0')
        }))
        setPatients(enriched)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (patient) => {
    if (!window.confirm(`Delete patient "${patient.patientName}"? This cannot be undone.`)) return
    setDeleting(patient.id)
    try {
      await deletePatient(patient.id, patient.reportURL)
      setPatients(prev => prev.filter(p => p.id !== patient.id))
    } catch (err) {
      alert('Failed to delete patient.')
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  const handlePrint = async () => {
    const p = selectedPatient
    const isPdfReport = p.reportURL && p.reportURL.toLowerCase().endsWith('.pdf')

    if (isPdfReport) {
      setDownloading(true); // Reuse downloading state for spinner
      try {
        let logoDataUrl = null;
        let logoAspect = 1;
        try {
          const logo = await assetToDataUrl(blueteethLogo);
          logoDataUrl = logo.dataUrl;
          logoAspect = logo.w / logo.h || 1;
        } catch (e) {}

        let reportPdfBytes = null;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const resp = await fetch(p.reportURL, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (resp.ok && !resp.headers.get('content-type')?.includes('text/html')) {
            reportPdfBytes = await resp.arrayBuffer();
          }
        } catch (e) {
          console.warn("Could not fetch PDF for print:", e);
        }

        if (reportPdfBytes) {
          const detailsPdf = await buildPatientPdf(p, logoDataUrl, logoAspect);
          const detailsBytes = detailsPdf.output('arraybuffer');

          const merged = await PDFDocument.create();
          const detailsDoc = await PDFDocument.load(detailsBytes);
          const reportDoc = await PDFDocument.load(reportPdfBytes);

          const dPages = await merged.copyPages(detailsDoc, detailsDoc.getPageIndices());
          dPages.forEach(pg => merged.addPage(pg));
          const rPages = await merged.copyPages(reportDoc, reportDoc.getPageIndices());
          rPages.forEach(pg => merged.addPage(pg));

          const mergedBytes = await merged.save();
          const blob = new Blob([mergedBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const printWin = window.open(url, '_blank');
          if (!printWin) {
            alert("Popup blocked! Please allow popups to view the full PDF for printing.");
          }
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        } else {
          window.open(p.reportURL, '_blank');
        }
      } catch (err) {
        console.error(err);
        alert("Failed to prepare full PDF for printing.");
      } finally {
        setDownloading(false);
      }
      return;
    }

    const reportViewUrl = p.reportURL

    const footerHtml = `
      <div class="footer">
        <div class="fi"><div class="ic" style="background:#3b82f6"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg></div><span class="ft">9311997440</span></div>
        <div class="sep"></div>
        <div class="fi"><div class="ic" style="background:#22c55e"><svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.304A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg></div><div><div class="ft">WhatsApp</div><div class="fs">Delhi NCR, India</div></div></div>
        <div class="sep"></div>
        <div class="fi"><div class="ic" style="background:#ef4444"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><span class="fs">support@blueteeth.in</span></div>
        <div class="sep"></div>
        <div class="fi"><div class="ic" style="background:#f59e0b"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div><div class="ft">8 AM - 8 PM</div><div class="fs">Mon - Sun</div></div></div>
        <div class="sep"></div>
        <div class="fi"><div class="ic" style="background:linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></div><span class="ft">@blueteethpvt.ltd</span></div>
        <div class="sep"></div>
        <div class="fi"><div class="ic" style="background:#14b8a6"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg></div><span class="fs">www.blueteeth.in</span></div>
      </div>`

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Patient Record - ${p.patientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #fff;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── PAGE WRAPPER ── */
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      display: flex;
      flex-direction: column;
      page-break-after: always;
    }
    .page:last-child { page-break-after: auto; }

    /* ── HEADER ── */
    .hdr {
      background: #1e3a8a;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 4px solid #3b82f6;
      flex-shrink: 0;
    }
    .hdr-logo { height: 44px; width: auto; background:#fff; padding:5px; border-radius:6px; }
    .hdr-brand { margin-left: 12px; }
    .hdr-brand h1 { font-size: 20px; font-weight: 900; color: #fff; letter-spacing: 1px; }
    .hdr-brand p  { font-size: 10px; color: #93c5fd; font-weight: 600; margin-top: 2px; }
    .hdr-right { text-align: right; }
    .hdr-right h2 { font-size: 15px; font-weight: 800; color: #fff; }
    .badge { display: inline-block; background: #fff; color: #1e3a8a; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 999px; margin-top: 6px; text-transform: uppercase; }

    /* ── CONTENT ── */
    .content { padding: 18px 20px; flex: 1; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .card { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
    .card-hdr { background: #f1f5f9; padding: 9px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #334155; border-bottom: 1px solid #e2e8f0; }
    .card-body { padding: 14px; }
    .lbl { font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; display: block; margin-bottom: 3px; }
    .val { font-size: 13px; font-weight: 700; color: #0f172a; display: block; margin-bottom: 12px; }
    .val:last-child { margin-bottom: 0; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .disease-pill { display: inline-block; background: #fffbeb; border: 1px solid #fef3c7; color: #b45309; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 6px; }
    .charge { color: #059669; font-size: 15px; }

    /* ── REPORT SECTION ── */
    .report-hdr { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 14px; font-size: 11px; font-weight: 800; color: #92400e; margin-bottom: 10px; }
    .report-img { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; display: block; }
    .report-frame { width: 100%; height: 500px; border: 1px solid #e2e8f0; border-radius: 8px; }

    /* ── FOOTER ── */
    .footer {
      background: #0f172a;
      border-top: 3px solid #3b82f6;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      flex-wrap: nowrap;
      gap: 0;
    }
    .fi { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .ic { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ft { color: #fff; font-weight: 800; font-size: 10px; white-space: nowrap; }
    .fs { color: #93c5fd; font-size: 9px; white-space: nowrap; }
    .sep { width: 1px; height: 24px; background: #1e3a5f; margin: 0 6px; flex-shrink: 0; }

    @media print {
      body { background: #fff; }
      .page { width: 100%; min-height: 100vh; }
      .hdr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .card-hdr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- PAGE 1: Patient Details -->
  <div class="page">
    <div class="hdr">
      <div style="display:flex;align-items:center;">
        <img src={blueteethLogo} class="hdr-logo" onerror="this.style.display='none'"/>
        <div class="hdr-brand">
          <h1>BLUETEETH</h1>
          <p>dentistry at your doorstep</p>
        </div>
      </div>
      <div class="hdr-right">
        <h2>PATIENT RECORD CARD</h2>
        <div style="margin-top:6px; text-align:right;">
          <span class="badge" style="background:#1e293b; color:#fff; margin-right:4px;">Report Card No. ${p.serialId || '---'}</span>
          <span class="badge">${p.visitType || 'Visit'}</span>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="grid2">
        <!-- Personal Info -->
        <div class="card">
          <div class="card-hdr">Personal Information</div>
          <div class="card-body">
            <span class="lbl">Patient Name</span>
            <span class="val" style="font-size:15px;color:#1d4ed8;">${p.patientName}</span>
            <div class="row2">
              <div><span class="lbl">Age</span><span class="val">${p.age ? p.age + ' Years' : '—'}</span></div>
              <div><span class="lbl">Mobile</span><span class="val">${p.mobile || '—'}</span></div>
            </div>
            <span class="lbl">Address</span>
            <span class="val" style="font-weight:500;">${p.address || '—'}</span>
          </div>
        </div>
        <!-- Clinical -->
        <div class="card">
          <div class="card-hdr">Clinical &amp; Billing Details</div>
          <div class="card-body">
            <span class="lbl">Diagnosed Disease</span>
            <span class="val"><span class="disease-pill">${p.disease || '—'}</span></span>
            <span class="lbl">Treatment Performed</span>
            <span class="val" style="font-weight:600;">${p.treatment || '—'}</span>
            <div class="row2">
              <div><span class="lbl">Attending Doctor</span><span class="val">${p.doctorName || '—'}</span></div>
              <div><span class="lbl">Treatment Charge</span><span class="val charge">&#8377;${Number(p.treatmentCharge || 0).toLocaleString('en-IN')}</span></div>
            </div>
          </div>
        </div>
      </div>

      ${p.reportURL && !isPdfReport ? `
      <div class="report-hdr">Attached Report Document</div>
      <img src="${p.reportURL}" class="report-img" />
      ` : ''}
    </div>

    ${footerHtml}
  </div>

  ${p.reportURL && isPdfReport ? `
  <!-- PAGE 2+: PDF Report -->
  <div class="page">
    <div class="hdr">
      <div style="display:flex;align-items:center;">
        <img src={blueteethLogo} class="hdr-logo" onerror="this.style.display='none'"/>
        <div class="hdr-brand"><h1>BLUETEETH</h1><p>dentistry at your doorstep</p></div>
      </div>
      <div class="hdr-right"><h2>ATTACHED REPORT</h2><span class="badge">${p.patientName}</span></div>
    </div>
    <div class="content">
      <div class="report-hdr">Report / Record Document</div>
      <iframe src="${reportViewUrl}" class="report-frame" title="Report"></iframe>
    </div>
    ${footerHtml}
  </div>
  ` : ''}

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 800);
    };
  </script>
</body>
</html>`)
    printWindow.document.close()
  }

  const [downloading, setDownloading] = useState(false)

  // Convert an imported asset URL (Vite hashed) to base64 dataURL
  const assetToDataUrl = (src) => new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      resolve({ dataUrl: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight })
    }
    img.onerror = reject
    img.src = src
  })

  // Fetch any URL as base64 dataURL
  // For Cloudinary URLs, route through Vite proxy to bypass CORS
  const fetchAsDataUrl = (url) => new Promise((resolve, reject) => {
    // Convert Cloudinary URL to proxy URL in dev
    let fetchUrl = url
    if (url && url.includes('res.cloudinary.com')) {
      // e.g. https://res.cloudinary.com/dmw5efwf5/raw/... → /cloudinary-proxy/dmw5efwf5/raw/...
      fetchUrl = url.replace('https://res.cloudinary.com', '/cloudinary-proxy')
    }
    fetch(fetchUrl)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob() })
      .then(blob => {
        const reader = new FileReader()
        reader.onload = () => resolve({ dataUrl: reader.result, blob })
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      .catch(reject)
  })

  // Build the patient-details jsPDF and return it
  const buildPatientPdf = async (p, logoDataUrl, logoAspect = 1) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210
    const margin = 15
    const contentW = pageW - margin * 2
    let y = 0

    // ── Helpers ───────────────────────────────────────────────────
    const fillRect = (x, yy, w, h, r, rgb) => {
      pdf.setFillColor(...rgb)
      r > 0 ? pdf.roundedRect(x, yy, w, h, r, r, 'F') : pdf.rect(x, yy, w, h, 'F')
    }
    const strokeRect = (x, yy, w, h, r, rgb) => {
      pdf.setDrawColor(...rgb)
      r > 0 ? pdf.roundedRect(x, yy, w, h, r, r, 'S') : pdf.rect(x, yy, w, h, 'S')
    }
    const lbl = (text, x, yy, rgb = [148, 163, 184]) => {
      pdf.setFontSize(7); pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...rgb); pdf.text(text.toUpperCase(), x, yy)
    }
    const val = (text, x, yy, rgb = [15, 23, 42], size = 10.5) => {
      pdf.setFontSize(size); pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...rgb); pdf.text(String(text || '\u2014'), x, yy)
    }
    const sectionTitle = (text, x, yy, rgb) => {
      pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...rgb); pdf.text(text, x, yy)
    }

    // ── HEADER ────────────────────────────────────────────────────
    // Blue background header
    fillRect(0, 0, pageW, 35, 0, [30, 64, 175]) // blue-800
    fillRect(0, 0, pageW, 3, 0, [59, 130, 246]) // lighter blue top strip

    let textStartX = margin
    if (logoDataUrl) {
      const targetHeight = 16
      const targetWidth = targetHeight * logoAspect
      
      // White box for the logo to pop against the blue background
      fillRect(margin, 9, targetWidth + 4, targetHeight + 4, 2, [255, 255, 255])
      pdf.addImage(logoDataUrl, 'PNG', margin + 2, 11, targetWidth, targetHeight)
      
      textStartX = margin + targetWidth + 12
    }

    // Brand name & tagline
    pdf.setFontSize(22); pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text('BLUETEETH', textStartX, 18)
    
    pdf.setFontSize(8); pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(147, 197, 253) // blue-300
    pdf.text('dentistry at your doorstep'.toUpperCase(), textStartX, 25)

    // Right side: title + visit badge
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text('PATIENT RECORD CARD', pageW - margin, 17, { align: 'right' })

    // ID Badge
    const idText = `Report Card No. ${p.serialId || '---'}`
    pdf.setFontSize(8); pdf.setFont('helvetica', 'bold')
    const idW = pdf.getTextWidth(idText) + 10

    // Visit type badge
    const badgeText = (p.visitType || 'Visit').toUpperCase()
    pdf.setFontSize(7); pdf.setFont('helvetica', 'bold')
    const bW = pdf.getTextWidth(badgeText) + 10

    const totalBadgesW = idW + bW + 4

    fillRect(pageW - margin - totalBadgesW, 20, idW, 6.5, 3, [30, 41, 59]) // dark bg
    pdf.setTextColor(255, 255, 255)
    pdf.text(idText, pageW - margin - totalBadgesW + idW / 2, 24.5, { align: 'center' })

    fillRect(pageW - margin - bW, 20, bW, 6.5, 3, [255, 255, 255])
    pdf.setTextColor(30, 64, 175)
    pdf.text(badgeText, pageW - margin - bW / 2, 24.5, { align: 'center' })

    y = 42

    // ── PERSONAL INFORMATION ──────────────────────────────────────
    // Section card
    fillRect(margin, y, contentW, 80, 4, [248, 250, 252])
    strokeRect(margin, y, contentW, 80, 4, [226, 232, 240])

    // Section header strip
    fillRect(margin, y, contentW, 10, 4, [237, 233, 254])
    // Only round top corners — draw bottom as flat
    fillRect(margin, y + 6, contentW, 4, 0, [237, 233, 254])

    sectionTitle('PERSONAL INFORMATION', margin + 5, y + 7, [109, 40, 217])

    // Divider
    pdf.setDrawColor(221, 214, 254)
    pdf.line(margin + 4, y + 10, margin + contentW - 4, y + 10)

    lbl('Full Name', margin + 5, y + 18)
    val(p.patientName, margin + 5, y + 25, [15, 23, 42], 12)

    lbl('Age', margin + 5, y + 36)
    val(p.age ? `${p.age} Years` : '\u2014', margin + 5, y + 43)

    lbl('Mobile', margin + 70, y + 36)
    val(p.mobile || '\u2014', margin + 70, y + 43)

    lbl('Address', margin + 5, y + 50)
    val(p.address || '\u2014', margin + 5, y + 56, [71, 85, 105], 9)

    // Treatment Date + Record Submit Date
    const treatmentDateStr = p.visitDate
      ? new Date(p.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '\u2014'
    const recordDateStr = p.createdAt
      ? (p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt))
          .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '\u2014'

    lbl('Treatment Date', margin + 5, y + 66, [59, 130, 246])
    val(treatmentDateStr, margin + 5, y + 72, [15, 23, 42], 9)

    lbl('Record Submit Date', margin + 95, y + 66, [5, 150, 105])
    val(recordDateStr, margin + 95, y + 72, [15, 23, 42], 9)

    y += 78

    // ── CLINICAL & BILLING ────────────────────────────────────────
    fillRect(margin, y, contentW, 68, 4, [240, 249, 255])
    strokeRect(margin, y, contentW, 68, 4, [186, 230, 253])

    fillRect(margin, y, contentW, 10, 4, [204, 251, 241])
    fillRect(margin, y + 6, contentW, 4, 0, [204, 251, 241])

    sectionTitle('CLINICAL & BILLING DETAILS', margin + 5, y + 7, [13, 148, 136])

    pdf.setDrawColor(153, 246, 228)
    pdf.line(margin + 4, y + 10, margin + contentW - 4, y + 10)

    lbl('Diagnosed Disease', margin + 5, y + 18)
    // Disease pill
    const dis = p.disease || '\u2014'
    const dW = pdf.getTextWidth(dis) + 10
    fillRect(margin + 5, y + 20, dW, 9, 3, [254, 243, 199])
    strokeRect(margin + 5, y + 20, dW, 9, 3, [253, 230, 138])
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(146, 64, 14)
    pdf.text(dis, margin + 10, y + 26)

    lbl('Treatment Performed', margin + 5, y + 36)
    val(p.treatment || '\u2014', margin + 5, y + 43, [30, 41, 59], 10)

    pdf.setDrawColor(186, 230, 253)
    pdf.line(margin + 4, y + 47, margin + contentW - 4, y + 47)

    lbl('Attending Doctor', margin + 5, y + 54)
    val(p.doctorName || '\u2014', margin + 5, y + 61, [15, 23, 42], 10)

    // Charge box
    const chargeStr = p.treatmentCharge
      ? `Rs. ${Number(p.treatmentCharge).toLocaleString('en-IN')}`
      : '\u2014'
    fillRect(margin + 95, y + 48, contentW - 95, 18, 3, [238, 242, 255])
    strokeRect(margin + 95, y + 48, contentW - 95, 18, 3, [199, 210, 254])
    lbl('Total Charge', margin + 97, y + 54, [99, 102, 241])
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(67, 56, 202)
    pdf.text(chargeStr, margin + 97, y + 63)

    y += 74

    // ── REPORT SECTION ────────────────────────────────────────────
    const isPdfReport = p.reportURL && p.reportURL.toLowerCase().endsWith('.pdf')
    const isImageReport = p.reportURL && !isPdfReport

    if (isImageReport) {
      try {
        const { dataUrl, blob } = await fetchAsDataUrl(p.reportURL)
        const ext = blob.type.includes('png') ? 'PNG' : 'JPEG'

        // Section header
        fillRect(margin, y, contentW, 10, 4, [255, 251, 235])
        strokeRect(margin, y, contentW, 10, 4, [253, 230, 138])
        sectionTitle('ATTACHED REPORT DOCUMENT', margin + 5, y + 7, [180, 83, 9])
        y += 14

        const img = new Image()
        img.src = dataUrl
        await new Promise(res => { img.onload = res; img.onerror = res })
        const aspect = img.naturalWidth / img.naturalHeight || 1
        const imgW = contentW
        const imgH = Math.min(imgW / aspect, 297 - y - 22)
        if (y + imgH > 275) { pdf.addPage(); y = 14 }
        // Image border
        strokeRect(margin, y, imgW, imgH, 3, [226, 232, 240])
        pdf.addImage(dataUrl, ext, margin, y, imgW, imgH)
      } catch {
        pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(148, 163, 184)
        pdf.text('Report image could not be embedded.', margin, y + 6)
      }
    } else if (!p.reportURL) {
      fillRect(margin, y, contentW, 14, 4, [248, 250, 252])
      strokeRect(margin, y, contentW, 14, 4, [226, 232, 240])
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(148, 163, 184)
      pdf.text('No report document attached to this patient record.', margin + 5, y + 9)
    }

    // ── FOOTER — every page ───────────────────────────────────────
    const totalPg = pdf.internal.getNumberOfPages()

    // Pre-render each icon as a tiny canvas image
    const makeIconDataUrl = (drawFn, size = 20) => {
      const c = document.createElement('canvas')
      c.width = size; c.height = size
      const ctx = c.getContext('2d')
      drawFn(ctx, size)
      return c.toDataURL('image/png')
    }

    // Phone icon — blue circle
    const phoneIcon = makeIconDataUrl((ctx, s) => {
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath(); ctx.arc(s/2, s/2, s/2, 0, Math.PI*2); ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'
      // handset shape
      ctx.beginPath()
      ctx.moveTo(6, 5); ctx.quadraticCurveTo(5, 8, 7, 10)
      ctx.moveTo(10, 13); ctx.quadraticCurveTo(12, 15, 15, 14)
      ctx.moveTo(7, 10); ctx.lineTo(9, 12); ctx.lineTo(10, 13)
      ctx.stroke()
    })

    // WhatsApp icon — green circle
    const waIcon = makeIconDataUrl((ctx, s) => {
      ctx.fillStyle = '#22c55e'
      ctx.beginPath(); ctx.arc(s/2, s/2, s/2, 0, Math.PI*2); ctx.fill()
      ctx.fillStyle = '#fff'
      // speech bubble
      ctx.beginPath()
      ctx.arc(s/2, s/2-1, 6, 0, Math.PI*2)
      ctx.fill()
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(s/2, s/2-1, 4, 0, Math.PI*2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.moveTo(7, 14); ctx.lineTo(6, 17); ctx.lineTo(10, 15)
      ctx.fill()
      // phone in bubble
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(9, 8); ctx.quadraticCurveTo(8.5, 9.5, 9.5, 10.5)
      ctx.moveTo(10.5, 11.5); ctx.quadraticCurveTo(11.5, 12, 13, 11.5)
      ctx.moveTo(9.5, 10.5); ctx.lineTo(10, 11); ctx.lineTo(10.5, 11.5)
      ctx.stroke()
    })

    // Email icon — red circle
    const emailIcon = makeIconDataUrl((ctx, s) => {
      ctx.fillStyle = '#ef4444'
      ctx.beginPath(); ctx.arc(s/2, s/2, s/2, 0, Math.PI*2); ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round'
      ctx.strokeRect(5, 7, 10, 7)
      ctx.beginPath(); ctx.moveTo(5, 7); ctx.lineTo(10, 12); ctx.lineTo(15, 7)
      ctx.stroke()
    })

    // Clock icon — amber circle
    const clockIcon = makeIconDataUrl((ctx, s) => {
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath(); ctx.arc(s/2, s/2, s/2, 0, Math.PI*2); ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.arc(s/2, s/2, 5.5, 0, Math.PI*2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(s/2, s/2-4); ctx.lineTo(s/2, s/2); ctx.lineTo(s/2+3, s/2+2); ctx.stroke()
    })

    // Instagram icon — gradient circle
    const instaIcon = makeIconDataUrl((ctx, s) => {
      const grad = ctx.createLinearGradient(0, s, s, 0)
      grad.addColorStop(0, '#f97316')
      grad.addColorStop(0.5, '#ec4899')
      grad.addColorStop(1, '#8b5cf6')
      ctx.fillStyle = grad
      ctx.beginPath(); ctx.arc(s/2, s/2, s/2, 0, Math.PI*2); ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round'
      // rounded square
      const r = 2.5, x = 5, y = 5, w = 10, h = 10
      ctx.beginPath()
      ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y)
      ctx.quadraticCurveTo(x+w, y, x+w, y+r)
      ctx.lineTo(x+w, y+h-r)
      ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h)
      ctx.lineTo(x+r, y+h)
      ctx.quadraticCurveTo(x, y+h, x, y+h-r)
      ctx.lineTo(x, y+r)
      ctx.quadraticCurveTo(x, y, x+r, y)
      ctx.closePath(); ctx.stroke()
      // inner circle
      ctx.beginPath(); ctx.arc(s/2, s/2, 2.5, 0, Math.PI*2); ctx.stroke()
      // dot
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(13.5, 6.5, 1, 0, Math.PI*2); ctx.fill()
    })

    // Globe icon — teal circle
    const globeIcon = makeIconDataUrl((ctx, s) => {
      ctx.fillStyle = '#14b8a6'
      ctx.beginPath(); ctx.arc(s/2, s/2, s/2, 0, Math.PI*2); ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.arc(s/2, s/2, 5.5, 0, Math.PI*2); ctx.stroke()
      // meridians
      ctx.beginPath(); ctx.ellipse(s/2, s/2, 2.5, 5.5, 0, 0, Math.PI*2); ctx.stroke()
      // equator
      ctx.beginPath(); ctx.moveTo(4.5, s/2); ctx.lineTo(15.5, s/2); ctx.stroke()
    })

    for (let i = 1; i <= totalPg; i++) {
      pdf.setPage(i)

      // Footer bar — dark navy
      fillRect(0, 275, pageW, 22, 0, [15, 23, 42])
      // Top accent
      fillRect(0, 275, pageW, 1.5, 0, [59, 130, 246])

      const iconSize = 5.5  // mm
      const fy = 279      // top of icon row
      const ty = 284      // text baseline

      // ── Item positions (evenly spaced) ──
      // 1. Phone
      let cx = 10
      pdf.addImage(phoneIcon, 'PNG', cx, fy, iconSize, iconSize)
      pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255)
      pdf.text('9311997440', cx + iconSize + 1.5, ty)

      // Divider
      pdf.setDrawColor(30, 58, 138); pdf.line(cx + 25, fy + 0.5, cx + 25, fy + iconSize - 0.5)

      // 2. WhatsApp + location (grouped)
      cx = 38
      pdf.addImage(waIcon, 'PNG', cx, fy, iconSize, iconSize)
      pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255)
      pdf.text('WhatsApp', cx + iconSize + 1.5, ty - 1)
      pdf.setFontSize(5.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(147, 197, 253)
      pdf.text('Delhi NCR, India', cx + iconSize + 1.5, ty + 2.5)

      // Divider
      pdf.setDrawColor(30, 58, 138); pdf.line(cx + 31, fy + 0.5, cx + 31, fy + iconSize - 0.5)

      // 3. Email
      cx = 72
      pdf.addImage(emailIcon, 'PNG', cx, fy, iconSize, iconSize)
      pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(147, 197, 253)
      pdf.text('support@blueteeth.in', cx + iconSize + 1.5, ty)

      // Divider
      pdf.setDrawColor(30, 58, 138); pdf.line(cx + 35, fy + 0.5, cx + 35, fy + iconSize - 0.5)

      // 4. Clock / Timing
      cx = 110
      pdf.addImage(clockIcon, 'PNG', cx, fy, iconSize, iconSize)
      pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(147, 197, 253)
      pdf.text('8 AM - 8 PM', cx + iconSize + 1.5, ty - 1)
      pdf.setFontSize(5.5); pdf.setTextColor(100, 116, 139)
      pdf.text('(Mon - Sun)', cx + iconSize + 1.5, ty + 2.5)

      // Divider
      pdf.setDrawColor(30, 58, 138); pdf.line(cx + 27, fy + 0.5, cx + 27, fy + iconSize - 0.5)

      // 5. Instagram
      cx = 140
      pdf.addImage(instaIcon, 'PNG', cx, fy, iconSize, iconSize)
      pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255)
      pdf.text('@blueteethpvt.ltd', cx + iconSize + 1.5, ty)

      // Divider
      pdf.setDrawColor(30, 58, 138); pdf.line(cx + 30, fy + 0.5, cx + 30, fy + iconSize - 0.5)

      // 6. Website
      cx = 173
      pdf.addImage(globeIcon, 'PNG', cx, fy, iconSize, iconSize)
      pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(147, 197, 253)
      pdf.text('www.blueteeth.in', cx + iconSize + 1.5, ty)

      // Page number
      pdf.setFontSize(6); pdf.setTextColor(71, 85, 105)
      pdf.text(`${i} / ${totalPg}`, pageW - 8, ty + 4, { align: 'right' })
    }

    return pdf
  }

  const handleDownload = async () => {
    if (!selectedPatient) return
    setDownloading(true)
    const p = selectedPatient
    const fileName = `Patient_${p.patientName.replace(/\s+/g, '_')}_Record.pdf`

    // Safety: force-reset after 10s no matter what
    const safetyTimer = setTimeout(() => setDownloading(false), 10000)

    try {
      let logoDataUrl = null
      let logoAspect = 1
      try {
        const logo = await assetToDataUrl(blueteethLogo)
        logoDataUrl = logo.dataUrl
        logoAspect = logo.w / logo.h || 1
      } catch (e) {
        console.warn('Could not load logo for PDF', e)
      }

      const isPdf = p.reportURL && p.reportURL.toLowerCase().endsWith('.pdf')

      if (isPdf) {
        // Try to fetch + merge report PDF
        let reportPdfBytes = null
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          
          const resp = await fetch(p.reportURL, { signal: controller.signal })
          clearTimeout(timeoutId)
          
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          
          if (resp.headers.get('content-type')?.includes('text/html')) {
             throw new Error('Received HTML instead of PDF');
          }
          
          reportPdfBytes = await resp.arrayBuffer()
        } catch (fetchErr) {
          console.warn('Report PDF fetch failed (CORS or network):', fetchErr.message)
        }

        if (reportPdfBytes) {
          try {
            // Merge details + report into one PDF
            const detailsPdf = await buildPatientPdf(p, logoDataUrl, logoAspect)
            const detailsBytes = detailsPdf.output('arraybuffer')

            const merged = await PDFDocument.create()
            const detailsDoc = await PDFDocument.load(detailsBytes)
            const reportDoc = await PDFDocument.load(reportPdfBytes)

            const dPages = await merged.copyPages(detailsDoc, detailsDoc.getPageIndices())
            dPages.forEach(pg => merged.addPage(pg))
            const rPages = await merged.copyPages(reportDoc, reportDoc.getPageIndices())
            rPages.forEach(pg => merged.addPage(pg))

            const mergedBytes = await merged.save()
            const blob = new Blob([mergedBytes], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = fileName
            document.body.appendChild(a); a.click()
            document.body.removeChild(a)
            setTimeout(() => URL.revokeObjectURL(url), 1000)
          } catch (mergeErr) {
            console.error('Merge failed, falling back:', mergeErr);
            const detailsPdf = await buildPatientPdf(p, logoDataUrl, logoAspect)
            detailsPdf.save(fileName)
            window.open(p.reportURL, '_blank')
          }
        } else {
          // Fetch failed — save details PDF, open report in new tab
          const detailsPdf = await buildPatientPdf(p, logoDataUrl)
          detailsPdf.save(fileName)
          // Open report in new tab as fallback
          window.open(p.reportURL, '_blank')
        }
      } else {
        // Image report or no report — single combined PDF
        const detailsPdf = await buildPatientPdf(p, logoDataUrl)
        detailsPdf.save(fileName)
      }
    } catch (err) {
      console.error('Download failed:', err)
      alert('PDF download failed: ' + err.message)
    } finally {
      clearTimeout(safetyTimer)
      setDownloading(false)
    }
  }

  const filtered = useMemo(() => {
    return patients.filter(p => {
      const q = search.trim().toLowerCase()
      const matchSearch = !q ||
        String(p.patientName || '').toLowerCase().includes(q) ||
        String(p.mobile || '').toLowerCase().includes(q) ||
        String(p.disease || '').toLowerCase().includes(q) ||
        String(p.doctorName || '').toLowerCase().includes(q)
      const matchVisit = visitFilter === 'All' || p.visitType === visitFilter
      return matchSearch && matchVisit
    })
  }, [patients, search, visitFilter])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50/30 p-6 rounded-2xl border border-blue-100/50 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Patient Registry
          </h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5 font-medium">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Manage and view {patients.length} active patient files & clinical reports
          </p>
        </div>
        <Link
          to="/add-patient"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg shadow-blue-500/20 active:scale-95 text-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add New Patient
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, mobile, disease, or doctor..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50 focus:bg-white"
          />
        </div>
        
        <div className="w-full md:w-64">
          <select
            value={visitFilter}
            onChange={e => setVisitFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50 focus:bg-white cursor-pointer !bg-[position:right_16px_center]"
          >
            <option value="All">All Visit Types</option>
            <option value="Clinic Visit">🏢 Clinic Visit</option>
            <option value="Free Camp">⛺ Free Camp</option>
            <option value="Online Patient">🌐 Online Patient</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase animate-pulse">Loading Patient Database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-slate-700 font-bold text-lg">No Results Found</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">
              {search || visitFilter !== 'All' 
                ? "We couldn't find any patients matching your current search parameters." 
                : "Your patient list is currently empty. Click 'Add New Patient' to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-center">#</th>
                  <th className="px-6 py-4">Patient Details</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Medical Case</th>
                  <th className="px-6 py-4">Doctor & Bill</th>
                  <th className="px-6 py-4 text-center">Visit Category</th>
                  <th className="px-6 py-4 text-center">Medical Report</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p, i) => (
                  <tr 
                    key={p.id} 
                    className="hover:bg-slate-50/80 transition-all duration-150 cursor-pointer group"
                    onClick={() => setSelectedPatient(p)}
                  >
                    <td className="px-6 py-4 text-center font-bold text-slate-400">
                      #{p.serialId}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                          {p.patientName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Age: <span className="font-medium text-slate-700">{p.age || '—'} Yrs</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{p.mobile}</div>
                      {p.address && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{p.address}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-100 text-xs font-semibold mb-1">
                        {p.disease || 'General Diagnosis'}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[180px]">
                        {p.treatment || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">{p.doctorName || '—'}</div>
                      <div className="text-xs font-bold text-emerald-600 mt-0.5">
                        {p.treatmentCharge ? `₹${Number(p.treatmentCharge).toLocaleString('en-IN')}` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${VISIT_BADGE[p.visitType] || 'bg-slate-100 text-slate-600'}`}>
                        {p.visitType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                      {p.reportURL ? (
                        <a
                          href={getReportUrl(p.reportURL)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-indigo-600 bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Report
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs italic">No Report</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPatient(p)}
                          className="inline-flex items-center bg-slate-50 text-indigo-600 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                          View Details
                        </button>
                        <Link
                          to={`/edit-patient/${p.id}`}
                          className="inline-flex items-center bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 hover:border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                          Edit
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={deleting === p.id}
                            className="inline-flex items-center bg-slate-50 text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {deleting === p.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 transform transition-all scale-100 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <img 
                  src={blueteethLogo} 
                  alt="Blueteeth Logo" 
                  className="h-12 w-auto object-contain"
                />
                 <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  <h2 className="text-lg font-black text-blue-600 tracking-wider uppercase leading-none">
                    BLUETEETH
                  </h2>
                  <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
                  <span className="text-xs text-slate-500 font-semibold leading-none">
                    dentistry at your doorstep
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 text-white text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wider">
                  Report Card No. {selectedPatient.serialId}
                </span>
                <span className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${VISIT_BADGE[selectedPatient.visitType] || 'bg-slate-100 text-slate-600'}`}>
                  {selectedPatient.visitType}
                </span>

                {/* Download Report Button */}
                {selectedPatient.reportURL && (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    title="Download Patient Record as PDF"
                    className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs px-3 py-2 rounded-xl transition-all hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {downloading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </>
                    )}
                  </button>
                )}

                {/* Print Button */}
                <button
                  onClick={handlePrint}
                  title="Print Patient Card"
                  className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs px-3 py-2 rounded-xl transition-all hover:shadow-sm"
                >
                  {/* Printer Icon - Colored */}
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2.5 transition-colors focus:outline-none"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-8">
              
              {/* Left Column: Info Grid */}
              <div className="lg:w-2/5 flex flex-col gap-6">
                
                {/* Personal Information Card */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    Personal Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block">Full Name</span>
                      <span className="text-lg font-bold text-slate-800">{selectedPatient.patientName}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Age</span>
                        <span className="text-base font-bold text-slate-700">{selectedPatient.age ? `${selectedPatient.age} Years` : '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Mobile Contact</span>
                        <span className="text-base font-bold text-slate-700">{selectedPatient.mobile || '—'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block">Resident Address</span>
                      <span className="text-sm font-medium text-slate-600 block leading-relaxed">{selectedPatient.address || '—'}</span>
                    </div>

                    {/* Date fields */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-xs font-semibold text-blue-500 block mb-1">Treatment Date</span>
                        <span className="text-sm font-bold text-slate-800">
                          {selectedPatient.visitDate
                            ? new Date(selectedPatient.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-emerald-600 block mb-1">🔒 Record Submit Date</span>
                        <span className="text-sm font-bold text-slate-800">
                          {selectedPatient.createdAt
                            ? (selectedPatient.createdAt.toDate
                                ? selectedPatient.createdAt.toDate()
                                : new Date(selectedPatient.createdAt)
                              ).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinical / Financial Card */}
                <div className="bg-gradient-to-br from-blue-50/40 to-indigo-50/20 p-6 rounded-2xl border border-blue-100/30 shadow-sm">
                  <h3 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    Clinical & Billing Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-blue-500/70 block">Diagnosed Disease</span>
                      <span className="inline-block mt-1 font-bold text-slate-800 bg-white border border-blue-100 px-3 py-1 rounded-lg shadow-sm text-sm">
                        {selectedPatient.disease || '—'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-xs font-semibold text-blue-500/70 block">Treatment Performed</span>
                      <span className="text-sm font-semibold text-slate-700 leading-relaxed block">{selectedPatient.treatment || '—'}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-100/50">
                      <div>
                        <span className="text-xs font-semibold text-blue-500/70 block">Attending Doctor</span>
                        <span className="text-sm font-bold text-slate-800">{selectedPatient.doctorName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-blue-500/70 block">Total Treatment Charge</span>
                        <span className="text-base font-extrabold text-indigo-700">
                          {selectedPatient.treatmentCharge ? `₹${Number(selectedPatient.treatmentCharge).toLocaleString('en-IN')}` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Report Viewer */}
              <div className="lg:w-3/5 flex flex-col">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    Report / Record Document
                  </h3>
                  {selectedPatient.reportURL && (
                    <a 
                      href={getReportUrl(selectedPatient.reportURL)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                    >
                      Open Document ↗
                    </a>
                  )}
                </div>
                
                <div className="flex-1 bg-slate-50 rounded-md border border-slate-200/60 overflow-hidden min-h-[420px] flex items-center justify-center relative shadow-inner">
                  {selectedPatient.reportURL ? (
                    selectedPatient.reportURL.toLowerCase().endsWith('.pdf') ? (
                      <object 
                        data={getReportUrl(selectedPatient.reportURL)} 
                        type="application/pdf"
                        className="w-full h-full absolute inset-0 border-0"
                      >
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                          <p className="text-slate-500 mb-4 font-medium">Browser cannot display this PDF inline.</p>
                          <a href={getReportUrl(selectedPatient.reportURL)} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                            Download / View PDF
                          </a>
                        </div>
                      </object>
                    ) : (
                      <div className="w-full h-full p-4 flex items-center justify-center">
                        <img 
                          src={selectedPatient.reportURL} 
                          alt="Patient Report" 
                          className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                        />
                      </div>
                    )
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 mx-auto mb-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 shadow-sm">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h4 className="text-slate-700 font-bold text-sm">No Report Associated</h4>
                      <p className="text-slate-400 text-xs mt-1 max-w-[240px] mx-auto">There are no uploaded documents, scans, or PDFs linked to this patient file.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

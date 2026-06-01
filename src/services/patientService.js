import {
  collection, addDoc, getDocs, getDoc,
  doc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { uploadFileToCloudinary } from './cloudinaryService'

const COL = 'patients'

// Add a new patient
export async function addPatient(data, reportFile) {
  let reportURL = ''
  let reportName = ''

  if (reportFile) {
    const uploadResult = await uploadFileToCloudinary(reportFile)
    reportURL = uploadResult.secure_url
    reportName = uploadResult.original_filename || reportFile.name
  }

  const docRef = await addDoc(collection(db, COL), {
    patientName: data.patientName || '',
    age: data.age || '',
    mobile: data.mobile || '',
    address: data.address || '',
    visitDate: data.visitDate || '',
    disease: data.disease || '',
    treatment: data.treatment || '',
    treatmentCharge: data.treatmentCharge || '',
    doctorName: data.doctorName || '',
    visitType: data.visitType || 'Clinic Visit',
    reportURL,
    reportName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

// Get all patients ordered by date
export async function getPatients() {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Get single patient
export async function getPatient(id) {
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) throw new Error('Patient not found')
  return { id: snap.id, ...snap.data() }
}

// Update patient
export async function updatePatient(id, data, reportFile) {
  let updates = {
    ...data,
    updatedAt: serverTimestamp(),
  }

  if (reportFile) {
    const uploadResult = await uploadFileToCloudinary(reportFile)
    updates.reportURL = uploadResult.secure_url
    updates.reportName = uploadResult.original_filename || reportFile.name
  }

  await updateDoc(doc(db, COL, id), updates)
}

// Delete patient
export async function deletePatient(id, reportURL) {
  // TODO: Delete from Cloudinary when integrated
  await deleteDoc(doc(db, COL, id))
}

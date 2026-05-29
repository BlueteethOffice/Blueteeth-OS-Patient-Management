import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'

// Lazy-load all pages — each page loads only when first visited
const LoginPage      = lazy(() => import('./pages/LoginPage'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const AddPatient     = lazy(() => import('./pages/AddPatient'))
const AllPatients    = lazy(() => import('./pages/AllPatients'))
const EditPatient    = lazy(() => import('./pages/EditPatient'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-blue-50">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="add-patient" element={<AddPatient />} />
                <Route path="patients" element={<AllPatients />} />
                <Route path="edit-patient/:id" element={<EditPatient />} />
              </Route>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

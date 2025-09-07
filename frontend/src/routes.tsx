// =============================
// src/routes.tsx
// =============================
import { createBrowserRouter } from 'react-router-dom'
import React from 'react'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import AttendancePage from './pages/Attendance'
import ProjectList from './pages/ProjectList'
import TaskDetail from './pages/TaskDetail'
import AdminUsers from './pages/AdminUsers'
import useAuthz from './hooks/useAuthz'
import { Navigate } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />, // 全体にログイン必須
    children: [
      {
        path: '/',
        element: <Layout><Dashboard /></Layout>,
      },
      {
        path: '/profile',
        element: <Layout><Profile /></Layout>,
      },
      {
        path: '/attendance',
        element: <Layout><AttendancePage /></Layout>,
      },
      {
        path: '/projects',
        element: <Layout><ProjectList /></Layout>,
      },
      {
        path: '/projects/:projectId',
        element: <Layout><TaskDetail /></Layout>,
      },
      {
        path: '/admin/users',
        element: (
          <Layout>
            <AdminGate><AdminUsers /></AdminGate>
          </Layout>
        ),
      },
    ],
  },
  // { path: '/signin', element: <SignIn /> }, // 既に実装済みとのこと
])

function AdminGate({ children }: { children: React.ReactElement }) {
  const { isAdmin, loading } = useAuthz()
  if (loading) return null
  return isAdmin ? children : <Navigate to="/" replace />
}
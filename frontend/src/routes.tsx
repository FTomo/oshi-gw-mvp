// =============================
// src/routes.tsx
// =============================
import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'

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
    ],
  },
  // { path: '/signin', element: <SignIn /> }, // 既に実装済みとのこと
])
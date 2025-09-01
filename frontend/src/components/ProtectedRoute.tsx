// =============================
// src/components/ProtectedRoute.tsx
// =============================
import { Navigate, Outlet } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { currentUserAtom } from '../state/auth'

export default function ProtectedRoute() {
  const user = useRecoilValue(currentUserAtom)
  return user ? <Outlet /> : <Navigate to="/signin" replace />
}
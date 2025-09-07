// =============================
// src/App.tsx（Hook順序エラー修正）
// =============================
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import AttendancePage from './pages/Attendance'
import ProjectList from './pages/ProjectList'
import TaskDetail from './pages/TaskDetail'
import AdminUsers from './pages/AdminUsers'
import useAuthz from './hooks/useAuthz'
import React from 'react'

// Amplify UI（既存仕様）
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import './App.css'
import { I18n } from 'aws-amplify/utils'
import { translations } from '@aws-amplify/ui-react'

import { useEffect } from 'react'
import { useSetRecoilState } from 'recoil'
import { currentUserAtom, type UserInfo } from './state/auth'
import { useUser } from './hooks/useUser'

// 日本語化（既存どおり）
I18n.putVocabularies(translations)
I18n.setLanguage('ja')

// Amplify UI が渡してくる user の最小型（any禁止のため簡易定義）
type AmplifyUserLike = {
  userId?: string
  username?: string
  signInDetails?: { loginId?: string }
  attributes?: { name?: string; picture?: string; email?: string; sub?: string }
}

function toUserInfo(a: AmplifyUserLike): UserInfo {
  return {
    sub: a.userId ?? a.attributes?.sub ?? a.username ?? 'unknown',
    email: a.attributes?.email ?? a.signInDetails?.loginId ?? a.username ?? '',
    name: a.attributes?.name ?? a.username ?? '',
    avatarUrl: a.attributes?.picture ?? '',
  }
}

// 子コンポーネントに分離してここで Hook を使う（Rules of Hooks 準拠）
function AuthenticatedApp({
  amplifyUser,
  onSignOut,
}: {
  amplifyUser: AmplifyUserLike
  onSignOut: () => void
}) {
  const setUser = useSetRecoilState(currentUserAtom)
  const { ensureSyncedOnSignIn } = useUser()

  useEffect(() => {
    const u: UserInfo = toUserInfo(amplifyUser)
    setUser(u)
    // ★ Userテーブル同期（未登録なら作成、登録済なら最小更新）
    void ensureSyncedOnSignIn(u)
  }, [amplifyUser, setUser, ensureSyncedOnSignIn])

  return (
  <Layout onSignOut={onSignOut}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
  <Route path="/attendance" element={<AttendancePage />} />
  <Route path="/projects" element={<ProjectList />} />
  <Route path="/projects/:projectId" element={<TaskDetail />} />
  <Route path="/admin/users" element={<AdminGate><AdminUsers /></AdminGate>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

  {/* SignOut ボタンは Header メニューで表示されるため重複削除 */}
    </Layout>
  )
}

function AdminGate({ children }: { children: React.ReactElement }) {
  const { isAdmin, loading } = useAuthz()
  if (loading) return null
  return isAdmin ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => {
        const safeSignOut = () => { signOut?.() }
        return user ? (
          <AuthenticatedApp amplifyUser={user as AmplifyUserLike} onSignOut={safeSignOut} />
        ) : (
          <div>Loading...</div>
        )
      }}
    </Authenticator>
  )
}

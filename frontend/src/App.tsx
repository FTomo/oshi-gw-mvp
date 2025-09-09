// =============================
// src/App.tsx（Hook順序エラー修正）
// =============================
import { Routes, Route, Navigate } from 'react-router-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRef } from 'react'
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
import { Authenticator, ThemeProvider as AmplifyProvider } from '@aws-amplify/ui-react'
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

// 認証状態ブリッジ: Amplify の user が無い（サインアウト直後など）場合に Recoil をクリア
function AuthStateSwitch({ user, onSignOut }: { user: AmplifyUserLike | undefined; onSignOut?: () => void }) {
  const setUser = useSetRecoilState(currentUserAtom)
  const navigate = useNavigate()
  const location = useLocation()
  const initialRedirectDoneRef = useRef(false)
  useEffect(() => {
    if (!user) {
      setUser(null)
    }
  }, [user, setUser])

  // ログイン直後のみ 1 回だけダッシュボードへ遷移（以後の通常遷移は妨げない）
  useEffect(() => {
    if (user && !initialRedirectDoneRef.current) {
      if (location.pathname !== '/') {
        navigate('/', { replace: true })
      }
      initialRedirectDoneRef.current = true
    }
    if (!user) {
      initialRedirectDoneRef.current = false
    }
  }, [user, navigate, location.pathname])

  if (!user) return null
  // user 切替時に完全にマウントし直して副作用・ローカル状態をリセット
  return <AuthenticatedApp key={user.userId ?? user.username ?? 'unknown'} amplifyUser={user} onSignOut={onSignOut ?? (() => {})} />
}

export default function App() {
  // Amplify UI（Authenticator）用のシンプルなブランドテーマ
  const amplifyTheme = {
    name: 'brand-theme',
    tokens: {
      colors: {
        font: {
          interactive: { value: '#2c3e50' },
        },
      },
      components: {
        button: {
          primary: {
            backgroundColor: { value: '#2c3e50' },
            color: { value: '#ffffff' },
            _hover: { backgroundColor: { value: '#23313f' } },
          },
        },
        link: {
          color: { value: '#2c3e50' },
          _hover: { color: { value: '#23313f' } },
        },
      },
    },
  } as const

  const AuthHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24, paddingBottom: 8 }}>
      <img
        src="/logo-smartworks.png"
        alt="SmartWorks"
        style={{ height: 40, objectFit: 'contain' }}
      />
    </div>
  )

  return (
    <div>
      <AmplifyProvider theme={amplifyTheme}>
        <Authenticator components={{ Header: AuthHeader }}>
          {({ signOut, user }) => (
            <AuthStateSwitch
              user={user as AmplifyUserLike | undefined}
              onSignOut={() => { signOut?.() }}
            />
          )}
        </Authenticator>
      </AmplifyProvider>
    </div>
  )
}

// =============================
// src/state/auth.ts (Amplify Auth integration stub)
// =============================
import { atom } from 'recoil'
// 実際には aws-amplify から Auth.currentAuthenticatedUser() を読んで初期化してください
// ここでは MVP プロトタイプ用の最小スタブとします
export type UserInfo = { sub: string; email: string; name?: string; avatarUrl?: string; role?: string | null }

export const currentUserAtom = atom<UserInfo | null>({
  key: 'currentUserAtom',
  default: null,
})

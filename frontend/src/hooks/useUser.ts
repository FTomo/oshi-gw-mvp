// src/hooks/useUser.ts
import { useCallback, useState } from 'react';
import { userService, type DbUser } from '../services/userService';
import { useRecoilState } from 'recoil';
import { currentUserAtom, type UserInfo } from '../state/auth';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getUrl } from 'aws-amplify/storage';

export function useUser() {
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useRecoilState(currentUserAtom);

  const ensureSyncedOnSignIn = useCallback(async (authUser: UserInfo) => {
    setLoading(true);
    try {
  // Cognito グループから admin 権限を判定
  const session = await fetchAuthSession().catch(() => null)
  const idGroups = (session?.tokens?.idToken?.payload?.['cognito:groups'] as string[] | undefined) ?? []
  const accGroups = (session?.tokens?.accessToken?.payload?.['cognito:groups'] as string[] | undefined) ?? []
  const groups = (idGroups.length ? idGroups : accGroups).map(g => (g || '').toLowerCase())
  const cognitoIsAdmin = groups.includes('admin')

      // DBにユーザーが存在するか確認
      const dbUser = await userService.getById(authUser.sub);
      if (dbUser) {
        // idが一致しない場合は認証エラーとしてサインアウト
        if (dbUser.id !== authUser.sub) {
          alert('認証情報とDB情報が一致しません。再度サインインしてください。');
          // サインアウト処理（例: location.reload() や onSignOutコールなど）
          if (typeof window !== 'undefined') {
            window.location.href = '/signout'; // サインアウトページへ遷移（適宜修正）
          }
          return null;
        }
        // 役割の同期（Cognito admin -> DB role=admin）
        let synced = dbUser
        if (cognitoIsAdmin && dbUser.role !== 'admin') {
          const updated = await userService.update(authUser.sub, { role: 'admin' })
          if (updated) synced = updated
        }
        // DBの情報をベースに、アバターは毎回署名URLを再生成（有効期限切れ対策）
        let displayAvatarUrl = ''
        try {
          if (synced.avatarUrl) {
            const identityId2 = session?.identityId ?? (await fetchAuthSession()).identityId
            if (identityId2) {
              const key = `protected/${identityId2}/avatars/${authUser.sub}.jpg`
              const { url } = await getUrl({ path: key, options: { expiresIn: 60 * 60 * 24 * 7 } })
              displayAvatarUrl = url.toString()
            }
          }
        } catch {
          // 取得失敗時は空のまま
        }
        const base = toUserInfo(synced)
        setMe({ ...base, avatarUrl: displayAvatarUrl || base.avatarUrl })
        return dbUser;
      } else {
        // DBに存在しない場合は新規作成
        const created = await userService.create({
          id: authUser.sub,
          email: authUser.email,
          name: authUser.name ?? null,
          avatarUrl: authUser.avatarUrl ?? null,
          role: cognitoIsAdmin ? 'admin' : null,
        });
        if (created) {
          // 作成後は DB を基準に最新の表示情報をセット（前ユーザーの情報が残らないように）
          const base = toUserInfo(created)
          setMe({ ...base })
        } else {
          // 失敗時は最小限の情報でセット
          setMe({ sub: authUser.sub, email: authUser.email, name: authUser.name ?? '', avatarUrl: authUser.avatarUrl ?? '' })
        }
        return created;
      }
    } finally {
      setLoading(false);
    }
  }, [setMe]);

  const getById = useCallback(async (id: string) => {
    return await userService.getById(id);
  }, []);

  const list = useCallback(async (limit = 50, nextToken?: string) => {
    return await userService.list(limit, nextToken);
  }, []);

  const updateMyProfile = useCallback(async (patch: Partial<Omit<DbUser, 'id'>>) => {
    if (!me?.sub) throw new Error('not authenticated');
    const updated = await userService.update(me.sub, patch);
    // UI用の currentUserAtom も反映（name / avatarUrl）
  setMe((prev) => prev ? { ...prev, name: updated?.name ?? prev.name, avatarUrl: updated?.avatarUrl ?? prev.avatarUrl, role: updated?.role ?? prev.role } : prev);
    return updated;
  }, [me, setMe]);

  const removeMe = useCallback(async () => {
    if (!me?.sub) throw new Error('not authenticated');
    await userService.remove(me.sub);
  }, [me]);

  return {
    me,
    loading,
    ensureSyncedOnSignIn,
    getById,
    list,
    updateMyProfile,
    removeMe,
  };
}

function toUserInfo(dbUser: DbUser): UserInfo {
  return {
    sub: dbUser.id,
    email: dbUser.email,
    name: dbUser.name ?? '',
  avatarUrl: dbUser.avatarUrl ?? '',
  role: dbUser.role ?? null,
  }
}

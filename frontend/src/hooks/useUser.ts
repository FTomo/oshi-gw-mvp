// src/hooks/useUser.ts
import { useCallback, useState } from 'react';
import { userService, type DbUser } from '../services/userService';
import { useRecoilState } from 'recoil';
import { currentUserAtom, type UserInfo } from '../state/auth';

export function useUser() {
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useRecoilState(currentUserAtom);

  const ensureSyncedOnSignIn = useCallback(async (authUser: UserInfo) => {
    setLoading(true);
    try {
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
        // 差分がなければDBの情報をRecoilに格納
        setMe(toUserInfo(dbUser));
        return dbUser;
      } else {
        // DBに存在しない場合は新規作成
        const created = await userService.create({
          id: authUser.sub,
          email: authUser.email,
          name: authUser.name ?? null,
          avatarUrl: authUser.avatarUrl ?? null,
          role: null,
        });
        setMe((prev) => prev ?? { ...authUser });
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
    setMe((prev) => prev ? { ...prev, name: updated?.name ?? prev.name, avatarUrl: updated?.avatarUrl ?? prev.avatarUrl } : prev);
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
  }
}

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
      const synced = await userService.ensureExistsFromAuth({
        sub: authUser.sub,
        email: authUser.email,
        name: authUser.name,
        avatarUrl: authUser.avatarUrl,
      });
      // Recoil の currentUserAtom はUI用の軽量情報なので、必要ならここで補完
      setMe((prev) => prev ?? { ...authUser });
      return synced;
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
    setMe((prev) => prev ? { ...prev, name: updated.name ?? prev.name, avatarUrl: updated.avatarUrl ?? prev.avatarUrl } : prev);
    return updated;
  }, [me, setMe]);

  const removeMe = useCallback(async () => {
    if (!me?.sub) throw new Error('not authenticated');
    await userService.remove(me.sub);
  }, [me]);

  return {
    loading,
    ensureSyncedOnSignIn,
    getById,
    list,
    updateMyProfile,
    removeMe,
  };
}

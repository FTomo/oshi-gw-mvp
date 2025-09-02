// src/services/userService.ts
import { generateClient } from 'aws-amplify/api';
import { getUser, listUsers } from '../queries';
import { createUser, updateUser, deleteUser } from '../mutations';

export type DbUser = {
  id: string;          // Cognito sub
  email: string;
  name?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
};

export type EnsureParams = {
  sub: string;
  email: string;
  name?: string;
  avatarUrl?: string;
};

const client = generateClient();

export const userService = {
  async getById(id: string): Promise<DbUser | null> {
    const res = await client.graphql({
      query: getUser,
      variables: { id },
    }) as { data?: { getUser?: DbUser | null } };
    return res.data?.getUser ?? null;
  },

  async list(limit = 50, nextToken?: string) {
    const res = await client.graphql({
      query: listUsers,
      variables: { limit, nextToken },
    }) as { data?: { listUsers?: { items: DbUser[]; nextToken?: string | null } } };
    return {
      items: res.data?.listUsers?.items ?? [],
      nextToken: res.data?.listUsers?.nextToken ?? null,
    };
  },

  async create(input: DbUser): Promise<DbUser> {
    try {
      const res = await client.graphql({
        query: createUser,
        variables: { input },
        authMode: 'userPool',
      }) as { data?: { createUser: DbUser } };
      return res.data!.createUser;
    } catch (e) {
      console.error('createUser error:', e);
      throw e;
    }
  },

  async update(id: string, patch: Partial<Omit<DbUser, 'id'>>): Promise<DbUser> {
    const res = await client.graphql({
      query: updateUser,
      variables: { input: { id, ...patch } },
      authMode: 'userPool',
    }) as { data?: { updateUser: DbUser } };
    return res.data!.updateUser;
  },

  async remove(id: string): Promise<string> {
    const res = await client.graphql({
      query: deleteUser,
      variables: { input: { id } },
      authMode: 'userPool',
    }) as { data?: { deleteUser: { id: string } } };
    return res.data!.deleteUser.id;
  },

  /**
   * サインイン直後のユーザーをUserテーブルに同期する:
   * - 未登録: 作成
   * - 登録済み: 欠けている基本フィールドのみ最小更新（email/name/avatarUrl）
   */
  async ensureExistsFromAuth(params: EnsureParams): Promise<DbUser> {
    const existing = await this.getById(params.sub);
    if (!existing) {
      // 新規作成
      return await this.create({
        id: params.sub,
        email: params.email,
        name: params.name ?? null,
        avatarUrl: params.avatarUrl && params.avatarUrl !== '' ? params.avatarUrl : null,
        role: null, // 役割は後から管理者が付与
      });
    }

    // 最小差分更新（空の項目だけ埋める or 値が変わっていたら更新）
    const patch: Partial<DbUser> = {};
    if (!existing.email && params.email) patch.email = params.email;
    if ((!existing.name && params.name) || (existing.name && params.name && existing.name !== params.name)) {
      patch.name = params.name;
    }
    if ((!existing.avatarUrl && params.avatarUrl) || (existing.avatarUrl && params.avatarUrl && existing.avatarUrl !== params.avatarUrl)) {
      patch.avatarUrl = params.avatarUrl && params.avatarUrl !== '' ? params.avatarUrl : null;
    }

    if (Object.keys(patch).length > 0) {
      return await this.update(params.sub, patch);
    }
    return existing;
  },
};

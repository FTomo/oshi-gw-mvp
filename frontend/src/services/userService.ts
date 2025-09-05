import { generateClient } from 'aws-amplify/api';
import { getUser, listUsers } from '../queries';
import { createUser, updateUser, deleteUser } from '../mutations';

export type DbUser = {
  id: string;
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
    try {
      const res = await client.graphql({
        query: getUser,
        variables: { id },
      }) as { data?: { getUser?: DbUser | null } };
      return res.data?.getUser ?? null;
    } catch (e) {
      console.error('getById error:', e);
      return null;
    }
  },

  async list(limit = 50, nextToken?: string) {
    try {
      const res = await client.graphql({
        query: listUsers,
        variables: { limit, nextToken },
      }) as { data?: { listUsers?: { items: DbUser[]; nextToken?: string | null } } };
      return {
        items: res.data?.listUsers?.items ?? [],
        nextToken: res.data?.listUsers?.nextToken ?? null,
      };
    } catch (e) {
      console.error('list error:', e);
      return { items: [], nextToken: null };
    }
  },

  async create(input: DbUser): Promise<DbUser | null> {
    try {
      const safeInput = {
        ...input,
        avatarUrl: input.avatarUrl !== undefined && input.avatarUrl !== '' ? input.avatarUrl : null,
      };
      const res = await client.graphql({
        query: createUser,
        variables: { input: safeInput },
        authMode: 'userPool',
      }) as { data?: { createUser: DbUser } };
      return res.data?.createUser ?? null;
    } catch (e) {
      console.error('createUser error:', e);
      return null;
    }
  },

  async update(id: string, patch: Partial<Omit<DbUser, 'id'>>): Promise<DbUser | null> {
    try {
      const safePatch = {
        ...patch,
        avatarUrl: patch.avatarUrl !== undefined && patch.avatarUrl !== '' ? patch.avatarUrl : null,
      };
      const res = await client.graphql({
        query: updateUser,
        variables: { input: { id, ...safePatch } },
        authMode: 'userPool',
      }) as { data?: { updateUser: DbUser } };
      return res.data?.updateUser ?? null;
    } catch (e) {
      console.error('updateUser error:', e);
      return null;
    }
  },

  async remove(id: string): Promise<string | null> {
    try {
      const res = await client.graphql({
        query: deleteUser,
        variables: { input: { id } },
        authMode: 'userPool',
      }) as { data?: { deleteUser: { id: string } } };
      return res.data?.deleteUser?.id ?? null;
    } catch (e) {
      console.error('deleteUser error:', e);
      return null;
    }
  },

  async ensureExistsFromAuth(params: EnsureParams): Promise<DbUser | null> {
    try {
      const existing = await this.getById(params.sub);
      if (!existing) {
        // 新規作成
        return await this.create({
          id: params.sub,
          email: params.email,
          name: params.name ?? null,
          avatarUrl: params.avatarUrl !== undefined && params.avatarUrl !== '' ? params.avatarUrl : null,
          role: null,
        });
      }

      // 最小差分更新
      const patch: Partial<DbUser> = {};
      if (!existing.email && params.email) patch.email = params.email;
      if ((!existing.name && params.name) || (existing.name && params.name && existing.name !== params.name)) {
        patch.name = params.name;
      }
      if (
        (!existing.avatarUrl && params.avatarUrl) ||
        (existing.avatarUrl && params.avatarUrl && existing.avatarUrl !== params.avatarUrl)
      ) {
        patch.avatarUrl = params.avatarUrl !== undefined && params.avatarUrl !== '' ? params.avatarUrl : null;
      }

      if (Object.keys(patch).length > 0) {
        return await this.update(params.sub, patch);
      }
      return existing;
    } catch (e) {
      console.error('ensureExistsFromAuth error:', e);
      return null;
    }
  },
};

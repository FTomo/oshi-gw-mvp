import { generateClient } from 'aws-amplify/api'
import { createUser, updateUser, deleteUser } from '../mutations'
import { listUsers } from '../queries'
import type { DbUser } from './userService'
import { signUp } from 'aws-amplify/auth'

const client = generateClient()

export const adminService = {
  async listUsers(limit = 50, nextToken?: string) {
    const res = await client.graphql({ query: listUsers, variables: { limit, nextToken } }) as { data?: { listUsers?: { items: DbUser[]; nextToken?: string | null } } }
    return {
      items: res.data?.listUsers?.items ?? [],
      nextToken: res.data?.listUsers?.nextToken ?? null,
    }
  },

  async createUserWithCognito(input: { id: string; email: string; name?: string | null; role?: string | null; avatarUrl?: string | null; password: string }) {
    // 1) Cognito サインアップ（管理者が代理作成）
    await signUp({ username: input.email, password: input.password, options: { userAttributes: { email: input.email } } })
    // 2) DB ユーザー作成
    const safeInput = { id: input.id, email: input.email, name: input.name ?? null, role: input.role ?? null, avatarUrl: input.avatarUrl ?? null }
    const res = await client.graphql({ query: createUser, variables: { input: safeInput }, authMode: 'userPool' }) as { data?: { createUser: DbUser } }
    return res.data?.createUser ?? null
  },

  async updateUser(input: { id: string; email?: string; name?: string | null; role?: string | null; avatarUrl?: string | null }) {
    const res = await client.graphql({ query: updateUser, variables: { input }, authMode: 'userPool' }) as { data?: { updateUser: DbUser } }
    return res.data?.updateUser ?? null
  },

  async deleteUser(id: string) {
    const res = await client.graphql({ query: deleteUser, variables: { input: { id } }, authMode: 'userPool' }) as { data?: { deleteUser: { id: string } } }
    return res.data?.deleteUser?.id ?? null
  },
}

// =============================
// src/pages/Profile.tsx
// =============================
import { useRecoilState } from 'recoil'
import { currentUserAtom } from '../state/auth'
import { Box, Button, Snackbar, Stack, TextField, Typography, Avatar } from '@mui/material'
import { useState } from 'react'
import { useUser } from '../hooks/useUser'

export default function Profile() {
  const [user, setUser] = useRecoilState(currentUserAtom)
  const [open, setOpen] = useState(false)

  const [name, setName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
const { updateMyProfile } = useUser()

  const save = async () => {
    // DBに保存
    const updated = await updateMyProfile({ name, avatarUrl })
    // TODO: Amplify GraphQL mutation or Cognito user attributes update
    setUser(u => (u ? { ...u, name, avatarUrl } : u))
    setOpen(true)
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>プロフィール設定</Typography>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Avatar src={avatarUrl} sx={{ width: 64, height: 64 }}>{(name || user?.email || 'U')[0]}</Avatar>
        <TextField label="アバターURL" fullWidth value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
      </Stack>
      <Stack spacing={2} sx={{ mt: 2, maxWidth: 520 }}>
        <TextField label="表示名" value={name} onChange={e => setName(e.target.value)} />
        <TextField label="メールアドレス" value={user?.email ?? ''} disabled />
        <Button variant="contained" onClick={save}>保存</Button>
      </Stack>
      <Snackbar open={open} autoHideDuration={2000} onClose={() => setOpen(false)} message="プロフィールを保存しました" />
    </Box>
  )
}
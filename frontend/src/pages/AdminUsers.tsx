import { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import { adminService } from '../services/adminService'
import type { DbUser } from '../services/userService'
import useAuthz from '../hooks/useAuthz'
import { useNavigate } from 'react-router-dom'

export default function AdminUsers() {
  const { isAdmin, loading: authzLoading } = useAuthz()
  const nav = useNavigate()
  const [items, setItems] = useState<DbUser[]>([])
  const [loading, setLoading] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<Partial<DbUser & { password?: string }>>({})

  useEffect(() => {
    if (authzLoading) return
    if (!isAdmin) { nav('/'); return }
    ;(async () => {
      setLoading(true)
      try {
        const res = await adminService.listUsers(200)
        setItems(res.items)
      } finally {
        setLoading(false)
      }
    })()
  }, [authzLoading, isAdmin, nav])

  const onCreate = () => {
    setEditing({ id: '', email: '', name: '', role: 'member', password: '' })
    setOpenEdit(true)
  }
  const onEdit = (u: DbUser) => {
    setEditing({ ...u })
    setOpenEdit(true)
  }
  const onDelete = async (u: DbUser) => {
    if (!confirm(`${u.email} を削除します。よろしいですか？`)) return
    await adminService.deleteUser(u.id)
    setItems(items.filter(i => i.id !== u.id))
  }

  const onSave = async () => {
    if (!editing) return
    if (!editing.id || !editing.email) {
      alert('id と email は必須です（id は Cognito sub を想定、暫定でUUID可）')
      return
    }
    if ('password' in editing && editing.password) {
      // 新規作成（Cognito + DB）
      const created = await adminService.createUserWithCognito({
        id: editing.id,
        email: editing.email,
        name: (editing.name ?? null) as string | null,
        role: (editing.role ?? null) as string | null,
        avatarUrl: (editing.avatarUrl ?? null) as string | null,
        password: editing.password,
      })
      if (created) setItems([created, ...items])
    } else {
      // 更新（DB）
      const updated = await adminService.updateUser({
        id: editing.id,
        email: editing.email,
        name: (editing.name ?? null) as string | null,
        role: (editing.role ?? null) as string | null,
        avatarUrl: (editing.avatarUrl ?? null) as string | null,
      })
      if (updated) setItems(items.map(i => (i.id === updated.id ? updated : i)))
    }
    setOpenEdit(false)
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">ユーザー管理</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={onCreate} disabled={loading}>新規作成</Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>名前</TableCell>
            <TableCell>ロール</TableCell>
            <TableCell align="right">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(u => (
            <TableRow key={u.id}>
              <TableCell>{u.id}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => onEdit(u)}><EditIcon /></IconButton>
                <IconButton size="small" color="error" onClick={() => onDelete(u)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ユーザー{('password' in editing && editing.password) ? '作成' : '編集'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="ID (Cognito sub 予定)" value={editing.id ?? ''} onChange={e => setEditing(s => ({ ...s, id: e.target.value }))} fullWidth />
            <TextField label="Email" value={editing.email ?? ''} onChange={e => setEditing(s => ({ ...s, email: e.target.value }))} fullWidth />
            <TextField label="名前" value={editing.name ?? ''} onChange={e => setEditing(s => ({ ...s, name: e.target.value }))} fullWidth />
            <TextField label="ロール (admin/member/guest)" value={editing.role ?? ''} onChange={e => setEditing(s => ({ ...s, role: e.target.value }))} fullWidth />
            {('password' in editing) && (
              <TextField label="初期パスワード" type="password" value={editing.password ?? ''} onChange={e => setEditing(s => ({ ...s, password: e.target.value }))} fullWidth />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>キャンセル</Button>
          <Button onClick={onSave} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

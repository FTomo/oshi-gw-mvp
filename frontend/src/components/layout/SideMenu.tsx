// =============================
// src/components/layout/SideMenu.tsx
// =============================
import { Drawer, Box, List, ListItemButton, ListItemText, ListSubheader } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  const loc = useLocation()
  const go = (path: string) => () => { nav(path); onClose() }
  return (
    <Drawer anchor="right" open={open} onClose={onClose} ModalProps={{ keepMounted: true }}>
      <Box sx={{ width: 280 }} role="presentation">
        <List>
          <ListItemButton selected={loc.pathname === '/'} onClick={go('/')}> <ListItemText primary="ダッシュボード" /> </ListItemButton>
          <ListItemButton selected={loc.pathname.startsWith('/profile')} onClick={go('/profile')}> <ListItemText primary="プロフィール" /> </ListItemButton>
          <ListItemButton selected={loc.pathname.startsWith('/projects')} onClick={go('/projects')}> <ListItemText primary="プロジェクト" /> </ListItemButton>
        </List>
        <List subheader={<ListSubheader component="div">勤怠管理</ListSubheader>}>
          <ListItemButton selected={loc.pathname.startsWith('/attendance')} onClick={go('/attendance')}> <ListItemText primary="勤怠カレンダー" /> </ListItemButton>
        </List>
      </Box>
    </Drawer>
  )
}
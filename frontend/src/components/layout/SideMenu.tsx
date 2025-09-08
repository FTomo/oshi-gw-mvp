// =============================
// src/components/layout/SideMenu.tsx
// =============================
import { Drawer, Box, List, ListItemButton, ListItemText, ListSubheader } from '@mui/material'
import useAuthz from '../../hooks/useAuthz'
import { useNavigate, useLocation } from 'react-router-dom'

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  const loc = useLocation()
  const { isAdmin } = useAuthz()
  const go = (path: string) => () => { nav(path); onClose() }
  
  // セクション見出しのスタイル（見出しと分かるように強調）
  const subheaderSx = {
    bgcolor: 'rgba(44,62,80,0.06)', // #2c3e50 の薄いティント
    color: 'primary.main',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 0.2,
    lineHeight: 1.8,
    px: 2,
    py: 1,
    borderTop: '1px solid',
    borderColor: 'divider',
  } as const
  return (
    <Drawer anchor="right" open={open} onClose={onClose} ModalProps={{ keepMounted: true }}>
      <Box sx={{ width: 280 }} role="presentation">
        <List subheader={<ListSubheader component="div" disableSticky sx={subheaderSx}>メイン</ListSubheader>}>
          <ListItemButton selected={loc.pathname === '/'} onClick={go('/')}> <ListItemText primary="ダッシュボード" /> </ListItemButton>
          <ListItemButton selected={loc.pathname.startsWith('/profile')} onClick={go('/profile')}> <ListItemText primary="プロフィール" /> </ListItemButton>
          <ListItemButton selected={loc.pathname.startsWith('/projects')} onClick={go('/projects')}> <ListItemText primary="プロジェクト" /> </ListItemButton>
        </List>
        <List sx={{ mt: 0.5 }} subheader={<ListSubheader component="div" disableSticky sx={subheaderSx}>勤怠管理</ListSubheader>}>
          <ListItemButton selected={loc.pathname.startsWith('/attendance')} onClick={go('/attendance')}> <ListItemText primary="勤怠カレンダー" /> </ListItemButton>
        </List>
  {isAdmin && (
          <List sx={{ mt: 0.5 }} subheader={<ListSubheader component="div" disableSticky sx={subheaderSx}>管理者メニュー</ListSubheader>}>
            <ListItemButton selected={loc.pathname.startsWith('/admin/users')} onClick={go('/admin/users')}>
              <ListItemText primary="ユーザー管理" />
            </ListItemButton>
          </List>
        )}
      </Box>
    </Drawer>
  )
}
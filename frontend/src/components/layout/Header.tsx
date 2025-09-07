import { AppBar, Toolbar, IconButton, Box, Avatar, Button } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useRecoilValue } from 'recoil'
import { currentUserAtom } from '../../state/auth'
import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'

export function Header({ onMenuToggle, onSignOut }: { onMenuToggle: () => void; onSignOut?: () => void }) {
  const user = useRecoilValue(currentUserAtom)
  const location = useLocation()
  const showBack = location.pathname !== '/'
  return (
    <AppBar position="fixed" elevation={1} color="default" sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        {showBack && (
          <IconButton edge="start" onClick={() => window.history.back()} sx={{ mr: 1 }} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
        )}
        <Box sx={{ flexGrow: 1 }}>
          <Box
            component={Link}
            to="/"
            aria-label="SmartWorks ホーム"
            sx={{ display: 'inline-flex', alignItems: 'center', height: 40, textDecoration: 'none' }}
          >
            <img src="/logo-smartworks.png" alt="SmartWorks" style={{ height: 46, display: 'block' }} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user && <Avatar src={user.avatarUrl}>{user.name?.[0]}</Avatar>}
          {onSignOut && (
            <Button onClick={onSignOut} size="small" variant="text">サインアウト</Button>
          )}
          <IconButton edge="end" aria-label="menu" onClick={onMenuToggle}>
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

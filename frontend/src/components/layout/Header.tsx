import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Button } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useRecoilValue } from 'recoil'
import { currentUserAtom } from '../../state/auth'

export function Header({ onMenuToggle, onSignOut }: { onMenuToggle: () => void; onSignOut?: () => void }) {
  const user = useRecoilValue(currentUserAtom)
  return (
    <AppBar position="fixed" elevation={1} color="default" sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          社内グループウェア
        </Typography>
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

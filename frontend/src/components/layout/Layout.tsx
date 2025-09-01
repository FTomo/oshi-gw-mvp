// =============================
// src/components/layout/Layout.tsx
// =============================
import { Box, Container, Toolbar, useMediaQuery } from '@mui/material'
import { useState } from 'react'
import { Header } from './Header'
import { SideMenu } from './SideMenu'
import { Footer } from './Footer'
import { useTheme } from '@mui/material/styles'

export default function Layout({ children, onSignOut }: { children: React.ReactNode; onSignOut?: () => void }) {
  const [open, setOpen] = useState(false)
  const theme = useTheme()
  const isUpMd = useMediaQuery(theme.breakpoints.up('md'))

  return (
    <Box display="flex" minHeight="100vh" flexDirection="column">
      <Header onMenuToggle={() => setOpen(true)} onSignOut={onSignOut} />
      <Toolbar />
      <Box component="main" sx={{ flex: 1, display: 'flex', gap: 2, px: { xs: 2, md: 3 }, py: 2 }}>
        <Container maxWidth="lg" sx={{ display: 'flex', gap: 2 }}>
          <Box flex={1}>{children}</Box>
          {/* 右サイド（md以上は常時表示、xs/smはドロワー） */}
          {isUpMd && (
            <Box sx={{ width: 280, display: { xs: 'none', md: 'block' } }}>
              {/* サイドメニューの常時表示版（必要なら別実装）。今回は簡易に空のプレースホルダ */}
            </Box>
          )}
        </Container>
      </Box>
      <Footer />
      <SideMenu open={open} onClose={() => setOpen(false)} />
    </Box>
  )
}

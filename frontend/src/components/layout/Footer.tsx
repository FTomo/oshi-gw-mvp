// =============================
// src/components/layout/Footer.tsx
// =============================
import { Box, Typography } from '@mui/material'

export function Footer() {
  return (
    <Box component="footer" sx={{ mt: 'auto', py: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="caption">© {new Date().getFullYear()} Atasino</Typography>
    </Box>
  )
}
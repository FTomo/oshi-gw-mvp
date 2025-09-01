// =============================
// src/theme.ts (MUI theme)
// =============================
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1e88e5' },
    secondary: { main: '#6d4c41' },
  },
  shape: { borderRadius: 12 },
})

// =============================
// src/theme.ts (MUI theme)
// =============================
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2c3e50', contrastText: '#ffffff' },
    secondary: { main: '#2c3e50', contrastText: '#ffffff' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  },
  components: {
    MuiButton: {
      defaultProps: { color: 'primary' },
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 10 },
      },
    },
    MuiLink: {
      styleOverrides: { root: { color: '#2c3e50' } },
    },
    MuiCssBaseline: {
      styleOverrides: {
        a: { color: '#2c3e50' },
      },
    },
  },
})

// =============================
// Directory structure (suggested)
// =============================
// src/
// ├─ main.tsx
// ├─ App.tsx
// ├─ routes.tsx
// ├─ theme.ts
// ├─ state/
// │   ├─ auth.ts
// │   └─ lang.ts
// ├─ i18n/
// │   ├─ index.ts
// │   ├─ messages/en.ts
// │   ├─ messages/ja.ts
// │   └─ types.ts
// ├─ components/
// │   ├─ layout/
// │   │   ├─ Layout.tsx
// │   │   ├─ Header.tsx
// │   │   ├─ SideMenu.tsx
// │   │   └─ Footer.tsx
// │   └─ ProtectedRoute.tsx
// └─ pages/
//     ├─ Dashboard.tsx
//     └─ Profile.tsx
// 
// =============================
// src/main.tsx
// =============================
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { Amplify } from 'aws-amplify'
import outputs from './amplifyconfiguration.json'
import App from './App'
import { theme } from './theme'

Amplify.configure(outputs) // ← これが重要！

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RecoilRoot>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </RecoilRoot>
  </React.StrictMode>
)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 👇 Amplify を追加
import { Amplify } from 'aws-amplify'
import awsExports from './aws-exports'

// Amplify の設定を初期化
Amplify.configure(awsExports)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

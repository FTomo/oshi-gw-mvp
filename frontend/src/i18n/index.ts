// =============================
// src/i18n/index.ts
// =============================
import ja from './messages/ja'
import en from './messages/en'
import type { LangKey } from './types'

const MAP = { ja, en } as const
export const getMessages = (lang: LangKey) => MAP[lang]

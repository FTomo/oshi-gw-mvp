// =============================
// src/state/lang.ts (Recoil for language)
// =============================
import { atom, selector } from 'recoil'
import { getMessages } from '../i18n/index'
import type { LangKey } from '../i18n/types'

export const langAtom = atom<LangKey>({ key: 'langAtom', default: 'ja' })

export const messagesSelector = selector({
  key: 'messagesSelector',
  get: ({ get }) => getMessages(get(langAtom)),
})

// Simple helper
export const translate = (key: string, vars?: Record<string, string | number>) =>
  ({ get }: { get: <T>(s: any) => T }) => {
    const dict = get(messagesSelector) as Record<string, string>
    let text = dict[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v))
      }
    }
    return text
  }
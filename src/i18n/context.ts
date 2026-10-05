import { createContext, useContext } from 'react'
import type { Lang } from './lib'
import { messages, type Messages } from './ui'

export interface I18n {
  lang: Lang
  t: Messages
  setLang: (lang: Lang) => void
}

export const I18nContext = createContext<I18n>({ lang: 'pt', t: messages.pt, setLang: () => {} })

export function useI18n(): I18n {
  return useContext(I18nContext)
}

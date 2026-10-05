import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext } from './context'
import type { Lang } from './lib'
import { messages } from './ui'

const KEY = 'sorteio.lang'

function isLang(value: unknown): value is Lang {
  return value === 'pt' || value === 'en'
}

/** ?lang=en no link > escolha salva > idioma do navegador. */
function initialLang(): Lang {
  const param = new URLSearchParams(window.location.search).get('lang')
  if (isLang(param)) return param
  try {
    const saved = localStorage.getItem(KEY)
    if (isLang(saved)) return saved
  } catch {
    // Sem armazenamento: segue para o idioma do navegador.
  }
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = messages[lang].locale
    document.title = messages[lang].app.title
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      // A escolha só não fica salva.
    }
  }, [lang])

  const value = useMemo(() => ({ lang, t: messages[lang], setLang }), [lang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

import { useEffect, useMemo, useState } from 'react'
import { DrawPanel } from './components/DrawPanel'
import { ParticipantsPanel } from './components/ParticipantsPanel'
import { RulesPanel } from './components/RulesPanel'
import { SourcePanel, type SourceInfo } from './components/SourcePanel'
import { useI18n } from './i18n/context'
import type { Lang } from './i18n/lib'
import { DEFAULT_RULES, evaluate } from './lib/rules'
import { sourceKey } from './lib/sourceKey'
import type { IgComment, Rules } from './lib/types'
import './App.css'

const RULES_KEY = 'sorteio.rules'
/** Post + perfil a que os critérios salvos pertencem. */
const SOURCE_KEY = 'sorteio.rulesSource'

// Cópia em memória para quando o navegador não deixa salvar (a comparação vale enquanto a página estiver aberta).
let memorySourceKey: string | null = null

function readSourceKey(): string | null {
  try {
    return localStorage.getItem(SOURCE_KEY) ?? memorySourceKey
  } catch {
    return memorySourceKey
  }
}

function writeSourceKey(value: string) {
  memorySourceKey = value
  try {
    localStorage.setItem(SOURCE_KEY, value)
  } catch {
    // Fica só a cópia em memória.
  }
}

function loadRules(): Rules {
  try {
    const saved = localStorage.getItem(RULES_KEY)
    return saved ? { ...DEFAULT_RULES, ...JSON.parse(saved) } : DEFAULT_RULES
  } catch {
    return DEFAULT_RULES
  }
}

export default function App() {
  const { t, lang, setLang } = useI18n()
  const [comments, setComments] = useState<IgComment[]>([])
  const [source, setSource] = useState<SourceInfo | null>(null)
  const [sourceVersion, setSourceVersion] = useState(0)
  const [rules, setRules] = useState<Rules>(loadRules)

  useEffect(() => {
    try {
      localStorage.setItem(RULES_KEY, JSON.stringify(rules))
    } catch {
      // Sem armazenamento disponível: os critérios só não ficam salvos.
    }
  }, [rules])

  const evaluation = useMemo(() => evaluate(comments, rules, t.rule), [comments, rules, t])

  function handleLoaded(loaded: IgComment[], info: SourceInfo) {
    setComments(loaded)
    setSourceVersion((v) => v + 1)

    // Outro post ou outro perfil = outro sorteio: os critérios voltam ao padrão.
    // O próprio perfil do sorteio normalmente não participa nem conta como marcação.
    const ownerTag = info.owner ? `@${info.owner}` : ''
    const key = sourceKey(info.label, info.owner)
    const rulesReset = key !== readSourceKey()
    if (rulesReset) {
      setRules({ ...DEFAULT_RULES, excludedUsers: ownerTag, ignoredMentions: ownerTag })
      writeSourceKey(key)
    } else if (ownerTag) {
      setRules((r) => ({
        ...r,
        excludedUsers: r.excludedUsers.trim() ? r.excludedUsers : ownerTag,
        ignoredMentions: r.ignoredMentions.trim() ? r.ignoredMentions : ownerTag,
      }))
    }
    setSource({ ...info, rulesReset })
  }

  const languages: Array<[Lang, string]> = [
    ['pt', 'PT'],
    ['en', 'EN'],
  ]

  return (
    <>
      <header className="app-header">
        <div className="container">
          <div className="logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="8" width="18" height="13" rx="2" />
              <path d="M12 8v13M3 12h18M7.5 8a2.5 2.5 0 1 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 1 1 0 5" />
            </svg>
          </div>
          <div className="app-heading">
            <h1>{t.app.title}</h1>
            <p>{t.app.subtitle}</p>
          </div>
          <div className="segmented lang-switch" role="group" aria-label={t.app.language}>
            {languages.map(([code, label]) => (
              <button key={code} className={lang === code ? 'active' : ''} aria-pressed={lang === code} onClick={() => setLang(code)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container">
        <SourcePanel info={source} count={comments.length} onLoaded={handleLoaded} />

        <div className="layout">
          <aside>
            <RulesPanel rules={rules} onChange={setRules} owner={source?.owner} />
          </aside>
          <div className="stack-lg">
            <DrawPanel key={sourceVersion} evaluation={evaluation} rules={rules} />
            <ParticipantsPanel evaluation={evaluation} />
          </div>
        </div>
      </main>

      <footer className="app-footer container">
        <a href={t.app.privacyHref}>{t.app.privacy}</a>
      </footer>
    </>
  )
}

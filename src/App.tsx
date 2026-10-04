import { useEffect, useMemo, useState } from 'react'
import { DrawPanel } from './components/DrawPanel'
import { ParticipantsPanel } from './components/ParticipantsPanel'
import { RulesPanel } from './components/RulesPanel'
import { SourcePanel, type SourceInfo } from './components/SourcePanel'
import { DEFAULT_RULES, evaluate } from './lib/rules'
import type { IgComment, Rules } from './lib/types'
import './App.css'

const RULES_KEY = 'sorteio.rules'

function loadRules(): Rules {
  try {
    const saved = localStorage.getItem(RULES_KEY)
    return saved ? { ...DEFAULT_RULES, ...JSON.parse(saved) } : DEFAULT_RULES
  } catch {
    return DEFAULT_RULES
  }
}

export default function App() {
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

  const evaluation = useMemo(() => evaluate(comments, rules), [comments, rules])

  function handleLoaded(loaded: IgComment[], info: SourceInfo) {
    setComments(loaded)
    setSource(info)
    setSourceVersion((v) => v + 1)
    // O próprio perfil do sorteio normalmente não participa nem conta como marcação.
    if (info.owner) {
      setRules((r) => ({
        ...r,
        excludedUsers: r.excludedUsers.trim() ? r.excludedUsers : `@${info.owner}`,
        ignoredMentions: r.ignoredMentions.trim() ? r.ignoredMentions : `@${info.owner}`,
      }))
    }
  }

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
          <div>
            <h1>Sorteio de comentários</h1>
            <p>Carregue os comentários de uma publicação do Instagram, defina as regras e sorteie.</p>
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
    </>
  )
}

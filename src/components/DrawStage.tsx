import { useEffect, useMemo } from 'react'
import { useI18n } from '../i18n/context'
import type { ParticipantResult } from '../lib/types'

export type StagePhase = 'list' | 'countdown' | 'done'

interface Props {
  phase: StagePhase
  /** Participantes aptos (a lista exibida antes da contagem). */
  pool: ParticipantResult[]
  count: number
  winners: ParticipantResult[]
  alternates: ParticipantResult[]
  onSkip: () => void
  onClose: () => void
}

// Lista longa trava a animação; uma amostra embaralhada já passa a ideia.
const MAX_LIST = 150

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function validComments(p: ParticipantResult) {
  return p.comments.filter((c) => c.valid)
}

export function DrawStage({ phase, pool, count, winners, alternates, onSkip, onClose }: Props) {
  const { t } = useI18n()
  const s = t.stage
  const entries = useMemo(
    () =>
      shuffled(pool.flatMap((p) => validComments(p).map((c) => ({ id: c.comment.id, username: p.username, text: c.comment.text })))).slice(
        0,
        MAX_LIST,
      ),
    [pool],
  )
  const totalComments = pool.reduce((sum, p) => sum + p.validCount, 0)

  // Trava a rolagem da página e fecha com Esc no final.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (phase === 'done' ? onClose : onSkip)()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onClose, onSkip])

  // Velocidade constante: ~0,35 s por comentário, no mínimo 8 s por volta.
  const loopSeconds = Math.max(8, entries.length * 0.35)

  return (
    <div className="stage" role="dialog" aria-modal="true" aria-label={s.label}>
      <div className="stage-inner">
        {phase === 'list' && (
          <>
            <p className="stage-kicker">{s.participating}</p>
            <h2 className="stage-title">{s.summary(pool.length, totalComments)}</h2>
            <div className="stage-list">
              <ul className="stage-scroll" style={{ animationDuration: `${loopSeconds}s` }}>
                {/* Lista duplicada para a rolagem dar a volta sem emenda. */}
                {[...entries, ...entries].map((e, i) => (
                  <li key={`${e.id}-${i}`} aria-hidden={i >= entries.length}>
                    <strong>@{e.username}</strong>
                    <span>{e.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {phase === 'countdown' && (
          <>
            <p className="stage-kicker">{s.countdown}</p>
            <div key={count} className="stage-count" aria-live="assertive">
              {count}
            </div>
          </>
        )}

        {phase === 'done' && (
          <div className="stage-result" aria-live="assertive">
            <p className="stage-kicker">{winners.length > 1 ? s.winners : s.winner}</p>
            {winners.map((w, i) => (
              <div key={w.username} className="stage-winner" style={{ animationDelay: `${i * 200}ms` }}>
                <span className="stage-winner-name">
                  {winners.length > 1 && <small>{s.ordinal(i + 1)} </small>}@{w.username}
                </span>
                {validComments(w)
                  .slice(0, 2)
                  .map((c) => (
                    <p key={c.comment.id} className="stage-winner-comment">
                      “{c.comment.text}”
                    </p>
                  ))}
              </div>
            ))}
            {alternates.length > 0 && (
              <p className="stage-alternates">
                {s.alternates}: {alternates.map((a, i) => `${s.ordinal(i + 1)} @${a.username}`).join(' · ')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="stage-actions">
        {phase === 'done' ? (
          <button className="stage-button" onClick={onClose} autoFocus>
            {s.close}
          </button>
        ) : (
          <button className="stage-button ghost-dark" onClick={onSkip}>
            {s.skip}
          </button>
        )}
      </div>
    </div>
  )
}

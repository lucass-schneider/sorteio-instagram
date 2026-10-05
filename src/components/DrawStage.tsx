import { useEffect, useMemo } from 'react'
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
    <div className="stage" role="dialog" aria-modal="true" aria-label="Sorteio">
      <div className="stage-inner">
        {phase === 'list' && (
          <>
            <p className="stage-kicker">Participando do sorteio</p>
            <h2 className="stage-title">
              {pool.length} {pool.length === 1 ? 'perfil' : 'perfis'} · {totalComments}{' '}
              {totalComments === 1 ? 'comentário válido' : 'comentários válidos'}
            </h2>
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
            <p className="stage-kicker">O resultado sai em</p>
            <div key={count} className="stage-count" aria-live="assertive">
              {count}
            </div>
          </>
        )}

        {phase === 'done' && (
          <div className="stage-result" aria-live="assertive">
            <p className="stage-kicker">{winners.length > 1 ? 'Ganhadores' : 'Ganhador(a)'}</p>
            {winners.map((w, i) => (
              <div key={w.username} className="stage-winner" style={{ animationDelay: `${i * 200}ms` }}>
                <span className="stage-winner-name">
                  {winners.length > 1 && <small>{i + 1}º </small>}@{w.username}
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
                Suplentes: {alternates.map((a, i) => `${i + 1}º @${a.username}`).join(' · ')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="stage-actions">
        {phase === 'done' ? (
          <button className="stage-button" onClick={onClose} autoFocus>
            Fechar
          </button>
        ) : (
          <button className="stage-button ghost-dark" onClick={onSkip}>
            Pular animação
          </button>
        )}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/context'
import type { Messages } from '../i18n/ui'
import { drawWinners } from '../lib/random'
import { describeRules } from '../lib/rules'
import type { Evaluation, ParticipantResult, Rules } from '../lib/types'
import { DrawStage, type StagePhase } from './DrawStage'
import { CommentLine } from './ParticipantsPanel'

interface DrawResult {
  winners: ParticipantResult[]
  alternates: ParticipantResult[]
  at: Date
  qualified: number
  tickets: number
  rules: string[]
  evaluation: Evaluation
}

/** Quanto tempo a lista de comentários aparece antes da contagem. */
const LIST_MS = 6000

function resultText(result: DrawResult, t: Messages): string {
  const r = t.draw.resultText
  const lines = [
    r.heading(result.at.toLocaleString(t.locale)),
    r.qualified(result.qualified, result.tickets),
    '',
    r.rules,
    ...result.rules.map((rule) => `- ${rule}`),
    '',
    result.winners.length > 1 ? r.winners : r.winner,
    ...result.winners.map((w, i) => `${r.ordinal(i + 1)} @${w.username}`),
  ]
  if (result.alternates.length) {
    lines.push('', r.alternates, ...result.alternates.map((w, i) => `${r.ordinal(i + 1)} @${w.username}`))
  }
  return lines.join('\n')
}

function WinnerCard({ participant, label, delay }: { participant: ParticipantResult; label: string; delay: number }) {
  return (
    <article className="winner" style={{ animationDelay: `${delay}ms` }}>
      <span className="winner-pos">{label}</span>
      <a className="winner-name" href={`https://www.instagram.com/${participant.username}/`} target="_blank" rel="noreferrer">
        @{participant.username}
      </a>
      <ul className="comments">
        {participant.comments
          .filter((c) => c.valid)
          .map((c) => (
            <CommentLine key={c.comment.id} result={c} />
          ))}
      </ul>
    </article>
  )
}

export function DrawPanel({ evaluation, rules }: { evaluation: Evaluation; rules: Rules }) {
  const { t } = useI18n()
  const d = t.draw
  const [winnersCount, setWinnersCount] = useState(1)
  const [alternatesCount, setAlternatesCount] = useState(0)
  const [countdownSeconds, setCountdownSeconds] = useState(5)
  const [stage, setStage] = useState<{ phase: StagePhase; count: number; result: DrawResult; pool: ParticipantResult[] } | null>(null)
  const [result, setResult] = useState<DrawResult | null>(null)
  const [copied, setCopied] = useState(false)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  const pool = evaluation.participants.filter((p) => p.qualified)
  const requested = winnersCount + alternatesCount
  const running = stage !== null && stage.phase !== 'done'
  const canDraw = pool.length > 0 && !running

  function finish(final: DrawResult) {
    clearTimers()
    setResult(final)
    setStage((s) => (s ? { ...s, phase: 'done', count: 0 } : s))
  }

  function start() {
    // O resultado é definido aqui, com gerador criptográfico; a animação é só visual.
    const drawn = drawWinners(
      pool.map((p) => ({ username: p.username, tickets: p.tickets })),
      requested,
    )
    const byName = new Map(pool.map((p) => [p.username, p]))
    const picked = drawn.map((u) => byName.get(u)!)
    const final: DrawResult = {
      winners: picked.slice(0, winnersCount),
      alternates: picked.slice(winnersCount),
      // oxlint-disable-next-line react/purity -- start() só roda no clique, não durante a renderização
      at: new Date(),
      qualified: pool.length,
      tickets: evaluation.stats.tickets,
      rules: describeRules(rules, t.rule, t.locale),
      evaluation,
    }

    setResult(null)
    setCopied(false)
    clearTimers()
    setStage({ phase: 'list', count: countdownSeconds, result: final, pool })

    // Lista de comentários -> contagem regressiva (1 por segundo) -> resultado.
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))
    for (let i = 0; i < countdownSeconds; i++) {
      later(LIST_MS + i * 1000, () => setStage((s) => (s ? { ...s, phase: 'countdown', count: countdownSeconds - i } : s)))
    }
    later(LIST_MS + countdownSeconds * 1000, () => finish(final))
  }

  async function copy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(resultText(result, t))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="card draw">
      <header className="card-header">
        <span className="step">4</span>
        <div>
          <h2>{d.title}</h2>
          <p className="muted">
            {pool.length === 0 ? d.none : d.summary(pool.length, evaluation.stats.tickets)}
          </p>
        </div>
      </header>

      <div className="row draw-controls">
        <label className="field">
          <span>{d.winners}</span>
          <input
            type="number"
            min={1}
            max={100}
            value={winnersCount}
            onChange={(e) => setWinnersCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
          />
        </label>
        <label className="field">
          <span>{d.alternates}</span>
          <input
            type="number"
            min={0}
            max={100}
            value={alternatesCount}
            onChange={(e) => setAlternatesCount(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
          />
        </label>
        <label className="field">
          <span>{d.countdown}</span>
          <select value={countdownSeconds} onChange={(e) => setCountdownSeconds(Number(e.target.value))}>
            {[3, 5, 10].map((n) => (
              <option key={n} value={n}>
                {d.seconds(n)}
              </option>
            ))}
          </select>
        </label>
        <button className="primary big" disabled={!canDraw} onClick={start}>
          {running ? d.drawing : result ? d.again : d.start}
        </button>
      </div>

      {pool.length > 0 && requested > pool.length && (
        <p className="status warn">
          {d.tooMany(requested, pool.length)}
        </p>
      )}

      {stage && (
        <DrawStage
          phase={stage.phase}
          pool={stage.pool}
          count={stage.count}
          winners={stage.result.winners}
          alternates={stage.result.alternates}
          onSkip={() => finish(stage.result)}
          onClose={() => setStage(null)}
        />
      )}

      {result && (
        <div className="result" aria-live="polite">
          {result.evaluation !== evaluation && (
            <p className="status warn">{d.changed}</p>
          )}
          <div className="winners">
            {result.winners.map((w, i) => (
              <WinnerCard
                key={w.username}
                participant={w}
                label={result.winners.length > 1 ? d.nthWinner(i + 1) : d.winner}
                delay={i * 150}
              />
            ))}
          </div>
          {result.alternates.length > 0 && (
            <>
              <h3>{d.alternates}</h3>
              <ol className="alternates">
                {result.alternates.map((a) => (
                  <li key={a.username}>
                    <a href={`https://www.instagram.com/${a.username}/`} target="_blank" rel="noreferrer">
                      @{a.username}
                    </a>
                  </li>
                ))}
              </ol>
            </>
          )}
          <div className="result-footer">
            <small className="muted">
              {d.footer(result.at.toLocaleString(t.locale), result.qualified, result.tickets)}
            </small>
            <button className="ghost" onClick={copy}>
              {copied ? d.copied : d.copy}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

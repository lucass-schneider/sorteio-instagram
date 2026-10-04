import { useEffect, useRef, useState } from 'react'
import { drawWinners } from '../lib/random'
import { describeRules } from '../lib/rules'
import type { Evaluation, ParticipantResult, Rules } from '../lib/types'
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

const ROLL_MS = 2400

function resultText(result: DrawResult): string {
  const lines = [
    `Sorteio realizado em ${result.at.toLocaleString('pt-BR')}`,
    `Participantes aptos: ${result.qualified} (${result.tickets} chances)`,
    '',
    'Critérios:',
    ...result.rules.map((r) => `- ${r}`),
    '',
    result.winners.length > 1 ? 'Ganhadores:' : 'Ganhador(a):',
    ...result.winners.map((w, i) => `${i + 1}º @${w.username}`),
  ]
  if (result.alternates.length) {
    lines.push('', 'Suplentes:', ...result.alternates.map((w, i) => `${i + 1}º @${w.username}`))
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
  const [winnersCount, setWinnersCount] = useState(1)
  const [alternatesCount, setAlternatesCount] = useState(0)
  const [rolling, setRolling] = useState<string | null>(null)
  const [result, setResult] = useState<DrawResult | null>(null)
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearInterval(timer.current), [])

  const pool = evaluation.participants.filter((p) => p.qualified)
  const requested = winnersCount + alternatesCount
  const canDraw = pool.length > 0 && rolling === null

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
      at: new Date(),
      qualified: pool.length,
      tickets: evaluation.stats.tickets,
      rules: describeRules(rules),
      evaluation,
    }

    setResult(null)
    setCopied(false)
    const names = pool.map((p) => p.username)
    const startedAt = performance.now()
    window.clearInterval(timer.current)
    timer.current = window.setInterval(() => {
      if (performance.now() - startedAt >= ROLL_MS) {
        window.clearInterval(timer.current)
        setRolling(null)
        setResult(final)
        return
      }
      setRolling(names[Math.floor(Math.random() * names.length)])
    }, 70)
    setRolling(names[0])
  }

  async function copy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(resultText(result))
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
          <h2>Sorteio</h2>
          <p className="muted">
            {pool.length === 0
              ? 'Nenhum participante apto ainda.'
              : `${pool.length} ${pool.length === 1 ? 'perfil apto' : 'perfis aptos'} · ${evaluation.stats.tickets} chances`}
          </p>
        </div>
      </header>

      <div className="row draw-controls">
        <label className="field">
          <span>Ganhadores</span>
          <input
            type="number"
            min={1}
            max={100}
            value={winnersCount}
            onChange={(e) => setWinnersCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
          />
        </label>
        <label className="field">
          <span>Suplentes</span>
          <input
            type="number"
            min={0}
            max={100}
            value={alternatesCount}
            onChange={(e) => setAlternatesCount(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
          />
        </label>
        <button className="primary big" disabled={!canDraw} onClick={start}>
          {rolling !== null ? 'Sorteando…' : result ? 'Sortear de novo' : 'Sortear'}
        </button>
      </div>

      {pool.length > 0 && requested > pool.length && (
        <p className="status warn">
          Pediu {requested} {requested === 1 ? 'nome' : 'nomes'}, mas só há {pool.length} {pool.length === 1 ? 'perfil apto' : 'perfis aptos'}.
        </p>
      )}

      {rolling !== null && (
        <div className="roller" aria-live="polite">
          <span>@{rolling}</span>
        </div>
      )}

      {result && (
        <div className="result" aria-live="polite">
          {result.evaluation !== evaluation && (
            <p className="status warn">Os critérios ou os comentários mudaram depois deste sorteio.</p>
          )}
          <div className="winners">
            {result.winners.map((w, i) => (
              <WinnerCard
                key={w.username}
                participant={w}
                label={result.winners.length > 1 ? `${i + 1}º ganhador` : 'Ganhador(a)'}
                delay={i * 150}
              />
            ))}
          </div>
          {result.alternates.length > 0 && (
            <>
              <h3>Suplentes</h3>
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
              Sorteado em {result.at.toLocaleString('pt-BR')} entre {result.qualified} perfis aptos ({result.tickets} chances), com
              gerador aleatório criptográfico do navegador.
            </small>
            <button className="ghost" onClick={copy}>
              {copied ? 'Copiado!' : 'Copiar resultado'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

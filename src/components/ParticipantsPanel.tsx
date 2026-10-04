import { useMemo, useState } from 'react'
import { formatDate } from '../lib/format'
import type { CommentResult, Evaluation, ParticipantResult } from '../lib/types'

type Filter = 'all' | 'qualified' | 'disqualified'
const PAGE = 100

export function CommentLine({ result }: { result: CommentResult }) {
  return (
    <li className={result.valid ? 'comment valid' : 'comment invalid'}>
      <span className="comment-icon" aria-label={result.valid ? 'válido' : 'inválido'}>
        {result.valid ? '✓' : '✕'}
      </span>
      <div>
        <p className="comment-text">
          {result.comment.isReply && <span className="tag">resposta</span>}
          {result.comment.text || <em className="muted">(sem texto)</em>}
        </p>
        <small className="muted">
          {formatDate(result.comment.timestamp)}
          {result.reasons.length > 0 && <span className="reason"> · {result.reasons.join(' · ')}</span>}
        </small>
      </div>
    </li>
  )
}

function ParticipantRow({ participant }: { participant: ParticipantResult }) {
  const total = participant.comments.length
  return (
    <details className={participant.qualified ? 'participant ok' : 'participant out'}>
      <summary>
        <span className="dot" aria-hidden="true" />
        <span className="username">@{participant.username}</span>
        <span className="muted count">
          {participant.validCount}/{total} {total === 1 ? 'válido' : 'válidos'}
          {participant.tickets > 1 && ` · ${participant.tickets} chances`}
        </span>
        {!participant.qualified && <span className="reason">{participant.reasons.join(' · ')}</span>}
      </summary>
      <ul className="comments">
        {participant.comments.map((r) => (
          <CommentLine key={r.comment.id} result={r} />
        ))}
      </ul>
    </details>
  )
}

export function ParticipantsPanel({ evaluation }: { evaluation: Evaluation }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const { participants, stats } = evaluation

  const visible = useMemo(() => {
    const term = search.trim().replace(/^@/, '').toLowerCase()
    return participants.filter(
      (p) =>
        (filter === 'all' || (filter === 'qualified') === p.qualified) &&
        (!term || p.username.includes(term) || p.comments.some((c) => c.comment.text.toLowerCase().includes(term))),
    )
  }, [participants, filter, search])

  const filters: Array<[Filter, string, number]> = [
    ['all', 'Todos', stats.users],
    ['qualified', 'Aptos', stats.qualified],
    ['disqualified', 'Desclassificados', stats.disqualified],
  ]

  return (
    <section className="card">
      <header className="card-header">
        <span className="step">3</span>
        <div>
          <h2>Participantes</h2>
          <p className="muted">Clique em um perfil para ver os comentários e o motivo de cada um.</p>
        </div>
      </header>

      <div className="stats">
        <div>
          <strong>{stats.totalComments}</strong>
          <span>comentários</span>
        </div>
        <div>
          <strong>{stats.users}</strong>
          <span>perfis</span>
        </div>
        <div className="ok">
          <strong>{stats.qualified}</strong>
          <span>aptos</span>
        </div>
        <div className="out">
          <strong>{stats.disqualified}</strong>
          <span>desclassificados</span>
        </div>
        <div>
          <strong>{stats.tickets}</strong>
          <span>chances</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="segmented">
          {filters.map(([value, label, n]) => (
            <button
              key={value}
              className={filter === value ? 'active' : ''}
              onClick={() => {
                setFilter(value)
                setLimit(PAGE)
              }}
            >
              {label} <span className="muted">{n}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Buscar perfil ou texto"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setLimit(PAGE)
          }}
        />
      </div>

      {visible.length === 0 ? (
        <p className="empty muted">Nenhum perfil nesta lista.</p>
      ) : (
        <div className="participants">
          {visible.slice(0, limit).map((p) => (
            <ParticipantRow key={p.username} participant={p} />
          ))}
        </div>
      )}
      {visible.length > limit && (
        <button className="ghost full" onClick={() => setLimit((l) => l + PAGE)}>
          Mostrar mais ({visible.length - limit} restantes)
        </button>
      )}
    </section>
  )
}

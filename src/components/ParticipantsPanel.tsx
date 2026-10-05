import { useMemo, useState } from 'react'
import { useI18n } from '../i18n/context'
import { formatDate } from '../lib/format'
import type { CommentResult, Evaluation, ParticipantResult } from '../lib/types'

type Filter = 'all' | 'qualified' | 'disqualified'
const PAGE = 100

export function CommentLine({ result }: { result: CommentResult }) {
  const { t } = useI18n()
  return (
    <li className={result.valid ? 'comment valid' : 'comment invalid'}>
      <span className="comment-icon" aria-label={result.valid ? t.participants.valid : t.participants.invalid}>
        {result.valid ? '✓' : '✕'}
      </span>
      <div>
        <p className="comment-text">
          {result.comment.isReply && <span className="tag">{t.participants.reply}</span>}
          {result.comment.text || <em className="muted">{t.participants.noText}</em>}
        </p>
        <small className="muted">
          {formatDate(result.comment.timestamp, t.locale)}
          {result.reasons.length > 0 && <span className="reason"> · {result.reasons.join(' · ')}</span>}
        </small>
      </div>
    </li>
  )
}

function ParticipantRow({ participant }: { participant: ParticipantResult }) {
  const { t } = useI18n()
  return (
    <details className={participant.qualified ? 'participant ok' : 'participant out'}>
      <summary>
        <span className="dot" aria-hidden="true" />
        <span className="username">@{participant.username}</span>
        <span className="muted count">
          {t.participants.validCount(participant.validCount, participant.comments.length)}
          {participant.tickets > 1 && ` · ${t.participants.entriesCount(participant.tickets)}`}
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
  const { t } = useI18n()
  const p = t.participants
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const { participants, stats } = evaluation

  const visible = useMemo(() => {
    const term = search.trim().replace(/^@/, '').toLowerCase()
    return participants.filter(
      (x) =>
        (filter === 'all' || (filter === 'qualified') === x.qualified) &&
        (!term || x.username.includes(term) || x.comments.some((c) => c.comment.text.toLowerCase().includes(term))),
    )
  }, [participants, filter, search])

  const filters: Array<[Filter, string, number]> = [
    ['all', p.all, stats.users],
    ['qualified', p.qualifiedTab, stats.qualified],
    ['disqualified', p.disqualifiedTab, stats.disqualified],
  ]

  return (
    <section className="card">
      <header className="card-header">
        <span className="step">3</span>
        <div>
          <h2>{p.title}</h2>
          <p className="muted">{p.subtitle}</p>
        </div>
      </header>

      <div className="stats">
        <div>
          <strong>{stats.totalComments}</strong>
          <span>{p.comments}</span>
        </div>
        <div>
          <strong>{stats.users}</strong>
          <span>{p.profiles}</span>
        </div>
        <div className="ok">
          <strong>{stats.qualified}</strong>
          <span>{p.qualified}</span>
        </div>
        <div className="out">
          <strong>{stats.disqualified}</strong>
          <span>{p.disqualified}</span>
        </div>
        <div>
          <strong>{stats.tickets}</strong>
          <span>{p.entries}</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="segmented">
          {filters.map(([value, label, count]) => (
            <button
              key={value}
              className={filter === value ? 'active' : ''}
              onClick={() => {
                setFilter(value)
                setLimit(PAGE)
              }}
            >
              {label} <span className="muted">{count}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder={p.search}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setLimit(PAGE)
          }}
        />
      </div>

      {visible.length === 0 ? (
        <p className="empty muted">{p.none}</p>
      ) : (
        <div className="participants">
          {visible.slice(0, limit).map((x) => (
            <ParticipantRow key={x.username} participant={x} />
          ))}
        </div>
      )}
      {visible.length > limit && (
        <button className="ghost full" onClick={() => setLimit((l) => l + PAGE)}>
          {p.showMore(visible.length - limit)}
        </button>
      )}
    </section>
  )
}

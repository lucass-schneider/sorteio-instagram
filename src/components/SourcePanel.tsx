import { useRef, useState } from 'react'
import { useI18n } from '../i18n/context'
import { instagramLoginEnabled, useInstagramLogin } from '../lib/auth'
import { demoComments } from '../lib/demo'
import { fetchPostComments, InvalidTokenError, tokenKind } from '../lib/instagram'
import { parseImport } from '../lib/parse'
import type { IgComment } from '../lib/types'

export interface SourceInfo {
  label: string
  owner?: string
  warnings: string[]
  /** true quando o post ou o perfil mudou e os critérios voltaram ao padrão. */
  rulesReset?: boolean
}

interface Props {
  info: SourceInfo | null
  count: number
  onLoaded: (comments: IgComment[], info: SourceInfo) => void
}

type Tab = 'api' | 'import'
type Status = { kind: 'idle' | 'loading' | 'error'; message: string }

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function SourcePanel({ info, count, onLoaded }: Props) {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('api')
  const [link, setLink] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [importText, setImportText] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle', message: '' })
  const abortRef = useRef<AbortController | null>(null)
  const { session, status: loginStatus, login, logout } = useInstagramLogin()

  // Um token digitado manualmente tem prioridade sobre o login.
  const manualToken = token.trim()
  const activeToken = manualToken || session?.token || ''

  async function handleFetch() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setStatus({ kind: 'loading', message: t.source.connecting })
    try {
      const result = await fetchPostComments(
        link,
        activeToken,
        (message) => setStatus({ kind: 'loading', message }),
        controller.signal,
        manualToken ? tokenKind(manualToken) : 'instagram',
        t.api,
      )
      const warnings: string[] = []
      if (result.missingUsernames > 0) {
        warnings.push(t.source.missingUsernames(result.missingUsernames, result.comments.length, result.sampleFields?.join(', ') ?? ''))
      }
      if (result.expectedCount && result.comments.length < result.expectedCount) {
        warnings.push(t.source.fewerThanExpected(result.expectedCount, result.comments.length))
      }
      onLoaded(result.comments, {
        label: result.permalink ?? link,
        owner: result.owner,
        warnings,
      })
      setStatus({ kind: 'idle', message: '' })
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setStatus({ kind: 'idle', message: '' })
      } else if (err instanceof InvalidTokenError && !manualToken && session) {
        setStatus({ kind: 'idle', message: '' })
        logout('expired')
      } else {
        setStatus({ kind: 'error', message: (err as Error).message })
      }
    }
  }

  function loadImport(text: string, label: string) {
    try {
      const { comments, warnings } = parseImport(text, t.parse)
      if (comments.length === 0) {
        setStatus({ kind: 'error', message: t.source.noneRecognized })
        return
      }
      onLoaded(comments, { label, warnings })
      setStatus({ kind: 'idle', message: '' })
    } catch (err) {
      setStatus({ kind: 'error', message: t.source.cannotRead((err as Error).message) })
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    const text = await file.text()
    setImportText(text)
    loadImport(text, file.name)
  }

  const loading = status.kind === 'loading'

  function tokenField(required: boolean) {
    return (
      <label className="field">
        <span>{t.source.tokenLabel}</span>
        <div className="input-with-button">
          <input
            type={showToken ? 'text' : 'password'}
            placeholder={t.source.tokenPlaceholder}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            required={required}
          />
          <button type="button" className="ghost" onClick={() => setShowToken((v) => !v)}>
            {showToken ? t.source.hide : t.source.show}
          </button>
        </div>
        <small className="muted">{t.source.tokenNote}</small>
      </label>
    )
  }

  return (
    <section className="card">
      <header className="card-header">
        <span className="step">1</span>
        <div>
          <h2>{t.source.title}</h2>
          <p className="muted">{t.source.subtitle}</p>
        </div>
      </header>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'api'} className={tab === 'api' ? 'active' : ''} onClick={() => setTab('api')}>
          {t.source.tabApi}
        </button>
        <button role="tab" aria-selected={tab === 'import'} className={tab === 'import' ? 'active' : ''} onClick={() => setTab('import')}>
          {t.source.tabImport}
        </button>
      </div>

      {tab === 'api' ? (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            handleFetch()
          }}
        >
          {instagramLoginEnabled && (
            <div className="account">
              {session ? (
                <>
                  <span className="account-icon">
                    <InstagramIcon />
                  </span>
                  <span className="account-name">
                    {t.source.connectedAs} <strong>{session.username ? `@${session.username}` : t.source.yourAccount}</strong>
                  </span>
                  <button type="button" className="ghost" onClick={() => logout()}>
                    {t.source.logout}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="primary instagram" onClick={login} disabled={loginStatus.kind === 'loading'}>
                    <InstagramIcon />
                    {t.source.login}
                  </button>
                  <small className="muted">{t.source.loginHint}</small>
                </>
              )}
            </div>
          )}
          {loginStatus.kind !== 'idle' && (
            <p className={`status ${loginStatus.kind}`}>
              {t.source.login_[loginStatus.code]}
              {loginStatus.detail && loginStatus.code !== 'serverUnreachable' && ` (${loginStatus.detail})`}
            </p>
          )}

          <label className="field">
            <span>{t.source.link}</span>
            <input
              type="text"
              placeholder="https://www.instagram.com/p/XXXXXXXXXXX/"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
            />
          </label>

          {!instagramLoginEnabled && tokenField(true)}

          <div className="actions">
            <button type="submit" className="primary" disabled={loading || (instagramLoginEnabled && !activeToken)}>
              {loading ? t.source.fetching : t.source.fetch}
            </button>
            {loading && (
              <button type="button" className="ghost" onClick={() => abortRef.current?.abort()}>
                {t.source.cancel}
              </button>
            )}
          </div>

          <details className="help">
            <summary>{instagramLoginEnabled ? t.source.manualToken : t.source.whyToken}</summary>
            {instagramLoginEnabled && tokenField(false)}
            {t.source.help}
          </details>
        </form>
      ) : (
        <div className="stack">
          <label className="field">
            <span>{t.source.importLabel}</span>
            <textarea rows={7} placeholder={t.source.importPlaceholder} value={importText} onChange={(e) => setImportText(e.target.value)} />
          </label>
          <small className="muted">{t.source.importFormats}</small>
          <div className="actions">
            <button className="primary" onClick={() => loadImport(importText, t.source.pastedLabel)} disabled={!importText.trim()}>
              {t.source.load}
            </button>
            <label className="button ghost">
              {t.source.chooseFile}
              <input
                type="file"
                accept=".json,.csv,.txt,application/json,text/csv,text/plain"
                hidden
                onChange={(e) => {
                  handleFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
            <button className="ghost" onClick={() => onLoaded(demoComments(), { label: t.source.sampleLabel, owner: 'lojaexemplo', warnings: [] })}>
              {t.source.sample}
            </button>
          </div>
        </div>
      )}

      {status.kind === 'loading' && <p className="status loading">{status.message}</p>}
      {status.kind === 'error' && <p className="status error">{status.message}</p>}

      {info && (
        <div className="loaded">
          <p>
            <strong>{t.source.loaded(count)}</strong>
            <span className="muted"> · {info.label}</span>
            {info.owner && (
              <span className="muted">
                {' '}
                · {t.source.profile} @{info.owner}
              </span>
            )}
          </p>
          {info.rulesReset && <p className="muted">{t.source.rulesReset}</p>}
          {info.warnings.map((w) => (
            <p key={w} className="status warn">
              {w}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}

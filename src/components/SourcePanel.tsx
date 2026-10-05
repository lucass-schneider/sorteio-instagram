import { useRef, useState } from 'react'
import { instagramLoginEnabled, useInstagramLogin } from '../lib/auth'
import { demoComments } from '../lib/demo'
import { fetchPostComments, InvalidTokenError, tokenKind } from '../lib/instagram'
import { parseImport } from '../lib/parse'
import type { IgComment } from '../lib/types'

export interface SourceInfo {
  label: string
  owner?: string
  warnings: string[]
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
    setStatus({ kind: 'loading', message: 'Conectando…' })
    try {
      const result = await fetchPostComments(
        link,
        activeToken,
        (message) => setStatus({ kind: 'loading', message }),
        controller.signal,
        manualToken ? tokenKind(manualToken) : 'instagram',
      )
      const warnings: string[] = []
      if (result.missingUsernames > 0) {
        warnings.push(
          `A API do Instagram não informou o @ de ${result.missingUsernames} de ${result.comments.length} comentários. ` +
            `Campos recebidos: ${result.sampleFields?.join(', ') || 'nenhum'}.`,
        )
      }
      if (result.expectedCount && result.comments.length < result.expectedCount) {
        warnings.push(
          `O Instagram informa ~${result.expectedCount} comentários, mas a API entregou ${result.comments.length}. ` +
            'Comentários ocultos, apagados ou de contas restritas não são retornados.',
        )
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
        logout('Sua sessão do Instagram expirou. Entre de novo.')
      } else {
        setStatus({ kind: 'error', message: (err as Error).message })
      }
    }
  }

  function loadImport(text: string, label: string) {
    try {
      const { comments, warnings } = parseImport(text)
      if (comments.length === 0) {
        setStatus({ kind: 'error', message: 'Nenhum comentário reconhecido. Confira o formato.' })
        return
      }
      onLoaded(comments, { label, warnings })
      setStatus({ kind: 'idle', message: '' })
    } catch (err) {
      setStatus({ kind: 'error', message: `Não foi possível ler: ${(err as Error).message}` })
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
        <span>Token de acesso da Meta</span>
        <div className="input-with-button">
          <input
            type={showToken ? 'text' : 'password'}
            placeholder="IGAA… ou EAA…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            required={required}
          />
          <button type="button" className="ghost" onClick={() => setShowToken((v) => !v)}>
            {showToken ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <small className="muted">O token fica só nesta aba e é enviado apenas para a API da Meta.</small>
      </label>
    )
  }

  return (
    <section className="card">
      <header className="card-header">
        <span className="step">1</span>
        <div>
          <h2>Comentários</h2>
          <p className="muted">De onde vêm os comentários da publicação.</p>
        </div>
      </header>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'api'} className={tab === 'api' ? 'active' : ''} onClick={() => setTab('api')}>
          Buscar no Instagram
        </button>
        <button role="tab" aria-selected={tab === 'import'} className={tab === 'import' ? 'active' : ''} onClick={() => setTab('import')}>
          Importar arquivo / texto
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
                    Conectado como <strong>{session.username ? `@${session.username}` : 'sua conta'}</strong>
                  </span>
                  <button type="button" className="ghost" onClick={() => logout()}>
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="primary instagram" onClick={login} disabled={loginStatus.kind === 'loading'}>
                    <InstagramIcon />
                    Entrar com Instagram
                  </button>
                  <small className="muted">
                    Você autoriza no Instagram e volta para cá. Precisa ser uma conta Profissional (Comercial ou Criador de
                    conteúdo), e só dá para buscar publicações dela.
                  </small>
                </>
              )}
            </div>
          )}
          {loginStatus.kind !== 'idle' && <p className={`status ${loginStatus.kind}`}>{loginStatus.message}</p>}

          <label className="field">
            <span>Link da publicação</span>
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
              {loading ? 'Buscando…' : 'Buscar comentários'}
            </button>
            {loading && (
              <button type="button" className="ghost" onClick={() => abortRef.current?.abort()}>
                Cancelar
              </button>
            )}
          </div>

          <details className="help">
            <summary>{instagramLoginEnabled ? 'Usar um token manualmente (avançado)' : 'Por que precisa de token? Como conseguir um?'}</summary>
            {instagramLoginEnabled && tokenField(false)}
            <p>
              O Instagram não libera comentários só pelo link: sem login, a página bloqueia o acesso e o navegador
              impede leituras de outro site. O caminho oficial é a API da Meta, que funciona para publicações da{' '}
              <strong>sua própria conta Profissional</strong> (Comercial ou Criador de conteúdo).
            </p>
            <ol>
              <li>No app do Instagram, deixe a conta como Profissional (Configurações → Tipo de conta).</li>
              <li>
                Em <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">developers.facebook.com/apps</a>, crie
                um app e adicione o produto <strong>Instagram</strong> → <em>API com login do Instagram</em>.
              </li>
              <li>
                Em <em>Gerar tokens de acesso</em>, adicione sua conta do Instagram e gere o token (começa com <code>IG</code>).
                Permissões: <code>instagram_business_basic</code> e <code>instagram_business_manage_comments</code>.
              </li>
              <li>Cole o link do post e o token aqui.</li>
            </ol>
            <p className="muted">
              Também aceita token do Facebook (começa com <code>EAA</code>, ex.: pelo Graph API Explorer) com{' '}
              <code>instagram_basic</code>, <code>instagram_manage_comments</code>, <code>pages_show_list</code> e{' '}
              <code>pages_read_engagement</code>, para contas ligadas a uma Página. Se a busca pelo link não achar o post,
              cole o ID numérico da mídia no lugar do link.
            </p>
          </details>
        </form>
      ) : (
        <div className="stack">
          <label className="field">
            <span>Cole os comentários ou envie um arquivo (.json, .csv, .txt)</span>
            <textarea
              rows={7}
              placeholder={'usuario: texto do comentário\nana.souza: Quero! @carla @bia\nbruno_r: Participando @joao @lucas'}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </label>
          <small className="muted">
            Formatos aceitos: JSON (lista com <code>username</code>, <code>text</code>, <code>timestamp</code>), CSV com
            cabeçalho (ex.: <code>Usuário;Comentário;Data</code>) ou uma linha por comentário no formato{' '}
            <code>usuario: comentário</code>. Serve para exportações de ferramentas de terceiros.
          </small>
          <div className="actions">
            <button className="primary" onClick={() => loadImport(importText, 'Texto colado')} disabled={!importText.trim()}>
              Carregar
            </button>
            <label className="button ghost">
              Escolher arquivo
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
            <button className="ghost" onClick={() => onLoaded(demoComments(), { label: 'Dados de exemplo', owner: 'lojaexemplo', warnings: [] })}>
              Usar dados de exemplo
            </button>
          </div>
        </div>
      )}

      {status.kind === 'loading' && <p className="status loading">{status.message}</p>}
      {status.kind === 'error' && <p className="status error">{status.message}</p>}

      {info && (
        <div className="loaded">
          <p>
            <strong>{count} comentários carregados</strong>
            <span className="muted"> · {info.label}</span>
            {info.owner && <span className="muted"> · perfil @{info.owner}</span>}
          </p>
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

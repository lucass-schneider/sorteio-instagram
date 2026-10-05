import { useEffect, useState } from 'react'
import { fetchUsername } from './instagram'

/**
 * "Login com Instagram" (OAuth da API do Instagram com login do Instagram).
 * O site manda a pessoa para o Instagram, recebe um código de volta e o servidor
 * de login (auth-worker/) troca esse código por um token.
 */
const APP_ID = import.meta.env.VITE_INSTAGRAM_APP_ID as string | undefined
const AUTH_URL = (import.meta.env.VITE_AUTH_API_URL as string | undefined)?.replace(/\/+$/, '')

export const instagramLoginEnabled = Boolean(APP_ID && AUTH_URL)

const SCOPES = ['instagram_business_basic', 'instagram_business_manage_comments']
const SESSION_KEY = 'sorteio.instagramSession'
const STATE_KEY = 'sorteio.oauthState'

export interface InstagramSession {
  token: string
  username?: string
  expiresAt?: number
}

/** Situação do login; o texto é escolhido pela tela, no idioma atual. */
export type LoginCode = 'finishing' | 'cancelled' | 'notCompleted' | 'badState' | 'serverUnreachable' | 'failed' | 'expired'
export type LoginStatus = { kind: 'idle' } | { kind: 'loading' | 'error'; code: LoginCode; detail?: string }

class LoginError extends Error {
  code: LoginCode
  constructor(code: LoginCode, detail?: string) {
    super(detail ?? code)
    this.code = code
  }
}

/** Precisa ser idêntico ao URI de redirecionamento cadastrado no painel da Meta. */
function redirectUri(): string {
  return new URL('.', window.location.href).href
}

function randomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function readSession(): InstagramSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as InstagramSession
    if (!session.token || (session.expiresAt && session.expiresAt < Date.now())) return null
    return session
  } catch {
    return null
  }
}

function writeSession(session: InstagramSession | null) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Sem armazenamento: o login vale só enquanto a página estiver aberta.
  }
}

function startLogin() {
  const state = randomState()
  try {
    sessionStorage.setItem(STATE_KEY, state)
  } catch {
    // Sem sessionStorage a verificação de estado falha no retorno e o login é recusado.
  }
  const params = new URLSearchParams({
    client_id: APP_ID ?? '',
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPES.join(','),
    state,
  })
  window.location.assign(`https://www.instagram.com/oauth/authorize?${params}`)
}

type RedirectResult = { code: string } | { error: LoginCode; detail?: string } | null

/** Lê o retorno do Instagram (?code=… ou ?error=…) e já limpa a URL. */
function consumeRedirect(): RedirectResult {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  if (!code && !error) return null

  const state = url.searchParams.get('state')
  const description = url.searchParams.get('error_description')
  let expected: string | null = null
  try {
    expected = sessionStorage.getItem(STATE_KEY)
    sessionStorage.removeItem(STATE_KEY)
  } catch {
    expected = null
  }
  for (const key of ['code', 'state', 'error', 'error_reason', 'error_description']) url.searchParams.delete(key)
  url.hash = ''
  window.history.replaceState(null, '', url.href)

  if (error) {
    return error === 'access_denied' ? { error: 'cancelled' } : { error: 'notCompleted', detail: description ?? error }
  }
  if (!expected || state !== expected) {
    return { error: 'badState' }
  }
  return { code: code! }
}

async function exchangeCode(code: string): Promise<InstagramSession> {
  let response: Response
  try {
    response = await fetch(`${AUTH_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
  } catch (err) {
    throw new LoginError('serverUnreachable', String(err))
  }
  const body = (await response.json().catch(() => null)) as { access_token?: string; expires_in?: number; error?: string } | null
  if (!response.ok || !body?.access_token) {
    throw new LoginError('failed', body?.error ?? `HTTP ${response.status}`)
  }
  const session: InstagramSession = {
    token: body.access_token,
    expiresAt: body.expires_in ? Date.now() + body.expires_in * 1000 : undefined,
  }
  session.username = await fetchUsername(session.token).catch(() => undefined)
  return session
}

// O retorno do Instagram é lido uma única vez, ao carregar a página, e a troca do código
// também acontece uma vez só (o código não pode ser reutilizado).
const redirect = instagramLoginEnabled ? consumeRedirect() : null
let pendingExchange: Promise<InstagramSession> | null = null

function initialStatus(): LoginStatus {
  if (redirect && 'error' in redirect) return { kind: 'error', code: redirect.error, detail: redirect.detail }
  if (redirect && 'code' in redirect) return { kind: 'loading', code: 'finishing' }
  return { kind: 'idle' }
}

export function useInstagramLogin() {
  const [session, setSession] = useState<InstagramSession | null>(readSession)
  const [status, setStatus] = useState<LoginStatus>(initialStatus)

  useEffect(() => {
    if (!redirect || !('code' in redirect)) return
    let active = true
    pendingExchange ??= exchangeCode(redirect.code).then((s) => {
      writeSession(s)
      return s
    })
    pendingExchange
      .then((s) => {
        if (!active) return
        setSession(s)
        setStatus({ kind: 'idle' })
      })
      .catch((err: Error) => {
        if (active) setStatus({ kind: 'error', code: err instanceof LoginError ? err.code : 'failed', detail: err.message })
      })
    return () => {
      active = false
    }
  }, [])

  function logout(reason?: LoginCode) {
    writeSession(null)
    setSession(null)
    setStatus(reason ? { kind: 'error', code: reason } : { kind: 'idle' })
  }

  return { session, status, login: startLogin, logout }
}

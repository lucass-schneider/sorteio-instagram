import { afterEach, describe, expect, it, vi } from 'vitest'
import worker, { type Env } from './index.ts'

const env: Env = {
  INSTAGRAM_APP_ID: '123',
  INSTAGRAM_APP_SECRET: 'segredo',
  REDIRECT_URI: 'https://lucass-schneider.github.io/sorteio-instagram/',
}
const ORIGIN = 'https://lucass-schneider.github.io'

function post(body: unknown, origin = ORIGIN) {
  return new Request('https://auth.example.workers.dev/token', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockFetch(...responses: Array<[number, unknown]>) {
  const fn = vi.fn()
  for (const [status, body] of responses) {
    fn.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
  }
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('auth worker', () => {
  it('responde ao preflight só para a origem do site', async () => {
    const ok = await worker.fetch(new Request('https://x/token', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), env)
    expect(ok.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN)
    const other = await worker.fetch(new Request('https://x/token', { method: 'OPTIONS', headers: { Origin: 'https://evil.com' } }), env)
    expect(other.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('recusa outras origens', async () => {
    const res = await worker.fetch(post({ code: 'abc' }, 'https://evil.com'), env)
    expect(res.status).toBe(403)
  })

  it('troca o código pelo token de longa duração', async () => {
    const fetch = mockFetch([200, { data: [{ access_token: 'curto' }] }], [200, { access_token: 'longo', expires_in: 5184000 }])
    const res = await worker.fetch(post({ code: 'abc#_' }), env)
    expect(await res.json()).toEqual({ access_token: 'longo', expires_in: 5184000 })

    const form = fetch.mock.calls[0][1].body as URLSearchParams
    expect(form.get('code')).toBe('abc')
    expect(form.get('client_secret')).toBe('segredo')
    expect(form.get('redirect_uri')).toBe(env.REDIRECT_URI)
  })

  it('usa o token curto se a troca pelo longo falhar', async () => {
    mockFetch([200, { access_token: 'curto' }], [400, { error: { message: 'x' } }])
    const res = await worker.fetch(post({ code: 'abc' }), env)
    expect(await res.json()).toEqual({ access_token: 'curto', expires_in: 3600 })
  })

  it('repassa o erro do Instagram', async () => {
    mockFetch([400, { error_type: 'OAuthException', code: 400, error_message: 'Code expirado' }])
    const res = await worker.fetch(post({ code: 'abc' }), env)
    expect(res.status).toBe(502)
    expect(((await res.json()) as { error: string }).error).toContain('Code expirado')
  })
})

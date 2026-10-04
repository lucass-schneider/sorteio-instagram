/**
 * Cloudflare Worker que conclui o "Login com Instagram".
 *
 * O Instagram devolve um código para o site; trocar esse código por um token exige
 * a chave secreta do app, que não pode ficar no site (é público). Este worker faz a troca
 * e devolve ao site um token de longa duração (~60 dias).
 *
 * Variáveis (wrangler.toml):  INSTAGRAM_APP_ID, REDIRECT_URI
 * Segredo (wrangler secret):   INSTAGRAM_APP_SECRET
 */

export interface Env {
  INSTAGRAM_APP_ID: string
  INSTAGRAM_APP_SECRET: string
  REDIRECT_URI: string
}

interface ShortTokenResponse {
  access_token?: string
  data?: Array<{ access_token?: string }>
  error_message?: string
  error?: { message?: string }
}

interface LongTokenResponse {
  access_token?: string
  expires_in?: number
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

async function exchangeCode(code: string, env: Env): Promise<{ access_token: string; expires_in?: number }> {
  const form = new URLSearchParams({
    client_id: env.INSTAGRAM_APP_ID,
    client_secret: env.INSTAGRAM_APP_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: env.REDIRECT_URI,
    code,
  })
  const shortRes = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', body: form })
  const short = (await shortRes.json().catch(() => ({}))) as ShortTokenResponse
  // A API já respondeu nos dois formatos: { access_token } e { data: [{ access_token }] }.
  const shortToken = short.access_token ?? short.data?.[0]?.access_token
  if (!shortRes.ok || !shortToken) {
    throw new Error(short.error_message ?? short.error?.message ?? `Instagram respondeu HTTP ${shortRes.status}`)
  }

  // Token curto vale 1 hora; troca pelo de ~60 dias. Se falhar, usa o curto mesmo.
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: env.INSTAGRAM_APP_SECRET,
    access_token: shortToken,
  })
  const longRes = await fetch(`https://graph.instagram.com/access_token?${params}`)
  const long = (await longRes.json().catch(() => ({}))) as LongTokenResponse
  if (longRes.ok && long.access_token) {
    return { access_token: long.access_token, expires_in: long.expires_in }
  }
  return { access_token: shortToken, expires_in: 3600 }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigin = new URL(env.REDIRECT_URI).origin
    const origin = request.headers.get('Origin')
    const cors: Record<string, string> =
      origin === allowedOrigin
        ? {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            Vary: 'Origin',
          }
        : {}

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    const { pathname } = new URL(request.url)
    if (pathname !== '/token' || request.method !== 'POST') {
      return json({ error: 'Não encontrado.' }, 404, cors)
    }
    if (origin !== allowedOrigin) {
      return json({ error: 'Origem não permitida.' }, 403, cors)
    }
    if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET) {
      return json({ error: 'Servidor de login sem INSTAGRAM_APP_ID/INSTAGRAM_APP_SECRET configurados.' }, 500, cors)
    }

    const body = (await request.json().catch(() => null)) as { code?: unknown } | null
    const code = typeof body?.code === 'string' ? body.code.replace(/#_$/, '') : ''
    if (!code) return json({ error: 'Código de login ausente.' }, 400, cors)

    try {
      return json(await exchangeCode(code, env), 200, cors)
    } catch (err) {
      return json({ error: `Não foi possível concluir o login: ${(err as Error).message}` }, 502, cors)
    }
  },
}

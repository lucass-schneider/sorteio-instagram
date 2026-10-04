import type { IgComment } from './types'

/**
 * Busca de comentários pela API oficial da Meta. Só funciona para publicações
 * de contas Profissionais (Comercial/Criador de conteúdo) às quais o token dá acesso.
 *
 * - Token "Instagram Login" (começa com IG...)  -> graph.instagram.com
 * - Token "Facebook Login" (começa com EAA...)  -> graph.facebook.com (conta ligada a uma Página)
 */
const GRAPH_VERSION = 'v23.0'
const MAX_MEDIA_SCAN = 5000

/** Token inválido ou expirado (erro 190 da API). */
export class InvalidTokenError extends Error {}

export type TokenKind = 'instagram' | 'facebook'

export interface FetchProgress {
  (message: string): void
}

export interface FetchResult {
  comments: IgComment[]
  owner?: string
  permalink?: string
  expectedCount?: number
}

interface Paged<T> {
  data: T[]
  paging?: { next?: string }
}

interface ApiComment {
  id: string
  text?: string
  timestamp?: string
  username?: string
  from?: { username?: string }
  replies?: Paged<ApiComment>
}

interface ApiMedia {
  id: string
  permalink?: string
  username?: string
  comments_count?: number
}

export function extractShortcode(link: string): string | null {
  const match = link.match(/instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i)
  return match ? match[1] : null
}

export function tokenKind(token: string): TokenKind {
  return token.trim().startsWith('IG') ? 'instagram' : 'facebook'
}

function baseUrl(kind: TokenKind): string {
  return kind === 'instagram'
    ? `https://graph.instagram.com/${GRAPH_VERSION}`
    : `https://graph.facebook.com/${GRAPH_VERSION}`
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new Error('Falha de rede ao acessar a API da Meta. Verifique sua conexão.', { cause: err })
  }
  const body = await response.json().catch(() => null)
  if (!response.ok || body?.error) {
    const message: string = body?.error?.message ?? `HTTP ${response.status}`
    if (body?.error?.code === 190) {
      throw new InvalidTokenError(`Token inválido ou expirado. (${message})`)
    }
    throw new Error(`API do Instagram: ${message}`)
  }
  return body as T
}

function withToken(url: string, token: string): string {
  // Os links "paging.next" da API já trazem o token.
  if (/[?&]access_token=/.test(url)) return url
  return url + (url.includes('?') ? '&' : '?') + 'access_token=' + encodeURIComponent(token)
}

async function* pages<T>(firstUrl: string, token: string, signal?: AbortSignal): AsyncGenerator<T[]> {
  let next: string | undefined = withToken(firstUrl, token)
  while (next) {
    const page: Paged<T> = await getJson<Paged<T>>(next, signal)
    yield page.data ?? []
    next = page.paging?.next
  }
}

function sameShortcode(media: ApiMedia, shortcode: string): boolean {
  return media.permalink ? extractShortcode(media.permalink) === shortcode : false
}

async function findMedia(
  token: string,
  kind: TokenKind,
  shortcode: string,
  onProgress: FetchProgress,
  signal?: AbortSignal,
): Promise<ApiMedia> {
  const base = baseUrl(kind)
  const fields = 'id,permalink,username,comments_count'

  let accountIds: string[]
  if (kind === 'instagram') {
    accountIds = ['me']
  } else {
    const accounts = await getJson<Paged<{ instagram_business_account?: { id: string } }>>(
      withToken(`${base}/me/accounts?fields=instagram_business_account&limit=100`, token),
      signal,
    )
    accountIds = accounts.data.flatMap((p) => (p.instagram_business_account ? [p.instagram_business_account.id] : []))
    if (accountIds.length === 0) {
      throw new Error(
        'Nenhuma conta do Instagram Profissional encontrada nas Páginas deste token. ' +
          'Confira se a conta está ligada a uma Página do Facebook e se o token tem a permissão instagram_basic.',
      )
    }
  }

  let scanned = 0
  for (const accountId of accountIds) {
    for await (const batch of pages<ApiMedia>(`${base}/${accountId}/media?fields=${fields}&limit=100`, token, signal)) {
      const found = batch.find((m) => sameShortcode(m, shortcode))
      if (found) return found
      scanned += batch.length
      onProgress(`Procurando a publicação… ${scanned} posts verificados`)
      if (scanned >= MAX_MEDIA_SCAN) break
    }
  }

  throw new Error(
    `Publicação não encontrada entre os ${scanned} posts da(s) conta(s) deste token. ` +
      'A API só acessa publicações da sua própria conta Profissional. Se for sua, tente colar o ID da mídia.',
  )
}

function toComment(c: ApiComment, isReply: boolean): IgComment {
  return {
    id: c.id,
    username: c.username ?? c.from?.username ?? '',
    text: c.text ?? '',
    timestamp: c.timestamp,
    isReply,
  }
}

export async function fetchUsername(token: string): Promise<string | undefined> {
  const me = await getJson<{ username?: string }>(withToken(`${baseUrl('instagram')}/me?fields=username`, token))
  return me.username
}

export async function fetchPostComments(
  linkOrMediaId: string,
  token: string,
  onProgress: FetchProgress,
  signal?: AbortSignal,
  kind: TokenKind = tokenKind(token),
): Promise<FetchResult> {
  token = token.trim()
  const input = linkOrMediaId.trim()
  if (!token) throw new Error('Entre com o Instagram ou informe um token de acesso.')

  const base = baseUrl(kind)
  let media: ApiMedia
  if (/^\d+$/.test(input)) {
    media = await getJson<ApiMedia>(withToken(`${base}/${input}?fields=id,permalink,username,comments_count`, token), signal)
  } else {
    const shortcode = extractShortcode(input)
    if (!shortcode) throw new Error('Link inválido. Use algo como https://www.instagram.com/p/XXXXXXXX/')
    onProgress('Procurando a publicação…')
    media = await findMedia(token, kind, shortcode, onProgress, signal)
  }

  const commentFields = 'id,text,timestamp,username'
  const url = `${base}/${media.id}/comments?fields=${commentFields},replies.limit(100){${commentFields}}&limit=100`

  const comments: IgComment[] = []
  for await (const batch of pages<ApiComment>(url, token, signal)) {
    for (const c of batch) {
      comments.push(toComment(c, false))
      if (c.replies) {
        c.replies.data.forEach((r) => comments.push(toComment(r, true)))
        // Respostas além da primeira página.
        let next = c.replies.paging?.next
        while (next) {
          const page: Paged<ApiComment> = await getJson<Paged<ApiComment>>(withToken(next, token), signal)
          page.data.forEach((r) => comments.push(toComment(r, true)))
          next = page.paging?.next
        }
      }
    }
    onProgress(`Baixando comentários… ${comments.length}${media.comments_count ? ` de ~${media.comments_count}` : ''}`)
  }

  return {
    comments,
    owner: media.username,
    permalink: media.permalink,
    expectedCount: media.comments_count,
  }
}

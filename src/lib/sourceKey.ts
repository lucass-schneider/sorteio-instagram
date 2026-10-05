import { extractShortcode } from './instagram'

/**
 * Identifica "qual sorteio" está carregado: perfil + publicação.
 * Links diferentes do mesmo post (ex.: com ?igsh=…) dão a mesma chave.
 */
export function sourceKey(label: string, owner?: string): string {
  const post = extractShortcode(label) ?? label.trim()
  return `${(owner ?? '').trim().toLowerCase()}|${post}`
}

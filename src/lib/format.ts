export function formatDate(iso: string | undefined, locale = 'pt-BR'): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })
}

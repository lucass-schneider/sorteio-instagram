import type { IgComment } from './types'

export interface ParseResult {
  comments: IgComment[]
  warnings: string[]
}

const USERNAME_KEYS = ['username', 'usuario', 'user', 'perfil', 'login', 'autor', 'author', 'owner', 'from']
const TEXT_KEYS = ['text', 'comentario', 'comment', 'texto', 'mensagem', 'message', 'content', 'body']
const DATE_KEYS = ['timestamp', 'data', 'date', 'createdat', 'created_at', 'datahora', 'horario', 'hora', 'time']
const REPLY_KEYS = ['isreply', 'resposta', 'reply', 'parentid', 'parent_id']

function normalizeKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
}

function findKey(keys: string[], candidates: string[]): string | undefined {
  const normalized = keys.map((k) => [k, normalizeKey(k)] as const)
  for (const candidate of candidates) {
    const exact = normalized.find(([, n]) => n === candidate)
    if (exact) return exact[0]
  }
  for (const candidate of candidates) {
    const partial = normalized.find(([, n]) => n.includes(candidate))
    if (partial) return partial[0]
  }
  return undefined
}

/** Aceita ISO, "dd/mm/aaaa hh:mm[:ss]" e timestamps Unix (s ou ms). */
export function parseDate(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'number') {
    return new Date(value < 1e12 ? value * 1000 : value).toISOString()
  }
  const text = String(value).trim()
  if (/^\d{10,13}$/.test(text)) return parseDate(Number(text))

  const br = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (br) {
    const [, d, m, y, hh = '0', mm = '0', ss = '0'] = br
    const year = y.length === 2 ? 2000 + Number(y) : Number(y)
    return new Date(year, Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)).toISOString()
  }

  const t = Date.parse(text)
  return Number.isNaN(t) ? undefined : new Date(t).toISOString()
}

function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  const text = String(value ?? '').trim().toLowerCase()
  return text !== '' && !['0', 'false', 'nao', 'não', 'no', 'n'].includes(text)
}

function pickString(value: unknown): string {
  if (value && typeof value === 'object' && 'username' in value) {
    return String((value as { username: unknown }).username ?? '')
  }
  return value === null || value === undefined ? '' : String(value)
}

// ---------- JSON ----------

function fromJsonItem(item: Record<string, unknown>, index: number, isReply: boolean, out: IgComment[]) {
  const keys = Object.keys(item)
  const userKey = findKey(keys, USERNAME_KEYS)
  const textKey = findKey(keys, TEXT_KEYS)
  const dateKey = findKey(keys, DATE_KEYS)
  const replyKey = findKey(keys, REPLY_KEYS)

  const username = userKey ? pickString(item[userKey]).replace(/^@/, '').trim() : ''
  const text = textKey ? pickString(item[textKey]) : ''
  if (username) {
    out.push({
      id: String(item.id ?? `json-${out.length}-${index}`),
      username,
      text,
      timestamp: dateKey ? parseDate(item[dateKey]) : undefined,
      isReply: isReply || (replyKey ? toBool(item[replyKey]) : false),
    })
  }

  // Respostas aninhadas: { replies: [...] } ou { replies: { data: [...] } }
  const replies = item.replies
  const list = Array.isArray(replies)
    ? replies
    : replies && typeof replies === 'object' && Array.isArray((replies as { data?: unknown }).data)
      ? (replies as { data: unknown[] }).data
      : []
  list.forEach((reply, i) => {
    if (reply && typeof reply === 'object') fromJsonItem(reply as Record<string, unknown>, i, true, out)
  })
}

function parseJson(text: string): ParseResult {
  let data: unknown = JSON.parse(text)
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>
    data = obj.comments ?? obj.data ?? obj.items ?? obj.comentarios ?? [obj]
  }
  if (!Array.isArray(data)) throw new Error('JSON precisa ser uma lista de comentários.')

  const comments: IgComment[] = []
  data.forEach((item, i) => {
    if (item && typeof item === 'object') fromJsonItem(item as Record<string, unknown>, i, false, comments)
  })
  const warnings = comments.length < data.length ? [`${data.length - comments.length} item(ns) sem usuário foram ignorados.`] : []
  return { comments, warnings }
}

// ---------- CSV ----------

function detectDelimiter(headerLine: string): string {
  const counts = [';', ',', '\t'].map((d) => [d, headerLine.split(d).length] as const)
  counts.sort((a, b) => b[1] - a[1])
  return counts[0][0]
}

export function parseCsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        quoted = false
      } else {
        field += c
      }
    } else if (c === '"' && field === '') {
      quoted = true
    } else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ''))
}

function looksLikeCsv(firstLine: string): boolean {
  const header = firstLine.split(/[;,\t]/).map(normalizeKey)
  const hasUser = header.some((h) => USERNAME_KEYS.some((k) => h.includes(k)))
  const hasText = header.some((h) => TEXT_KEYS.some((k) => h.includes(k)))
  return hasUser && hasText
}

function parseCsv(text: string): ParseResult {
  const firstLine = text.split(/\r?\n/, 1)[0]
  const rows = parseCsvRows(text, detectDelimiter(firstLine))
  const [header, ...body] = rows
  const userCol = header.indexOf(findKey(header, USERNAME_KEYS) ?? '')
  const textCol = header.indexOf(findKey(header, TEXT_KEYS) ?? '')
  const dateKey = findKey(header, DATE_KEYS)
  const replyKey = findKey(header, REPLY_KEYS)
  const dateCol = dateKey ? header.indexOf(dateKey) : -1
  const replyCol = replyKey ? header.indexOf(replyKey) : -1

  const comments: IgComment[] = []
  let skipped = 0
  body.forEach((row, i) => {
    const username = (row[userCol] ?? '').trim().replace(/^@/, '')
    if (!username) {
      skipped++
      return
    }
    comments.push({
      id: `csv-${i}`,
      username,
      text: row[textCol] ?? '',
      timestamp: dateCol >= 0 ? parseDate(row[dateCol]) : undefined,
      isReply: replyCol >= 0 ? toBool(row[replyCol]) : false,
    })
  })
  const warnings = skipped ? [`${skipped} linha(s) sem usuário foram ignoradas.`] : []
  if (dateCol < 0) warnings.push('Sem coluna de data: o filtro de prazo e a ordem dos comentários não podem ser aplicados.')
  return { comments, warnings }
}

// ---------- Texto simples ----------

const LINE_RE = /^@?([A-Za-z0-9._]{1,30})\s*(?::|\t)\s*(.*)$/

function parseLines(text: string): ParseResult {
  const comments: IgComment[] = []
  const bad: number[] = []
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return
    const match = line.trim().match(LINE_RE)
    if (match) comments.push({ id: `line-${i}`, username: match[1], text: match[2] })
    else bad.push(i + 1)
  })
  const warnings = bad.length
    ? [`${bad.length} linha(s) fora do formato "usuario: comentário" foram ignoradas (linhas ${bad.slice(0, 10).join(', ')}${bad.length > 10 ? '…' : ''}).`]
    : []
  return { comments, warnings }
}

/** Detecta o formato (JSON, CSV com cabeçalho ou "usuario: comentário") e converte. */
export function parseImport(raw: string): ParseResult {
  const text = raw.replace(/^﻿/, '').trim()
  if (!text) return { comments: [], warnings: [] }
  if (text.startsWith('[') || text.startsWith('{')) return parseJson(text)
  if (looksLikeCsv(text.split(/\r?\n/, 1)[0])) return parseCsv(text)
  return parseLines(text)
}

import type { CommentResult, Evaluation, IgComment, ParticipantResult, Rules } from './types'

export const DEFAULT_RULES: Rules = {
  includeReplies: false,
  deadline: '',
  excludedUsers: '',
  minMentions: 0,
  maxMentions: null,
  ignoreSelfMention: true,
  ignoredMentions: '',
  uniqueMentionsAcrossComments: false,
  requiredText: '',
  minComments: 1,
  maxComments: null,
  overLimit: 'disqualify',
  ticketMode: 'perUser',
}

// Usuário do Instagram: letras, números, ponto e underline, até 30 caracteres.
// O lookbehind evita capturar e-mails (fulano@gmail.com).
const MENTION_RE = /(?<![\w.@])@([A-Za-z0-9._]+)/g

export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@/, '').toLowerCase()
}

export function parseUsernameList(value: string): Set<string> {
  return new Set(
    value
      .split(/[\s,;]+/)
      .map(normalizeUsername)
      .filter(Boolean),
  )
}

/** Marcações distintas do texto, na ordem em que aparecem. */
export function extractMentions(text: string): string[] {
  const found = new Set<string>()
  for (const match of text.matchAll(MENTION_RE)) {
    // Ponto final de frase não faz parte do usuário ("valeu @fulano.").
    const username = match[1].replace(/\.+$/, '').toLowerCase()
    if (username && username.length <= 30) found.add(username)
  }
  return [...found]
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

function range(min: number, max: number | null, singular: string, pluralForm: string): string | null {
  if (max !== null && min === max) return `exatamente ${plural(max, singular, pluralForm)}`
  if (max !== null && min > 0) return `de ${min} a ${plural(max, singular, pluralForm)}`
  if (max !== null) return `no máximo ${plural(max, singular, pluralForm)}`
  if (min > 0) return `no mínimo ${plural(min, singular, pluralForm)}`
  return null
}

/** Resumo legível dos critérios ativos (para conferência e para o resultado copiado). */
export function describeRules(rules: Rules): string[] {
  const lines: string[] = []
  const mentions = range(rules.minMentions, rules.maxMentions, 'pessoa marcada', 'pessoas marcadas')
  if (mentions) lines.push(`Cada comentário: ${mentions}`)
  if (rules.uniqueMentionsAcrossComments) lines.push('Não pode repetir a mesma pessoa em comentários diferentes')
  if (rules.requiredText.trim()) lines.push(`Comentário precisa conter "${rules.requiredText.trim()}"`)
  const comments = range(rules.minComments, rules.maxComments, 'comentário válido', 'comentários válidos')
  if (comments) lines.push(`Cada pessoa: ${comments}`)
  if (rules.maxComments !== null) {
    lines.push(
      rules.overLimit === 'disqualify'
        ? `Quem comentar mais de ${rules.maxComments}x é desclassificado`
        : `Quem comentar mais de ${rules.maxComments}x: valem só os primeiros`,
    )
  }
  if (rules.deadline) lines.push(`Comentários até ${new Date(rules.deadline).toLocaleString('pt-BR')}`)
  lines.push(rules.includeReplies ? 'Respostas a comentários contam' : 'Respostas a comentários não contam')
  if (parseUsernameList(rules.excludedUsers).size) {
    lines.push(`Perfis excluídos: ${[...parseUsernameList(rules.excludedUsers)].map((u) => '@' + u).join(', ')}`)
  }
  lines.push(rules.ticketMode === 'perUser' ? 'Uma chance por pessoa' : 'Uma chance por comentário válido')
  return lines
}

function timeOf(comment: IgComment): number {
  const t = comment.timestamp ? Date.parse(comment.timestamp) : NaN
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t
}

export function evaluate(comments: IgComment[], rules: Rules): Evaluation {
  const excluded = parseUsernameList(rules.excludedUsers)
  const ignoredMentions = parseUsernameList(rules.ignoredMentions)
  const deadline = rules.deadline ? new Date(rules.deadline).getTime() : null
  const requiredText = rules.requiredText.trim().toLowerCase()

  const byUser = new Map<string, IgComment[]>()
  for (const comment of comments) {
    const key = normalizeUsername(comment.username) || '(sem usuário)'
    const list = byUser.get(key)
    if (list) list.push(comment)
    else byUser.set(key, [comment])
  }

  const participants: ParticipantResult[] = []

  for (const [username, userComments] of byUser) {
    // Ordem cronológica (sort é estável: sem data, mantém a ordem original).
    const sorted = [...userComments].sort((a, b) => timeOf(a) - timeOf(b))
    const results: CommentResult[] = sorted.map((comment) => ({
      comment,
      valid: false,
      reasons: [],
      mentions: [],
    }))
    const userReasons: string[] = []

    if (excluded.has(username)) userReasons.push('Perfil excluído do sorteio')

    // 1) Filtros que fazem o comentário nem ser considerado.
    const considered: CommentResult[] = []
    for (const r of results) {
      if (r.comment.isReply && !rules.includeReplies) {
        r.reasons.push('Resposta a outro comentário (respostas não contam)')
      } else if (deadline !== null && timeOf(r.comment) > deadline) {
        r.reasons.push(r.comment.timestamp ? 'Feito depois do prazo' : 'Sem data (não dá para checar o prazo)')
      } else {
        considered.push(r)
      }
    }

    // 2) Limite de comentários por pessoa.
    let evaluated = considered
    if (rules.maxComments !== null && considered.length > rules.maxComments) {
      if (rules.overLimit === 'disqualify') {
        userReasons.push(
          `Comentou ${considered.length} vezes (máximo ${rules.maxComments})`,
        )
      } else {
        evaluated = considered.slice(0, rules.maxComments)
        for (const r of considered.slice(rules.maxComments)) {
          r.reasons.push(`Passou do limite de ${plural(rules.maxComments, 'comentário', 'comentários')}`)
        }
      }
    }

    // 3) Regras de cada comentário.
    const usedMentions = new Set<string>()
    for (const r of evaluated) {
      const mentions = extractMentions(r.comment.text).filter(
        (m) => !(rules.ignoreSelfMention && m === username) && !ignoredMentions.has(m),
      )
      r.mentions = mentions

      if (requiredText && !r.comment.text.toLowerCase().includes(requiredText)) {
        r.reasons.push(`Não contém "${rules.requiredText.trim()}"`)
      }
      if (mentions.length < rules.minMentions) {
        r.reasons.push(
          `Marcou ${plural(mentions.length, 'pessoa', 'pessoas')} (mínimo ${rules.minMentions})`,
        )
      }
      if (rules.maxMentions !== null && mentions.length > rules.maxMentions) {
        r.reasons.push(
          `Marcou ${plural(mentions.length, 'pessoa', 'pessoas')} (máximo ${rules.maxMentions})`,
        )
      }
      if (rules.uniqueMentionsAcrossComments) {
        const repeated = mentions.filter((m) => usedMentions.has(m))
        if (repeated.length > 0) {
          r.reasons.push(
            `Repetiu quem já tinha marcado: ${repeated.map((m) => '@' + m).join(', ')}`,
          )
        }
      }

      r.valid = r.reasons.length === 0
      if (r.valid) mentions.forEach((m) => usedMentions.add(m))
    }

    const validCount = results.filter((r) => r.valid).length

    if (userReasons.length === 0) {
      if (validCount === 0) {
        userReasons.push('Nenhum comentário válido')
      } else if (validCount < rules.minComments) {
        userReasons.push(
          `Só ${plural(validCount, 'comentário válido', 'comentários válidos')} (mínimo ${rules.minComments})`,
        )
      }
    }

    const qualified = userReasons.length === 0
    participants.push({
      username,
      qualified,
      reasons: userReasons,
      comments: results,
      validCount,
      tickets: qualified ? (rules.ticketMode === 'perUser' ? 1 : validCount) : 0,
    })
  }

  participants.sort(
    (a, b) => Number(b.qualified) - Number(a.qualified) || a.username.localeCompare(b.username),
  )

  const qualified = participants.filter((p) => p.qualified)
  return {
    participants,
    stats: {
      totalComments: comments.length,
      users: participants.length,
      qualified: qualified.length,
      disqualified: participants.length - qualified.length,
      validComments: qualified.reduce((sum, p) => sum + p.validCount, 0),
      tickets: qualified.reduce((sum, p) => sum + p.tickets, 0),
    },
  }
}

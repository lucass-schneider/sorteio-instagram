export interface IgComment {
  id: string
  username: string
  text: string
  /** ISO 8601. Pode faltar em dados importados manualmente. */
  timestamp?: string
  /** true quando é resposta a outro comentário. */
  isReply?: boolean
}

export type OverLimitAction = 'disqualify' | 'firstN'
export type TicketMode = 'perUser' | 'perComment'

export interface Rules {
  // Filtros gerais
  includeReplies: boolean
  /** Valor de <input type="datetime-local">; vazio = sem prazo. */
  deadline: string
  /** Perfis que não participam (separados por vírgula, espaço ou quebra de linha). */
  excludedUsers: string

  // Por comentário
  minMentions: number
  maxMentions: number | null
  ignoreSelfMention: boolean
  /** Perfis cuja marcação não conta (ex.: o próprio perfil do sorteio). */
  ignoredMentions: string
  uniqueMentionsAcrossComments: boolean
  requiredText: string

  // Por pessoa
  minComments: number
  maxComments: number | null
  overLimit: OverLimitAction

  // Chances
  ticketMode: TicketMode
}

export interface CommentResult {
  comment: IgComment
  valid: boolean
  reasons: string[]
  /** Marcações que contaram (sem repetição, sem o próprio perfil e sem as ignoradas). */
  mentions: string[]
}

export interface ParticipantResult {
  username: string
  qualified: boolean
  reasons: string[]
  comments: CommentResult[]
  validCount: number
  tickets: number
}

export interface Evaluation {
  participants: ParticipantResult[]
  stats: {
    totalComments: number
    users: number
    qualified: number
    disqualified: number
    validComments: number
    tickets: number
  }
}

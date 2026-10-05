/** Textos usados pela lógica (regras, importação e API), em português e inglês. */

export type Lang = 'pt' | 'en'

export const LOCALES: Record<Lang, string> = { pt: 'pt-BR', en: 'en-US' }

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

export interface RuleText {
  noUser: string
  excluded: string
  reply: string
  late: string
  noDate: string
  commentedTooMuch: (n: number, max: number) => string
  overLimit: (max: number) => string
  missingText: (text: string) => string
  tooFewMentions: (n: number, min: number) => string
  tooManyMentions: (n: number, max: number) => string
  repeated: (list: string) => string
  noValid: string
  tooFewComments: (n: number, min: number) => string
  // Resumo dos critérios
  exactly: (n: number, unit: [string, string]) => string
  between: (min: number, max: number, unit: [string, string]) => string
  atMost: (n: number, unit: [string, string]) => string
  atLeast: (n: number, unit: [string, string]) => string
  mentionUnit: [string, string]
  validCommentUnit: [string, string]
  eachComment: (range: string) => string
  noRepeat: string
  mustContain: (text: string) => string
  eachPerson: (range: string) => string
  overDisqualify: (max: number) => string
  overFirstN: (max: number) => string
  until: (date: string) => string
  repliesCount: string
  repliesDontCount: string
  excludedList: (list: string) => string
  perUser: string
  perComment: string
}

export interface ParseText {
  jsonNotList: string
  jsonSkipped: (n: number) => string
  csvSkipped: (n: number) => string
  csvNoDate: string
  linesSkipped: (n: number, lines: string) => string
}

export interface ApiText {
  network: string
  invalidToken: (detail: string) => string
  apiError: (detail: string) => string
  noProfessionalAccount: string
  searching: string
  searchingCount: (n: number) => string
  notFound: (n: number) => string
  noToken: string
  badLink: string
  downloading: (n: number, total?: number) => string
}

export const ruleText: Record<Lang, RuleText> = {
  pt: {
    noUser: '(sem usuário)',
    excluded: 'Perfil excluído do sorteio',
    reply: 'Resposta a outro comentário (respostas não contam)',
    late: 'Feito depois do prazo',
    noDate: 'Sem data (não dá para checar o prazo)',
    commentedTooMuch: (n, max) => `Comentou ${n} vezes (máximo ${max})`,
    overLimit: (max) => `Passou do limite de ${plural(max, 'comentário', 'comentários')}`,
    missingText: (text) => `Não contém "${text}"`,
    tooFewMentions: (n, min) => `Marcou ${plural(n, 'pessoa', 'pessoas')} (mínimo ${min})`,
    tooManyMentions: (n, max) => `Marcou ${plural(n, 'pessoa', 'pessoas')} (máximo ${max})`,
    repeated: (list) => `Repetiu quem já tinha marcado: ${list}`,
    noValid: 'Nenhum comentário válido',
    tooFewComments: (n, min) => `Só ${plural(n, 'comentário válido', 'comentários válidos')} (mínimo ${min})`,
    exactly: (n, [one, many]) => `exatamente ${plural(n, one, many)}`,
    between: (min, max, [one, many]) => `de ${min} a ${plural(max, one, many)}`,
    atMost: (n, [one, many]) => `no máximo ${plural(n, one, many)}`,
    atLeast: (n, [one, many]) => `no mínimo ${plural(n, one, many)}`,
    mentionUnit: ['pessoa marcada', 'pessoas marcadas'],
    validCommentUnit: ['comentário válido', 'comentários válidos'],
    eachComment: (range) => `Cada comentário: ${range}`,
    noRepeat: 'Não pode repetir a mesma pessoa em comentários diferentes',
    mustContain: (text) => `Comentário precisa conter "${text}"`,
    eachPerson: (range) => `Cada pessoa: ${range}`,
    overDisqualify: (max) => `Quem comentar mais de ${max}x é desclassificado`,
    overFirstN: (max) => `Quem comentar mais de ${max}x: valem só os primeiros`,
    until: (date) => `Comentários até ${date}`,
    repliesCount: 'Respostas a comentários contam',
    repliesDontCount: 'Respostas a comentários não contam',
    excludedList: (list) => `Perfis excluídos: ${list}`,
    perUser: 'Uma chance por pessoa',
    perComment: 'Uma chance por comentário válido',
  },
  en: {
    noUser: '(no username)',
    excluded: 'Profile excluded from the giveaway',
    reply: 'Reply to another comment (replies do not count)',
    late: 'Posted after the deadline',
    noDate: 'No date (deadline cannot be checked)',
    commentedTooMuch: (n, max) => `Commented ${n} times (maximum ${max})`,
    overLimit: (max) => `Over the limit of ${plural(max, 'comment', 'comments')}`,
    missingText: (text) => `Does not contain "${text}"`,
    tooFewMentions: (n, min) => `Tagged ${plural(n, 'person', 'people')} (minimum ${min})`,
    tooManyMentions: (n, max) => `Tagged ${plural(n, 'person', 'people')} (maximum ${max})`,
    repeated: (list) => `Repeated someone already tagged: ${list}`,
    noValid: 'No valid comment',
    tooFewComments: (n, min) => `Only ${plural(n, 'valid comment', 'valid comments')} (minimum ${min})`,
    exactly: (n, [one, many]) => `exactly ${plural(n, one, many)}`,
    between: (min, max, [one, many]) => `${min} to ${plural(max, one, many)}`,
    atMost: (n, [one, many]) => `at most ${plural(n, one, many)}`,
    atLeast: (n, [one, many]) => `at least ${plural(n, one, many)}`,
    mentionUnit: ['tagged person', 'tagged people'],
    validCommentUnit: ['valid comment', 'valid comments'],
    eachComment: (range) => `Each comment: ${range}`,
    noRepeat: 'The same person cannot be tagged in different comments',
    mustContain: (text) => `Comment must contain "${text}"`,
    eachPerson: (range) => `Each person: ${range}`,
    overDisqualify: (max) => `Commenting more than ${max}x disqualifies`,
    overFirstN: (max) => `Commenting more than ${max}x: only the first ones count`,
    until: (date) => `Comments until ${date}`,
    repliesCount: 'Replies to comments count',
    repliesDontCount: 'Replies to comments do not count',
    excludedList: (list) => `Excluded profiles: ${list}`,
    perUser: 'One entry per person',
    perComment: 'One entry per valid comment',
  },
}

export const parseText: Record<Lang, ParseText> = {
  pt: {
    jsonNotList: 'JSON precisa ser uma lista de comentários.',
    jsonSkipped: (n) => `${n} item(ns) sem usuário foram ignorados.`,
    csvSkipped: (n) => `${n} linha(s) sem usuário foram ignoradas.`,
    csvNoDate: 'Sem coluna de data: o filtro de prazo e a ordem dos comentários não podem ser aplicados.',
    linesSkipped: (n, lines) => `${n} linha(s) fora do formato "usuario: comentário" foram ignoradas (linhas ${lines}).`,
  },
  en: {
    jsonNotList: 'JSON must be a list of comments.',
    jsonSkipped: (n) => `${n} item(s) without a username were skipped.`,
    csvSkipped: (n) => `${n} row(s) without a username were skipped.`,
    csvNoDate: 'No date column: the deadline filter and comment order cannot be applied.',
    linesSkipped: (n, lines) => `${n} line(s) not in the "username: comment" format were skipped (lines ${lines}).`,
  },
}

export const apiText: Record<Lang, ApiText> = {
  pt: {
    network: 'Falha de rede ao acessar a API da Meta. Verifique sua conexão.',
    invalidToken: (detail) => `Token inválido ou expirado. (${detail})`,
    apiError: (detail) => `API do Instagram: ${detail}`,
    noProfessionalAccount:
      'Nenhuma conta do Instagram Profissional encontrada nas Páginas deste token. ' +
      'Confira se a conta está ligada a uma Página do Facebook e se o token tem a permissão instagram_basic.',
    searching: 'Procurando a publicação…',
    searchingCount: (n) => `Procurando a publicação… ${n} posts verificados`,
    notFound: (n) =>
      `Publicação não encontrada entre os ${n} posts da(s) conta(s) deste token. ` +
      'A API só acessa publicações da sua própria conta Profissional. Se for sua, tente colar o ID da mídia.',
    noToken: 'Entre com o Instagram ou informe um token de acesso.',
    badLink: 'Link inválido. Use algo como https://www.instagram.com/p/XXXXXXXX/',
    downloading: (n, total) => `Baixando comentários… ${n}${total ? ` de ~${total}` : ''}`,
  },
  en: {
    network: 'Network error while reaching the Meta API. Check your connection.',
    invalidToken: (detail) => `Invalid or expired token. (${detail})`,
    apiError: (detail) => `Instagram API: ${detail}`,
    noProfessionalAccount:
      'No Instagram professional account found in the Pages of this token. ' +
      'Make sure the account is linked to a Facebook Page and the token has the instagram_basic permission.',
    searching: 'Looking for the post…',
    searchingCount: (n) => `Looking for the post… ${n} posts checked`,
    notFound: (n) =>
      `Post not found among the ${n} posts of this token's account(s). ` +
      'The API only reaches posts from your own professional account. If it is yours, try pasting the media ID.',
    noToken: 'Log in with Instagram or enter an access token.',
    badLink: 'Invalid link. Use something like https://www.instagram.com/p/XXXXXXXX/',
    downloading: (n, total) => `Downloading comments… ${n}${total ? ` of ~${total}` : ''}`,
  },
}

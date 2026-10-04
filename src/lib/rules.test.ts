import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES, evaluate, extractMentions } from './rules'
import type { IgComment, Rules } from './types'

let seq = 0
function c(username: string, text: string, minute = seq, extra: Partial<IgComment> = {}): IgComment {
  seq++
  return {
    id: String(seq),
    username,
    text,
    timestamp: new Date(Date.UTC(2026, 0, 1, 12, minute)).toISOString(),
    ...extra,
  }
}

function run(comments: IgComment[], rules: Partial<Rules>) {
  const result = evaluate(comments, { ...DEFAULT_RULES, ...rules })
  return Object.fromEntries(result.participants.map((p) => [p.username, p]))
}

describe('extractMentions', () => {
  it('pega marcações distintas, ignora e-mail e ponto final', () => {
    expect(extractMentions('oi @Ana e @ana, fala @bia.lima. mail: x@gmail.com')).toEqual(['ana', 'bia.lima'])
  })
})

describe('evaluate', () => {
  it('exige exatamente 2 marcações por comentário', () => {
    const p = run(
      [c('a', '@x @y'), c('b', '@x'), c('c', '@x @y @z'), c('d', '@x @x @y')],
      { minMentions: 2, maxMentions: 2 },
    )
    expect(p.a.qualified).toBe(true)
    expect(p.b.qualified).toBe(false)
    expect(p.c.qualified).toBe(false)
    expect(p.d.qualified).toBe(true) // @x repetido no mesmo comentário conta uma vez
  })

  it('não conta a própria marcação nem perfis ignorados', () => {
    const p = run([c('a', '@a @x'), c('b', '@loja @x')], {
      minMentions: 2,
      ignoredMentions: '@loja',
    })
    expect(p.a.qualified).toBe(false)
    expect(p.b.qualified).toBe(false)
  })

  it('desclassifica quem comentou mais que o máximo', () => {
    const p = run([c('a', '1', 1), c('a', '2', 2), c('a', '3', 3), c('b', '1'), c('b', '2')], {
      maxComments: 2,
    })
    expect(p.a.qualified).toBe(false)
    expect(p.a.reasons[0]).toContain('Comentou 3 vezes')
    expect(p.b.qualified).toBe(true)
  })

  it('no modo "primeiros N" considera só os primeiros comentários', () => {
    const p = run([c('a', '@x @y', 3), c('a', 'sem marcação', 1), c('a', '@z @w', 2)], {
      maxComments: 2,
      overLimit: 'firstN',
      minMentions: 2,
      ticketMode: 'perComment',
    })
    // Em ordem cronológica: "sem marcação" (inválido), "@z @w" (válido), "@x @y" (fora do limite)
    expect(p.a.qualified).toBe(true)
    expect(p.a.tickets).toBe(1)
    expect(p.a.comments[2].reasons[0]).toContain('limite')
  })

  it('exige quantidade mínima de comentários válidos', () => {
    const p = run([c('a', '@x @y'), c('a', '@z'), c('b', '@x @y'), c('b', '@z @w')], {
      minMentions: 2,
      minComments: 2,
      maxComments: 2,
    })
    expect(p.a.qualified).toBe(false)
    expect(p.b.qualified).toBe(true)
  })

  it('bloqueia repetir pessoas entre comentários', () => {
    const p = run([c('a', '@x @y', 1), c('a', '@x @z', 2)], {
      uniqueMentionsAcrossComments: true,
      ticketMode: 'perComment',
    })
    expect(p.a.tickets).toBe(1)
    expect(p.a.comments[1].reasons[0]).toContain('@x')
  })

  it('aplica prazo, respostas, texto obrigatório e exclusões', () => {
    const p = run(
      [
        c('a', '#eu quero', 10),
        c('b', '#euquero', 50),
        c('c', '#euquero', 10, { isReply: true }),
        c('d', 'sem hashtag', 10),
        c('loja', '#euquero', 10),
      ],
      {
        deadline: new Date(Date.UTC(2026, 0, 1, 12, 30)).toISOString(),
        requiredText: '#EuQuero',
        excludedUsers: 'loja',
      },
    )
    expect(p.a.qualified).toBe(false)
    expect(p.b.qualified).toBe(false)
    expect(p.c.qualified).toBe(false)
    expect(p.d.qualified).toBe(false)
    expect(p.loja.qualified).toBe(false)
  })

  it('dá um bilhete por comentário válido quando configurado', () => {
    const result = evaluate([c('a', 'x'), c('a', 'y'), c('b', 'z')], { ...DEFAULT_RULES, ticketMode: 'perComment' })
    expect(result.stats.tickets).toBe(3)
  })
})

import { describe, expect, it } from 'vitest'
import { parseImport } from './parse'
import { drawWinners } from './random'
import { extractShortcode } from './instagram'
import { sourceKey } from './sourceKey'

describe('parseImport', () => {
  it('lê JSON com respostas aninhadas', () => {
    const { comments } = parseImport(
      JSON.stringify([
        { id: '1', username: 'ana', text: '@x @y', timestamp: '2026-01-01T10:00:00Z', replies: { data: [{ id: '2', username: 'loja', text: 'valeu' }] } },
        { owner: { username: 'bia' }, comment: 'oi' },
      ]),
    )
    expect(comments.map((c) => [c.username, c.isReply])).toEqual([
      ['ana', false],
      ['loja', true],
      ['bia', false],
    ])
  })

  it('lê CSV com ponto e vírgula, aspas e data brasileira', () => {
    const csv = 'Usuário;Comentário;Data\n@ana;"Oi; @x ""top""";01/02/2026 10:30\nbia;@y;'
    const { comments } = parseImport(csv)
    expect(comments).toHaveLength(2)
    expect(comments[0]).toMatchObject({ username: 'ana', text: 'Oi; @x "top"' })
    expect(new Date(comments[0].timestamp!).getMonth()).toBe(1)
  })

  it('lê linhas "usuario: comentário"', () => {
    const { comments, warnings } = parseImport('ana: @x @y\n@bia: @z\nlinha quebrada')
    expect(comments.map((c) => c.username)).toEqual(['ana', 'bia'])
    expect(warnings).toHaveLength(1)
  })
})

describe('extractShortcode', () => {
  it('aceita post, reel e link com usuário', () => {
    expect(extractShortcode('https://www.instagram.com/p/C1a2B3c4D5e/?igsh=abc')).toBe('C1a2B3c4D5e')
    expect(extractShortcode('https://instagram.com/reel/XyZ_-123/')).toBe('XyZ_-123')
    expect(extractShortcode('https://www.instagram.com/loja/p/AbC123/')).toBe('AbC123')
    expect(extractShortcode('https://google.com')).toBeNull()
  })
})

describe('drawWinners', () => {
  it('não repete ganhadores e ignora quem tem 0 bilhetes', () => {
    const entries = [
      { username: 'a', tickets: 1 },
      { username: 'b', tickets: 3 },
      { username: 'c', tickets: 0 },
    ]
    for (let i = 0; i < 50; i++) {
      const winners = drawWinners(entries, 5)
      expect(winners.sort()).toEqual(['a', 'b'])
    }
  })
})

describe('sourceKey', () => {
  it('mesmo post com links diferentes dá a mesma chave; outro post ou perfil muda', () => {
    const a = sourceKey('https://www.instagram.com/p/ABC123/', 'Loja')
    expect(sourceKey('https://instagram.com/p/ABC123/?igsh=xyz', 'loja')).toBe(a)
    expect(sourceKey('https://www.instagram.com/p/OUTRO1/', 'loja')).not.toBe(a)
    expect(sourceKey('https://www.instagram.com/p/ABC123/', 'outra')).not.toBe(a)
  })
})

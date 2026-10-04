import type { IgComment } from './types'

const raw: Array<[string, string, number, boolean?]> = [
  // [usuário, texto, minutos após a publicação, é resposta?]
  ['ana.souza', 'Quero muito! @carla_m @bia.lima', 3],
  ['bruno_r', 'Participando @joaopedro @lucas.f', 5],
  ['bruno_r', 'De novo! @marina.s @tati_oliveira', 9],
  ['carla_m', '@ana.souza @renata', 12],
  ['diego.alves', 'Eu!! @felipe @gabi', 15],
  ['diego.alves', 'Mais uma @felipe @rafa', 18],
  ['diego.alves', 'Última @nanda @leo', 20],
  ['eduarda', 'Que lindo 😍 @mari', 22],
  ['fernanda.c', '@lojaexemplo @paulo @julia', 25],
  ['gustavo', 'Boa sorte a todos', 31],
  ['helena.m', '@clara @davi.s', 33],
  ['helena.m', '@clara @davi.s', 34],
  ['igor_lima', '@helena.m @carla_m', 40],
  ['juliana', 'Amei!! @pedro.h @luiza @mateus', 42],
  ['karina', '@karina @beto', 44],
  ['leo.santos', 'Participando! @nina @otavio', 50],
  ['lojaexemplo', 'Obrigado por participar, @ana.souza! Boa sorte', 52, true],
  ['marcos', 'Contato: marcos@gmail.com @vini', 55],
  ['natalia.r', '@sofia @isa', 60],
  ['natalia.r', '@duda @lari', 61],
  ['otavio', '@leo.santos @nina', 65],
  ['paula_f', 'Eu quero!!! @rodrigo @samuel', 70],
  ['rafael', '@tiago @vitor', 72],
  ['rafael', '@tiago @wesley', 75],
  ['sabrina', 'Muito bom @yasmin @zeca', 80],
  ['tiago', '@rafael @ana.souza.', 85],
  ['vanessa', 'Já sigo! @lucas @marcela', 90],
  ['vanessa', '@lucas @marcela', 95, true],
]

export function demoComments(): IgComment[] {
  const start = new Date()
  start.setDate(start.getDate() - 3)
  start.setHours(18, 0, 0, 0)
  return raw.map(([username, text, minutes, isReply], i) => ({
    id: `demo-${i}`,
    username,
    text,
    timestamp: new Date(start.getTime() + minutes * 60_000).toISOString(),
    isReply: isReply ?? false,
  }))
}

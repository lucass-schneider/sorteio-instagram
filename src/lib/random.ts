/** Inteiro uniforme em [0, max) usando o gerador criptográfico do navegador. */
export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) {
    throw new RangeError(`max inválido: ${max}`)
  }
  // Rejeição para evitar viés de módulo.
  const limit = 2 ** 32 - (2 ** 32 % max)
  const buffer = new Uint32Array(1)
  let value: number
  do {
    crypto.getRandomValues(buffer)
    value = buffer[0]
  } while (value >= limit)
  return value % max
}

export interface Entry {
  username: string
  tickets: number
}

/**
 * Sorteia `count` pessoas sem repetição. Cada pessoa tem chance proporcional
 * ao número de bilhetes; quem é sorteado sai do pote.
 */
export function drawWinners(entries: Entry[], count: number): string[] {
  const pool = entries.filter((e) => e.tickets > 0).map((e) => ({ ...e }))
  const winners: string[] = []

  while (winners.length < count && pool.length > 0) {
    const total = pool.reduce((sum, e) => sum + e.tickets, 0)
    let ticket = secureRandomInt(total)
    const index = pool.findIndex((e) => (ticket -= e.tickets) < 0)
    winners.push(pool[index].username)
    pool.splice(index, 1)
  }

  return winners
}

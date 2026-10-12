// Subscribers rodam de forma assíncrona: espera a asserção passar (ou estoura o tempo)
export async function waitFor(assertion: () => void, timeoutMs = 1000) {
  const start = Date.now()

  for (;;) {
    try {
      assertion()
      return
    } catch (error) {
      if (Date.now() - start > timeoutMs) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
}

// Utilitários de data/hora configurados estritamente para o Horário de Brasília (BRT / America/Sao_Paulo)

export const BRASILIA_TIMEZONE = 'America/Sao_Paulo'

/**
 * Retorna a data atual no formato YYYY-MM-DD no Horário de Brasília.
 * Evita o bug comum de virar o dia antes das 21h devido ao UTC.
 */
export function getBrasiliaTodayStr(): string {
  const now = new Date()
  const year = now.toLocaleDateString('en-CA', { timeZone: BRASILIA_TIMEZONE, year: 'numeric' })
  const month = now.toLocaleDateString('en-CA', { timeZone: BRASILIA_TIMEZONE, month: '2-digit' })
  const day = now.toLocaleDateString('en-CA', { timeZone: BRASILIA_TIMEZONE, day: '2-digit' })
  return `${year}-${month}-${day}`
}

/**
 * Formata um horário para HH:mm no Horário de Brasília.
 */
export function formatBrasiliaTime(dateInput: string | Date): string {
  const d = new Date(dateInput)
  return d.toLocaleTimeString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Formata data completa (ex: 23 de Julho de 2026) no Horário de Brasília.
 */
export function formatBrasiliaDate(
  dateInput: string | Date,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
): string {
  const d = new Date(dateInput)
  return d.toLocaleDateString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    ...options,
  })
}

/**
 * Retorna os próximos N dias calculados no Horário de Brasília.
 */
export function getBrasiliaNextDays(count: number = 14) {
  const todayStr = getBrasiliaTodayStr()
  const [year, month, day] = todayStr.split('-').map(Number)

  return Array.from({ length: count }).map((_, i) => {
    const d = new Date(year, month - 1, day + i, 12, 0, 0)
    const isoDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    return {
      iso: isoDateStr,
      dayName: d.toLocaleDateString('pt-BR', { timeZone: BRASILIA_TIMEZONE, weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('pt-BR', { timeZone: BRASILIA_TIMEZONE, month: 'short' }),
    }
  })
}

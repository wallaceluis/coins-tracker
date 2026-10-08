/**
 * Pregão regular da B3: segunda a sexta, 10h às 18h (horário de Brasília),
 * com folga até 18h30 para o leilão de fechamento. Feriados não são tratados:
 * nesses dias a cotação só não muda, o que é inofensivo.
 */
export function isB3Open(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const weekday = get('weekday')
  if (weekday === 'Sat' || weekday === 'Sun') return false
  const minutes = Number(get('hour')) * 60 + Number(get('minute'))
  return minutes >= 10 * 60 && minutes <= 18 * 60 + 30
}

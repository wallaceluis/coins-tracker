export type Condition = 'above' | 'below'

/** Quanto o preço precisa voltar além do alvo para o alerta rearmar (0,5%). */
export const REARM_MARGIN = 0.005

export type Decision = 'notify' | 'rearm' | 'none'

/**
 * Decide o que fazer com um alerta dado o preço atual.
 * - Dispara uma vez quando o preço cruza o alvo.
 * - Só rearma quando o preço volta para o outro lado com uma folga de 0,5%,
 *   para não mandar um e-mail a cada oscilação em torno do alvo.
 */
export function evaluate(
  alert: { condition: Condition; target: number; triggered: boolean },
  price: number,
): Decision {
  const { condition, target, triggered } = alert
  const hit = condition === 'above' ? price >= target : price <= target

  if (!triggered) return hit ? 'notify' : 'none'

  const backAcross =
    condition === 'above' ? price < target * (1 - REARM_MARGIN) : price > target * (1 + REARM_MARGIN)
  return backAcross ? 'rearm' : 'none'
}

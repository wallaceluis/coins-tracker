/** Quanto de cripto se compra com `fiat` ao preço unitário `price`. */
export function fiatToCrypto(fiat: number, price: number) {
  if (!Number.isFinite(fiat) || !Number.isFinite(price) || price <= 0 || fiat < 0) return 0
  return fiat / price
}

/** Quanto vale `amount` unidades de cripto ao preço unitário `price`. */
export function cryptoToFiat(amount: number, price: number) {
  if (!Number.isFinite(amount) || !Number.isFinite(price) || price < 0 || amount < 0) return 0
  return amount * price
}

export const formatCurrency = (value: number | string, currency: string) => {
    if (!value) return '---'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value))
}

export const formatCompact = (value: number | string, currency: string = 'USD') => {
    if (!value) return '---'
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : undefined, {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        maximumFractionDigits: 2
    }).format(Number(value))
}

export const formatPercent = (value: number | string) => {
    if (!value) return '0.00%'
    const n = Number(value)
    return `${n.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'never'
    })}%`
}

export const formatFiat = (value: number, currency: string) => {
    return value.toLocaleString(undefined, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}

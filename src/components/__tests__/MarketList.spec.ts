import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import i18n from '@/i18n'
import MarketList from '../MarketList.vue'
import { COINS } from '@/test/fixtures'

const mountList = (selectedId = 'bitcoin') =>
  mount(MarketList, {
    props: { coins: COINS, currency: 'BRL', loading: false, selectedId },
    global: { plugins: [i18n] },
  })

describe('MarketList', () => {
  it('renders one row per coin and marks the selected one', () => {
    const wrapper = mountList('ethereum')
    const rows = wrapper.findAll('[role="option"]')
    expect(rows).toHaveLength(3)
    expect(rows[1]!.attributes('aria-selected')).toBe('true')
  })

  it('filters by name or symbol', async () => {
    const wrapper = mountList()
    await wrapper.find('input[type="search"]').setValue('SOL')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Solana')
  })

  it('emits the new selection on click', async () => {
    const wrapper = mountList()
    await wrapper.findAll('[role="option"]')[2]!.trigger('click')
    expect(wrapper.emitted('update:selectedId')?.[0]).toEqual(['solana'])
  })
})

'use client'

import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { CURRENT_PICKUP_DATE, emptyDraft } from '@/lib/order'
import type { CustomerDetails, OrderDraft, OrderReceipt, Packaging, PaymentMethod } from '@/lib/types'

export const STORAGE_KEY = 'dough-not-disturb.order.v1'
export type OrderAction =
  | { type: 'quantity'; productId: string; quantity: number }
  | { type: 'packaging'; packaging: Packaging }
  | { type: 'message'; message: string }
  | { type: 'customer'; field: keyof CustomerDetails; value: string }
  | { type: 'pickup'; date: string; time: string; windowId: string }
  | { type: 'payment'; method: PaymentMethod }
type State = { draft: OrderDraft; receipt: OrderReceipt | null; hydrated: boolean }
type InternalAction = OrderAction
  | { type: 'restore'; draft: OrderDraft; receipt: OrderReceipt | null }
  | { type: 'complete'; receipt: OrderReceipt }
  | { type: 'reset' }

export function orderReducer(state: State, action: InternalAction): State {
  if (action.type === 'restore') return { draft: action.draft, receipt: action.receipt, hydrated: true }
  if (action.type === 'complete') return { draft: emptyDraft(), receipt: action.receipt, hydrated: true }
  if (action.type === 'reset') return { draft: emptyDraft(), receipt: null, hydrated: true }
  let draft = state.draft
  switch (action.type) {
    case 'quantity': {
      if (!Number.isSafeInteger(action.quantity) || action.quantity < 0 || action.quantity > 2147483647) return state
      const items = draft.items.filter(item => item.product_id !== action.productId)
      if (action.quantity > 0) items.push({ product_id: action.productId, quantity: action.quantity })
      draft = { ...draft, items }
      break
    }
    case 'packaging': draft = { ...draft, packaging: action.packaging }; break
    case 'message': draft = { ...draft, card_message: action.message }; break
    case 'customer': draft = { ...draft, customer: { ...draft.customer, [action.field]: action.value } }; break
    case 'pickup': draft = { ...draft, pickup_date: action.date, pickup_time: action.time, pickup_window_id: action.windowId }; break
    case 'payment': draft = { ...draft, payment_method: action.method }; break
  }
  return { ...state, receipt: null, draft: { ...draft, request_id: crypto.randomUUID() } }
}

export function restoreDraft(value: unknown): OrderDraft {
  const base = emptyDraft()
  if (!value || typeof value !== 'object') return base
  const stored = value as Partial<OrderDraft>
  if (Array.isArray(stored.items)) base.items = stored.items.filter(item => item && typeof item.product_id === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.quantity <= 2147483647)
  if (stored.packaging === 'card') base.packaging = 'card'
  for (const key of ['card_message', 'request_id'] as const) {
    if (typeof stored[key] === 'string') base[key] = stored[key]
  }
  if (stored.pickup_date === CURRENT_PICKUP_DATE) {
    if (typeof stored.pickup_time === 'string') base.pickup_time = stored.pickup_time
    if (typeof stored.pickup_window_id === 'string') base.pickup_window_id = stored.pickup_window_id
  }
  if (stored.payment_method === 'zelle') base.payment_method = 'zelle'
  for (const key of Object.keys(base.customer) as (keyof CustomerDetails)[]) {
    if (typeof stored.customer?.[key] === 'string') base.customer[key] = stored.customer[key]
  }
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(base.request_id)) base.request_id = crypto.randomUUID()
  return base
}

type OrderContextValue = State & { dispatch: (action: OrderAction) => void; completeOrder: (receipt: OrderReceipt) => void; startNewOrder: () => void }
const OrderContext = createContext<OrderContextValue | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, { draft: emptyDraft(), receipt: null, hydrated: false })
  useEffect(() => {
    let draft = emptyDraft()
    let receipt: OrderReceipt | null = null
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
      if (stored?.version === 1) {
        draft = restoreDraft(stored.draft)
        if (stored.receipt?.status === 'awaiting_payment' && typeof stored.receipt.order_number === 'string' && Array.isArray(stored.receipt.items) && Number.isSafeInteger(stored.receipt.total_cents)) receipt = stored.receipt
      }
    } catch { /* An unavailable or corrupt store must never prevent ordering. */ }
    dispatch({ type: 'restore', draft, receipt })
  }, [])
  useEffect(() => {
    if (!state.hydrated) return
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, draft: state.draft, receipt: state.receipt })) } catch { /* Keep the current tab usable if storage is blocked. */ }
  }, [state])
  return <OrderContext.Provider value={{ ...state, dispatch, completeOrder: receipt => dispatch({ type: 'complete', receipt }), startNewOrder: () => dispatch({ type: 'reset' }) }}>{children}</OrderContext.Provider>
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (!context) throw new Error('useOrder must be used inside OrderProvider')
  return context
}

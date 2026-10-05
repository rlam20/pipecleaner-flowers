'use client'

import type { ReactNode } from 'react'
import { Cookie, Gift } from 'lucide-react'
import type { CookieProduct } from '@/lib/types'
import { money, orderLines, orderTotal, totalQuantity } from '@/lib/order'
import { useOrder } from './OrderProvider'

export default function OrderSummary({ products, compact = false, children }: { products: CookieProduct[]; compact?: boolean; children?: ReactNode }) {
  const { draft, dispatch } = useOrder()
  const lines = orderLines(draft.items, products)
  const count = totalQuantity(draft.items)
  const subtotal = lines.reduce((sum, line) => sum + line.line_total_cents, 0)
  const total = orderTotal(lines)

  return (
    <section className={`order-summary panel${compact ? ' summary-compact' : ''}`} aria-label="Order summary">
      <div className="summary-heading"><h3>Your little box of joy</h3><span className="summary-count">{count}</span></div>
      {lines.length === 0 ? (
        <div className="empty-bag">
          <span className="empty-bag-icon"><Cookie size={35} strokeWidth={1.1} aria-hidden="true" /></span>
          <p>Good things go in here.</p>
          <span>Pick a cookie (or a few) to get started.</span>
        </div>
      ) : (
        <>
          <p className="order-category">{count <= 6 ? 'Snack Pick Up' : 'Party Pack'} <span>· {count} {count === 1 ? 'cookie' : 'cookies'}</span></p>
          <ul className="summary-lines">
            {lines.map(line => (
              <li key={line.product_id}>
                <div className="summary-line-main"><span>{line.name} <span className="summary-line-quantity">× {line.quantity}</span></span><span>{money(line.line_total_cents)}</span></div>
                {!compact && <button type="button" className="text-button remove-button" onClick={() => dispatch({ type: 'quantity', productId: line.product_id, quantity: 0 })} aria-label={`Remove ${line.name}`}>Remove</button>}
              </li>
            ))}
          </ul>
          <div className="summary-packaging"><span><Gift size={16} strokeWidth={1.4} aria-hidden="true" />{draft.packaging === 'card' ? 'Card with Note' : 'Standard packaging'}</span><span>Included</span></div>
          {total < subtotal && <div className="summary-packaging"><span>{count === 3 ? 'Trio deal' : '5-cookie deal'}</span><span>−{money(subtotal - total)}</span></div>}
          {draft.packaging === 'card' && draft.card_message.trim() && <p className="summary-note">“{draft.card_message}”</p>}
        </>
      )}
      <div className="summary-total" aria-live="polite" aria-atomic="true"><span>Total</span><strong>{money(total)}</strong></div>
      {children}
      <p className="summary-footnote">A little planning, a lovely pickup.<br />Choose your date at checkout.</p>
    </section>
  )
}

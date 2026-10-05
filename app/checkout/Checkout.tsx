'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, CreditCard, Gift, MapPin, PartyPopper } from 'lucide-react'
import { createCookieOrder } from '@/lib/actions/orders'
import { CURRENT_PICKUP_DATE, FUNDRAISER_MODE, formatDate, formatTime, money, orderLines, orderTotal, pickupSlots, totalQuantity, validateDraft } from '@/lib/order'
import type { CreateCookieOrderInput, StorefrontData } from '@/lib/types'
import { useOrder } from '@/app/components/OrderProvider'
import OrderSummary from '@/app/components/OrderSummary'
import SiteFooter from '@/app/components/SiteFooter'
import SiteHeader from '@/app/components/SiteHeader'

const fieldId = (name: string) => `checkout-${name}`

export default function Checkout({ initialData }: { initialData: StorefrontData }) {
  const { draft, receipt, hydrated, dispatch, completeOrder, startNewOrder } = useOrder()
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState('')
  const [isPending, startTransition] = useTransition()
  const slots = useMemo(() => pickupSlots(draft.pickup_date, data.windows), [draft.pickup_date, data.windows])
  const selectedWindow = data.windows.find(window => window.id === draft.pickup_window_id)
  const count = totalQuantity(draft.items)
  const lines = orderLines(draft.items, data.products)
  const total = orderTotal(lines)
  const paymentRecipient = draft.payment_method === 'venmo' ? data.settings.venmo_handle : data.settings.zelle_recipient

  const setCustomer = (field: keyof typeof draft.customer, value: string) => {
    dispatch({ type: 'customer', field, value })
    setErrors(current => ({ ...current, [field]: '' }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const validation = validateDraft(draft, data)
    setErrors(validation)
    setNotice('')
    if (Object.keys(validation).length || !selectedWindow || !paymentRecipient) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"], .error-message')?.focus())
      return
    }
    const input: CreateCookieOrderInput = {
      ...draft,
      request_id: draft.request_id || crypto.randomUUID(),
      expected_prices: lines.map(line => ({ product_id: line.product_id, unit_price_cents: line.unit_price_cents })),
      expected_pickup: {
        time_zone: data.settings.time_zone,
        pickup_location: data.settings.pickup_location,
        start_time: selectedWindow.start_time.slice(0, 5),
        end_time: selectedWindow.end_time.slice(0, 5),
        slot_minutes: selectedWindow.slot_minutes,
      },
      expected_payment_recipient: paymentRecipient,
    }
    startTransition(async () => {
      const result = await createCookieOrder(input)
      if (result.success) {
        completeOrder(result.receipt)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      if (result.storefront) setData(result.storefront)
      setNotice(result.code === 'changed'
        ? 'The menu or pickup details changed while you were checking out. We refreshed them below—please review and submit again.'
        : result.error)
    })
  }

  if (!hydrated) return <div className="checkout-loading" role="status">Opening your cookie bag…</div>
  if (receipt) return <Confirmation receipt={receipt} instagramUrl={data.settings.instagram_url} onRestart={() => { startNewOrder(); window.location.href = '/#order' }} />
  if (!draft.items.length) {
    return <div className="checkout-page"><SiteHeader checkout /><main id="main-content" className="empty-checkout page-shell"><span className="confirmation-icon"><Gift /></span><p className="eyebrow">Your bag is waiting</p><h1>Start with a cookie.</h1><p>Pick your favorites, then come back here to choose a pickup time.</p><Link className="button" href="/#order">Meet the cookies <ArrowRight size={17} /></Link></main><SiteFooter instagramUrl={data.settings.instagram_url} /></div>
  }

  return (
    <div className="checkout-page">
      <SiteHeader checkout />
      <main id="main-content" className="checkout-main page-shell">
        <div className="checkout-intro"><p className="eyebrow">The sweet final step</p><h1>Let&apos;s make this<br /><em>cookie break official.</em></h1><p>Your selections are saved in this tab. Take your time—we&apos;ll confirm the total and pickup details when you place the order.</p></div>
        {!data.available && <div className="checkout-notice error-message" tabIndex={-1}>Ordering is temporarily unavailable. Your bag is still saved.</div>}
        {notice && <div className="checkout-notice error-message" tabIndex={-1}>{notice}</div>}
        <form className="checkout-grid" onSubmit={submit} noValidate>
          <div className="checkout-form-stack">
            <section className="checkout-section panel" aria-labelledby="contact-heading">
              <SectionHeading number="01" eyebrow="Just the essentials" id="contact-heading">Who&apos;s picking up?</SectionHeading>
              <div className="checkout-fields two-columns">
                <Field label="First name" name="first_name" required error={errors.first_name}><input className="input" id={fieldId('first_name')} autoComplete="given-name" value={draft.customer.first_name} onChange={e => setCustomer('first_name', e.target.value)} aria-invalid={Boolean(errors.first_name)} /></Field>
                <Field label="Last name" name="last_name" required error={errors.last_name}><input className="input" id={fieldId('last_name')} autoComplete="family-name" value={draft.customer.last_name} onChange={e => setCustomer('last_name', e.target.value)} aria-invalid={Boolean(errors.last_name)} /></Field>
                <Field label="Phone" name="phone" required error={errors.phone}><input className="input" id={fieldId('phone')} type="tel" autoComplete="tel" value={draft.customer.phone} onChange={e => setCustomer('phone', e.target.value)} aria-invalid={Boolean(errors.phone)} placeholder="(555) 123-4567" /></Field>
                <Field label="Email" name="email" optional error={errors.email}><input className="input" id={fieldId('email')} type="email" autoComplete="email" value={draft.customer.email} onChange={e => setCustomer('email', e.target.value)} aria-invalid={Boolean(errors.email)} /></Field>
                <Field label="Social handle" name="social_handle" optional error={errors.social_handle} wide><input className="input" id={fieldId('social_handle')} value={draft.customer.social_handle} onChange={e => setCustomer('social_handle', e.target.value)} aria-invalid={Boolean(errors.social_handle)} placeholder="@yourhandle" /></Field>
              </div>
            </section>

            <section className="checkout-section panel" aria-labelledby="pickup-heading">
              <SectionHeading number="02" eyebrow="Worth the wait" id="pickup-heading">Choose your pickup.</SectionHeading>
              {!FUNDRAISER_MODE && <p className="section-help">Pickup begins two calendar days from today. Available times change with the day you choose.</p>}
              <div className="checkout-fields two-columns">
                <Field label="Pickup date" name="pickup_date" required error={errors.pickup_date}><div className="input-with-icon"><CalendarDays size={17} /><input className="input" id={fieldId('pickup_date')} type="date" min={CURRENT_PICKUP_DATE} max={CURRENT_PICKUP_DATE} value={draft.pickup_date} aria-invalid={Boolean(errors.pickup_date)} onChange={e => dispatch({ type: 'pickup', date: e.target.value, time: '', windowId: '' })} /></div></Field>
                <Field label="Pickup time" name="pickup_time" required error={errors.pickup_time}><div className="input-with-icon"><Clock3 size={17} /><select className="input" id={fieldId('pickup_time')} value={draft.pickup_window_id && draft.pickup_time ? `${draft.pickup_window_id}|${draft.pickup_time}` : ''} aria-invalid={Boolean(errors.pickup_time)} disabled={!draft.pickup_date || !slots.length} onChange={e => { const [windowId, time] = e.target.value.split('|'); dispatch({ type: 'pickup', date: draft.pickup_date, time: time || '', windowId: windowId || '' }) }}><option value="">{!draft.pickup_date ? 'Choose a date first' : slots.length ? 'Choose a time' : 'No pickup times this day'}</option>{slots.map(slot => <option value={`${slot.window_id}|${slot.time}`} key={`${slot.window_id}-${slot.time}`}>{slot.label}</option>)}</select></div></Field>
              </div>
              <div className="pickup-location"><MapPin size={17} /><div>{FUNDRAISER_MODE ? <><strong>We are currently only accepting orders for the 10/9 YAR fundraiser with Bengali Students Organization.</strong><span>The pickup location will be advertised on @doughnotdisturb_jz. Please check Instagram the morning of pickup. Everyone who purchases will receive the pickup location.</span></> : <><strong>{data.settings.pickup_location || 'Pickup location will be confirmed'}</strong><span>We&apos;ll use the contact details above if anything needs coordinating.</span></>}</div></div>
            </section>

            <section className="checkout-section panel" aria-labelledby="payment-heading">
              <SectionHeading number="03" eyebrow="After you place the order" id="payment-heading">Choose payment.</SectionHeading>
              <div className="payment-options">
                {data.settings.venmo_handle && <PaymentOption value="venmo" selected={draft.payment_method === 'venmo'} label="Venmo" recipient={`@${data.settings.venmo_handle.replace(/^@/, '')}`} onSelect={() => dispatch({ type: 'payment', method: 'venmo' })} />}
                {data.settings.zelle_recipient && <PaymentOption value="zelle" selected={draft.payment_method === 'zelle'} label="Zelle" recipient={data.settings.zelle_recipient} onSelect={() => dispatch({ type: 'payment', method: 'zelle' })} />}
              </div>
              {errors.payment_method && <p className="error-message" tabIndex={-1}>{errors.payment_method}</p>}
              <p className="payment-note"><CreditCard size={16} />Payment is arranged after the order is saved. It stays marked “awaiting payment” until the business confirms it.</p>
            </section>

            <section className="final-review panel"><Check size={18} /><div><strong>One last look</strong><p>{count} {count === 1 ? 'cookie' : 'cookies'} · {draft.packaging === 'card' ? 'Card with Note' : 'Standard packaging'} · {money(total)}</p></div></section>
          </div>
          <aside className="checkout-summary"><OrderSummary products={data.products}><Link className="button button-secondary edit-order" href="/#order"><ArrowLeft size={16} />Edit order</Link><button className="button place-order" disabled={isPending || !data.available} type="submit">{isPending ? 'Placing your order…' : 'Place order'} <ArrowRight size={17} /></button>{errors.order && <p className="error-message" tabIndex={-1}>{errors.order}</p>}<p className="submit-disclaimer">Submitting saves the order. It does not verify payment.</p></OrderSummary></aside>
        </form>
      </main>
      <SiteFooter instagramUrl={data.settings.instagram_url} />
    </div>
  )
}

function SectionHeading({ number, eyebrow, id, children }: { number: string; eyebrow: string; id: string; children: ReactNode }) {
  return <div className="checkout-section-heading"><span>{number}</span><div><p className="eyebrow">{eyebrow}</p><h2 id={id}>{children}</h2></div></div>
}

function Field({ label, name, required, optional, error, wide, children }: { label: string; name: string; required?: boolean; optional?: boolean; error?: string; wide?: boolean; children: ReactNode }) {
  return <div className={`field${wide ? ' field-wide' : ''}`}><label className="field-label" htmlFor={fieldId(name)}>{label} {required && <span aria-hidden="true">*</span>}{optional && <span>(optional)</span>}</label>{children}{error && <p id={`${fieldId(name)}-error`} className="error-message">{error}</p>}</div>
}

function PaymentOption({ value, selected, label, recipient, onSelect }: { value: string; selected: boolean; label: string; recipient: string; onSelect: () => void }) {
  return <label className={`payment-option${selected ? ' is-selected' : ''}`}><input type="radio" name="payment_method" value={value} checked={selected} onChange={onSelect} /><span><strong>{label}</strong><small>{recipient}</small></span><Check size={17} aria-hidden="true" /></label>
}

function Confirmation({ receipt, instagramUrl, onRestart }: { receipt: NonNullable<ReturnType<typeof useOrder>['receipt']>; instagramUrl: string | null; onRestart: () => void }) {
  const recipient = receipt.payment_method === 'venmo' ? `@${receipt.payment_recipient.replace(/^@/, '')}` : receipt.payment_recipient
  return <div className="checkout-page"><SiteHeader checkout /><main id="main-content" className="confirmation page-shell"><div className="confirmation-card panel"><span className="confirmation-icon"><PartyPopper /></span><p className="eyebrow">Order received</p><h1>Your cookie break<br /><em>is on the calendar.</em></h1><p className="confirmation-lede">We saved your order. Send payment with the order number below in the note; payment remains awaiting confirmation.</p><div className="order-number"><span>Order number</span><strong>{receipt.order_number}</strong></div><div className="confirmation-details"><div><CalendarDays /><span>Pickup</span><strong>{formatDate(receipt.pickup_date)}<br />at {formatTime(receipt.pickup_time)}</strong></div><div><MapPin /><span>Location</span><strong>{receipt.pickup_location || 'To be confirmed'}</strong></div><div><CreditCard /><span>{receipt.payment_method === 'venmo' ? 'Venmo' : 'Zelle'}</span><strong>{recipient}<br />{money(receipt.total_cents)}</strong></div></div><div className="payment-callout"><strong>Payment note</strong><span>{receipt.order_number}</span><p>Please include this order number so your payment can be matched. Payment is not yet verified.</p></div><button className="button" type="button" onClick={onRestart}>Start another order <ArrowRight size={17} /></button></div></main><SiteFooter instagramUrl={instagramUrl} /></div>
}

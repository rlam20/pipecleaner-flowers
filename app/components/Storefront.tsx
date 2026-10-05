'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Check, Gift, Minus, Plus, Sparkle } from 'lucide-react'
import type { CookieProduct, StorefrontData } from '@/lib/types'
import { money, orderLines, orderTotal, totalQuantity } from '@/lib/order'
import { useOrder } from './OrderProvider'
import OrderSummary from './OrderSummary'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

function CookieCard({ product, index, available }: { product: CookieProduct; index: number; available: boolean }) {
  const { draft, dispatch, hydrated } = useOrder()
  const quantity = draft.items.find(item => item.product_id === product.id)?.quantity ?? 0
  const setQuantity = (value: number) => dispatch({ type: 'quantity', productId: product.id, quantity: value })
  return (
    <article className={`cookie-card${quantity ? ' cookie-selected' : ''}`}>
      <div className={`cookie-photo cookie-photo-${index % 3}`}>
        <Image src={product.image_url} alt={`${product.name} cookie`} fill sizes="(max-width: 599px) 90vw, (max-width: 899px) 45vw, (max-width: 1199px) 30vw, 24vw" />
        <span className="cookie-number">0{index + 1}</span>
        {quantity > 0 && <span className="selected-label"><Check size={12} aria-hidden="true" /> In your bag</span>}
      </div>
      <div className="cookie-title-row"><h3>{product.name}</h3></div>
      <p className="cookie-description">{product.description}</p>
      <div className="cookie-card-bottom">
        <span className="cookie-price">{available ? money(product.unit_price_cents) : 'Menu preview'}{available && <span> / cookie</span>}</span>
        <div className="quantity-control" role="group" aria-label={`${product.name} quantity`}>
          <button type="button" aria-label={`Remove one ${product.name}`} disabled={!available || !hydrated || quantity === 0} onClick={() => setQuantity(quantity - 1)}><Minus size={15} aria-hidden="true" /></button>
          <output aria-label={`${product.name} in bag`} aria-live="polite">{quantity}</output>
          <button type="button" aria-label={`Add one ${product.name}`} disabled={!available || !hydrated} onClick={() => setQuantity(quantity + 1)}><Plus size={15} aria-hidden="true" /></button>
        </div>
      </div>
    </article>
  )
}

export default function Storefront({ data }: { data: StorefrontData }) {
  const { draft, dispatch, hydrated } = useOrder()
  const count = totalQuantity(draft.items)
  const lines = orderLines(draft.items, data.products)
  const total = orderTotal(lines)
  const needsNote = draft.packaging === 'card' && !draft.card_message.trim()
  const canCheckout = hydrated && data.available && count > 0 && !needsNote

  return (
    <div className="storefront">
      <SiteHeader />
      <main id="main-content">
        <section className="hero page-shell" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <p className="eyebrow"><Sparkle size={15} strokeWidth={1.4} aria-hidden="true" /> Small batch. Big feelings.</p>
            <h1 id="hero-heading">A little pause.<br />A really<br /><em>good cookie.</em></h1>
            <p className="hero-description">For the slow afternoons, the just-because gifts, and the one-more-bite moments. Find your new favorite.</p>
            <Link className="button hero-button" href="#order">Order Now <ArrowUpRight size={19} strokeWidth={1.5} aria-hidden="true" /></Link>
            <div className="hero-small-note"><span className="tiny-star">✳</span> A little something worth slowing down for.</div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo"><Image src="/cookies/hero.webp" alt="A warm, inviting assortment of cookies on a ceramic plate" fill priority sizes="(max-width: 759px) 92vw, 49vw" /></div>
            <div className="hero-seal" aria-hidden="true"><Sparkle size={16} strokeWidth={1.1} /><span>do not<br /><em>disturb.</em></span><small>COOKIE BREAK</small></div>
            <p className="photo-caption"><span>Made for your little moments.</span><span>Enjoy every crumb.</span></p>
          </div>
        </section>

        <div className="brand-strip" aria-hidden="true"><span>A moment for you</span><Sparkle size={17} strokeWidth={1.2} /><span>A cookie for every mood</span><Sparkle size={17} strokeWidth={1.2} /><span>Go on, take a little break</span></div>

        <section id="order" className="order-section page-shell" aria-labelledby="menu-heading">
          <div className="section-heading">
            <div><p className="eyebrow">01 / The cookie counter</p><h2 id="menu-heading">Meet your next<br /><em>little obsession.</em></h2></div>
            <p>One for the moment. A few for later.<br />Mix your favorites and make it yours.</p>
          </div>
          {!data.available && <div className="store-notice" role="status"><strong>The cookie counter is getting ready.</strong><p>Take a look around. Online ordering is temporarily unavailable; please check back soon.</p></div>}
          <div className="order-layout">
            <div className="order-builder">
              <div className="cookie-grid">{data.products.map((product, index) => <CookieCard product={product} index={index} available={data.available} key={product.id} />)}</div>
              <div className="quantity-explainer">
                <p>A little treat or a reason to gather?</p>
                <ul>
                  <li><Sparkle size={14} aria-hidden="true" /><strong>1–6 cookies: Snack Pick Up.</strong></li>
                  <li><Sparkle size={14} aria-hidden="true" /><strong>7 or more: Party Pack.</strong></li>
                  <li><Sparkle size={14} aria-hidden="true" /><strong>3 cookies: $8.</strong></li>
                  <li><Sparkle size={14} aria-hidden="true" /><strong>5 cookies: $13.</strong></li>
                </ul>
              </div>
              <fieldset className="packaging-section" disabled={!data.available}>
                <legend><span className="eyebrow">02 / The finishing touch</span><span className="packaging-title">A little extra thought.</span></legend>
                <p>For yourself or someone on your mind. Your choice, always included.</p>
                <div className="packaging-options">
                  <label className={`packaging-option${draft.packaging === 'standard' ? ' is-selected' : ''}`}>
                    <input type="radio" name="packaging" value="standard" checked={draft.packaging === 'standard'} onChange={() => dispatch({ type: 'packaging', packaging: 'standard' })} />
                    <span><strong>Just the cookies</strong><small>Our standard packaging</small></span><span className="option-price">Included</span>
                  </label>
                  <label className={`packaging-option${draft.packaging === 'card' ? ' is-selected' : ''}`}>
                    <input type="radio" name="packaging" value="card" checked={draft.packaging === 'card'} onChange={() => dispatch({ type: 'packaging', packaging: 'card' })} />
                    <span><strong>Card with Note <Gift size={15} aria-hidden="true" /></strong><small>Say it with something sweet</small></span><span className="option-price">Free</span>
                  </label>
                </div>
                {draft.packaging === 'card' && <div className="field gift-message-field"><label className="field-label" htmlFor="card-message">Your message <span>(required)</span></label><textarea id="card-message" className="input" rows={3} placeholder="A little note to make their day…" value={draft.card_message} onChange={event => dispatch({ type: 'message', message: event.target.value })} required aria-describedby="card-message-help" /><p id="card-message-help" className="field-hint">We’ll include this message with your cookies.</p></div>}
              </fieldset>
            </div>
            <aside className="summary-sidebar">
              <OrderSummary products={data.products}>
                {canCheckout ? <Link href="/checkout" className="button checkout-button">Continue to Checkout <ArrowRight size={17} aria-hidden="true" /></Link> : <button type="button" className="button checkout-button" disabled>Continue to Checkout <ArrowRight size={17} aria-hidden="true" /></button>}
                {needsNote && <p className="field-hint checkout-hint">Add your card message to continue.</p>}
              </OrderSummary>
            </aside>
          </div>
        </section>

        <section id="about" className="about-section" aria-labelledby="about-heading">
          <div className="page-shell about-inner"><div className="about-mark" aria-hidden="true"><Sparkle size={62} strokeWidth={0.7} /><span>the art of<br /><em>doing less.</em></span></div><div className="about-copy"><p className="eyebrow">Consider this your out-of-office.</p><h2 id="about-heading">Life can wait.<br /><em>Your cookie shouldn’t.</em></h2><p>Some moments don’t need an occasion. Just a favorite flavor, a quiet corner, and permission to enjoy it. That’s the feeling behind DoughNotDisturb.</p><Link href="#order" className="text-link">Find your little pause <ArrowUpRight size={17} aria-hidden="true" /></Link></div></div>
        </section>
      </main>
      <SiteFooter instagramUrl={data.settings.instagram_url} />
      {hydrated && count > 0 && <div className="mobile-checkout"><div><span>{count} {count === 1 ? 'cookie' : 'cookies'} in your bag</span><strong>{money(total)}</strong></div>{canCheckout ? <Link href="/checkout" className="button">Checkout <ArrowRight size={16} aria-hidden="true" /></Link> : <button type="button" className="button" disabled>{needsNote ? 'Add your note' : 'Unavailable'}</button>}</div>}
    </div>
  )
}

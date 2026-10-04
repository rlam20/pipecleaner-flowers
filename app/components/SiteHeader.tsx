'use client'

import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { useOrder } from './OrderProvider'
import { totalQuantity } from '@/lib/order'

export default function SiteHeader({ checkout = false }: { checkout?: boolean }) {
  const { draft, hydrated } = useOrder()
  const count = hydrated ? totalQuantity(draft.items) : 0

  return (
    <>
      <div className="announcement">A little anticipation makes it sweeter. Order at least 5 days ahead.</div>
      <header className="site-header page-shell">
        <Link className="wordmark" href="/" aria-label="DoughNotDisturb home">Dough<span>Not</span>Disturb<span className="wordmark-period">.</span></Link>
        {checkout ? (
          <Link className="nav-link back-to-menu" href="/#order"><ArrowLeft size={16} aria-hidden="true" /> Back to the cookies</Link>
        ) : (
          <nav className="site-nav" aria-label="Main navigation">
            <Link className="nav-link" href="/#order">The cookies</Link>
            <Link className="nav-link about-nav" href="/#about">Our little pause</Link>
            <Link className="bag-link" href={count ? '/checkout' : '/#order'} aria-label={`Order bag, ${count} ${count === 1 ? 'cookie' : 'cookies'}`}>
              <ShoppingBag size={18} strokeWidth={1.5} aria-hidden="true" /><span className="bag-label">Your bag</span><span className="bag-count">{count}</span>
            </Link>
          </nav>
        )}
      </header>
    </>
  )
}

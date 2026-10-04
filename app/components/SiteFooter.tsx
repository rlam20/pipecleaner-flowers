import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export default function SiteFooter({ instagramUrl }: { instagramUrl?: string | null }) {
  const safeInstagram = instagramUrl?.startsWith('https://') ? instagramUrl : null
  return (
    <footer className="site-footer page-shell">
      <div>
        <Link className="wordmark footer-wordmark" href="/">Dough<span>Not</span>Disturb.</Link>
        <p>A little pause, baked into your day.</p>
      </div>
      <div className="footer-links">
        <Link href="/#order">Find your favorite <ArrowUpRight size={15} aria-hidden="true" /></Link>
        {safeInstagram && <a href={safeInstagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={15} aria-hidden="true" /></a>}
        <span>© {new Date().getFullYear()} DoughNotDisturb</span>
      </div>
    </footer>
  )
}

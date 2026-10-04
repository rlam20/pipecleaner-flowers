import type { Metadata, Viewport } from 'next'
import { Merriweather } from 'next/font/google'
import { OrderProvider } from './components/OrderProvider'
import './globals.css'

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-merriweather',
})

export const metadata: Metadata = {
  title: {
    default: 'DoughNotDisturb | A little pause. A really good cookie.',
    template: '%s | DoughNotDisturb',
  },
  description: 'Make a little room for something good. Discover Matcha Neapolitan, Biscoff Chai, and Mango Lassi cookies, and build your pickup order.',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#fff8ef' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={merriweather.variable}>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <OrderProvider>{children}</OrderProvider>
      </body>
    </html>
  )
}

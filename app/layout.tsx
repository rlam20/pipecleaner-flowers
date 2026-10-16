import type { Metadata, Viewport } from 'next'
import Image from 'next/image'
import { OrderProvider } from './components/OrderProvider'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'DoughNotDisturb | A little pause. A really good cookie.',
    template: '%s | DoughNotDisturb',
  },
  description: 'Make a little room for something good. Discover Matcha Neapolitan, Biscoff Chai, and Mango Lassi cookies, and build your pickup order.',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#100d13' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <div className="site-spiders" aria-hidden="true">
          <Image className="site-spider site-spider-one" src="/spider.png" alt="" width={108} height={108} priority />
          <Image className="site-spider site-spider-two" src="/spider.png" alt="" width={76} height={76} />
          <Image className="site-spider site-spider-three" src="/spider.png" alt="" width={90} height={90} />
        </div>
        <OrderProvider>{children}</OrderProvider>
      </body>
    </html>
  )
}

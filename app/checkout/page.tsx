import type { Metadata } from 'next'
import { getStorefront } from '@/lib/storefront'
import Checkout from './Checkout'
import './checkout.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  const data = await getStorefront()
  return <Checkout initialData={data} />
}

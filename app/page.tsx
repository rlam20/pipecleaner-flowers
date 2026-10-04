import Storefront from './components/Storefront'
import { getStorefront } from '@/lib/storefront'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const data = await getStorefront()
  return <Storefront data={data} />
}

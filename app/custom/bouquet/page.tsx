import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CustomBuilder from './_components/CustomBuilder' // This import belongs HERE

export default async function BouquetBuilderPage() {
  const supabase = await createClient()

  // Fetch data
  const { data: flowerTypes } = await supabase
    .from('flower_types')
    .select('*')
    .order('name')

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/custom" className="text-rose-600 hover:text-rose-700 font-medium mb-4 inline-block">
            ← Back to Custom Options
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-rose-900 mb-2">
            Build Your Bouquet
          </h1>
          <p className="text-zinc-600">
            Choose your flowers, colors, and make it uniquely yours!
          </p>
        </div>

        {/* Render the builder */}
        <CustomBuilder flowerTypes={flowerTypes || []} />
      </div>
    </main>
  )
}
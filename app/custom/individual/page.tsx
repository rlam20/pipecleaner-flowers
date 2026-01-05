import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import IndividualFlowerSelector from './_components/IndividualFlowerSelector'

export default async function IndividualFlowersPage() {
  const supabase = await createClient()
  
  const { data: flowerTypes } = await supabase
    .from('flower_types')
    .select('*')
    .order('name')

  const { data: colorOptions } = await supabase
    .from('color_options')
    .select('*')
    .order('name')

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/custom" className="text-rose-600 hover:text-rose-700 font-medium mb-4 inline-block">
            ← Back to Custom Options
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-rose-900 mb-2">
            Individual Flowers
          </h1>
          <p className="text-gray-600">
            Order single stems in your choice of colors
          </p>
        </div>

        <IndividualFlowerSelector 
          flowerTypes={flowerTypes || []}
          colorOptions={colorOptions || []}
        />
      </div>
    </main>
  )
}
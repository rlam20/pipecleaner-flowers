import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CustomPage() {
  const supabase = await createClient()
  
  // Fetch flower types and color options
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
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-rose-600 hover:text-rose-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-rose-900 mb-2">
            Custom Flowers
          </h1>
          <p className="text-gray-600">
            Choose exactly what you want!
          </p>
        </div>

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Build a Bouquet */}
          <Link
            href="/custom/bouquet"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">💐</div>
              <h2 className="text-2xl font-bold text-rose-900 mb-3">
                Build a Bouquet
              </h2>
              <p className="text-gray-600 mb-4">
                Choose multiple flowers, select colors for each, and create your perfect arrangement.
              </p>
              <div className="text-rose-600 font-semibold group-hover:translate-x-2 transition-transform inline-block">
                Start Building →
              </div>
            </div>
          </Link>

          {/* Individual Flowers */}
          <Link
            href="/custom/individual"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🌹</div>
              <h2 className="text-2xl font-bold text-rose-900 mb-3">
                Individual Flowers
              </h2>
              <p className="text-gray-600 mb-4">
                Order single stems in your choice of colors. Perfect for gifts or mixing with other bouquets.
              </p>
              <div className="text-rose-600 font-semibold group-hover:translate-x-2 transition-transform inline-block">
                Shop Singles →
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function PresetBundlesPage() {
  const supabase = await createClient()
  
  const { data: bundles } = await supabase
    .from('preset_bundles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-rose-600 hover:text-rose-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-rose-900 mb-2">
            Premade Bundles
          </h1>
          <p className="text-gray-600">
            Beautifully curated flower collections, ready to order!
          </p>
        </div>

        {/* Bundles Grid */}
        {bundles && bundles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle: any) => (
              <Link
                key={bundle.id}
                href={`/premade/${bundle.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
              >
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={bundle.image_url}
                    alt={bundle.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {bundle.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {bundle.description}
                  </p>
                  
                  {/* Flower composition preview */}
                  <div className="mb-3 text-xs text-gray-500">
                    Includes: {bundle.flower_composition.map((f: any, i: number) => (
                      <span key={i}>
                        {f.quantity} {f.flower_name}{i < bundle.flower_composition.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-rose-600">
                      ${bundle.price.toFixed(2)}
                    </span>
                    
                    <span className="text-rose-600 font-medium group-hover:translate-x-1 transition-transform">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              No bundles available right now. Check back soon!
            </p>
            <Link 
              href="/custom"
              className="text-rose-600 hover:text-rose-700 font-medium"
            >
              Or build a custom bouquet →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
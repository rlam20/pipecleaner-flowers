import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import BundleOrderForm from './_components/BundleOrderForm'

export default async function BundleDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: bundle } = await supabase
    .from('preset_bundles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!bundle) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/premade" className="text-rose-600 hover:text-rose-700 font-medium mb-4 inline-block">
            ← Back to Bundles
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Image */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-96 lg:h-full min-h-[400px]">
              <Image
                src={bundle.image_url}
                alt={bundle.name}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Right: Details & Order */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-rose-900 mb-3">
                {bundle.name}
              </h1>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {bundle.description}
              </p>

              {/* What's Included */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">What's Included:</h3>
                <ul className="space-y-2">
                  {bundle.flower_composition.map((flower: any, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-gray-700">
                      <span className="w-2 h-2 bg-rose-400 rounded-full"></span>
                      <span>{flower.quantity} {flower.flower_name}{flower.quantity > 1 ? 's' : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price */}
              <div className="border-t pt-4 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-rose-600">
                    ${bundle.price.toFixed(2)}
                  </span>
                  <span className="text-gray-500">per bundle</span>
                </div>
              </div>
            </div>

            {/* Order Form */}
            <BundleOrderForm 
              bundleId={bundle.id}
              bundleName={bundle.name}
              bundlePrice={bundle.price}
              colorThemes={bundle.color_themes}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AddBundleForm from './_components/AddBundleForm'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const { data: bundles } = await supabase
    .from('preset_bundles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-rose-600 hover:text-rose-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-rose-900 mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600">
            Manage your premade bundles
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Add Bundle Form */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6">Add New Bundle</h2>
              <AddBundleForm />
            </div>
          </div>

          {/* Right: Existing Bundles */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6">Existing Bundles</h2>
              
              {bundles && bundles.length > 0 ? (
                <div className="space-y-4">
                  {bundles.map((bundle: any) => (
                    <div key={bundle.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{bundle.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{bundle.description}</p>
                          <div className="mt-2 text-sm text-gray-500">
                            <div>Flowers: {bundle.flower_composition.map((f: any) => `${f.quantity} ${f.flower_name}`).join(', ')}</div>
                            <div className="mt-1">Themes: {bundle.color_themes.length}</div>
                          </div>
                          <div className="mt-2 text-xl font-bold text-rose-600">
                            ${bundle.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No bundles yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
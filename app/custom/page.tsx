import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function CustomPage() {
  const supabase = await createClient()
  
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-[1600px] mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <Link href="/" className="text-rose-600 hover:text-rose-700 font-bold text-lg mb-6 inline-block transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-5xl md:text-7xl font-bold text-rose-900 mb-4 tracking-tight">
            Custom Flowers
          </h1>
          <p className="text-xl md:text-2xl text-stone-600 font-medium">
            Choose exactly what you want!
          </p>
        </div>

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-10">
          
          {/* Option 1: Build a Bouquet */}
          <Link
            href="/custom/bouquet"
            className="group bg-white rounded-3xl shadow-sm border border-stone-200 hover:shadow-2xl hover:border-rose-200 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center p-16 md:p-24 text-center min-h-[500px]"
          >
            <div className="relative w-32 h-32 mb-8 rounded-full overflow-hidden shadow-inner border-4 border-stone-100 group-hover:border-rose-100 transition-colors">
              <Image 
                src="/IMG_5299.jpeg"
                alt="Custom Bouquet"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-4xl font-bold text-stone-900 mb-6 group-hover:text-rose-700 transition-colors">
              Build a Bouquet
            </h2>
            <p className="text-xl text-stone-500 mb-8 max-w-md leading-relaxed">
              Choose multiple flowers, select colors for each, and create your perfect arrangement.
            </p>
            <div className="text-xl font-bold text-white bg-rose-600 py-4 px-8 rounded-full shadow-lg shadow-rose-200 group-hover:bg-rose-700 group-hover:scale-105 transition-all">
              Start Building →
            </div>
          </Link>

          {/* Option 2: Individual Flowers */}
          <Link
            href="/custom/individual"
            className="group bg-white rounded-3xl shadow-sm border border-stone-200 hover:shadow-2xl hover:border-rose-200 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center p-16 md:p-24 text-center min-h-[500px]"
          >
            <div className="relative w-32 h-32 mb-8 rounded-full overflow-hidden shadow-inner border-4 border-stone-100 group-hover:border-rose-100 transition-colors">
              <Image 
                src="/IMG_5324.jpeg"
                alt="Individual Flowers"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-4xl font-bold text-stone-900 mb-6 group-hover:text-rose-700 transition-colors">
              Individual Flowers
            </h2>
            <p className="text-xl text-stone-500 mb-8 max-w-md leading-relaxed">
              Order single stems in your choice of colors. Perfect for gifts or mixing with other bouquets.
            </p>
            <div className="text-xl font-bold text-white bg-rose-600 py-4 px-8 rounded-full shadow-lg shadow-rose-200 group-hover:bg-rose-700 group-hover:scale-105 transition-all">
              Shop Singles →
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function CustomPage() {
  const supabase = await createClient()
  
  return (
    <main className="min-h-screen bg-stone-50 flex flex-col justify-center">
      {/* 1. max-w-[1200px]: Stops it from stretching too wide on huge monitors
         2. w-[90%]: Ensures it has margins on mobile phones
      */}
      <div className="max-w-[1200px] w-[90%] mx-auto py-12 lg:py-20">
        
        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <Link href="/" className="text-rose-600 hover:text-rose-700 font-bold text-lg mb-6 inline-block transition-colors">
            ← Back to Home
          </Link>
          {/* Using fluid text classes */}
          <h1 className="text-4xl md:text-6xl font-bold text-rose-900 mb-4 tracking-tight">
            Custom Flowers
          </h1>
          <p className="text-lg md:text-xl text-stone-600 font-medium">
            Choose exactly what you want!
          </p>
        </div>

        {/* Two Options Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
          
          {/* Option 1: Build a Bouquet */}
          <Link
            href="/custom/bouquet"
            // CHANGED:
            // 1. aspect-[4/5] md:aspect-[3/4]: Forces a consistent rectangular shape regardless of content
            // 2. p-8: Reduced padding because 'clamp' handles the scaling now
            className="group bg-white rounded-3xl shadow-sm border border-stone-200 hover:shadow-xl hover:border-rose-200 transition-all duration-300 flex flex-col items-center justify-center p-8 text-center aspect-[4/5] md:aspect-auto md:min-h-[500px]"
          >
            <div className="relative w-32 h-32 mb-8 rounded-full overflow-hidden shadow-inner border-4 border-stone-100 group-hover:border-rose-100 transition-colors shrink-0">
              <Image 
                src="/IMG_5299.jpeg"
                alt="Custom Bouquet"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4 group-hover:text-rose-700 transition-colors">
              Build a Bouquet
            </h2>
            <p className="text-base text-stone-500 mb-8 max-w-xs leading-relaxed">
              Choose multiple flowers, select colors for each, and create your perfect arrangement.
            </p>
            <div className="mt-auto text-lg font-bold text-white bg-rose-600 py-3 px-8 rounded-full shadow-lg shadow-rose-200 group-hover:bg-rose-700 group-hover:scale-105 transition-all">
              Start Building →
            </div>
          </Link>

          {/* Option 2: Individual Flowers */}
          <Link
            href="/custom/individual"
            className="group bg-white rounded-3xl shadow-sm border border-stone-200 hover:shadow-xl hover:border-rose-200 transition-all duration-300 flex flex-col items-center justify-center p-8 text-center aspect-[4/5] md:aspect-auto md:min-h-[500px]"
          >
            <div className="relative w-32 h-32 mb-8 rounded-full overflow-hidden shadow-inner border-4 border-stone-100 group-hover:border-rose-100 transition-colors shrink-0">
              <Image 
                src="/IMG_5324.jpeg"
                alt="Individual Flowers"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4 group-hover:text-rose-700 transition-colors">
              Individual Flowers
            </h2>
            <p className="text-base text-stone-500 mb-8 max-w-xs leading-relaxed">
              Order single stems in your choice of colors. Perfect for gifts or mixing with other bouquets.
            </p>
            <div className="mt-auto text-lg font-bold text-white bg-rose-600 py-3 px-8 rounded-full shadow-lg shadow-rose-200 group-hover:bg-rose-700 group-hover:scale-105 transition-all">
              Shop Singles →
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
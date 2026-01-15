import Link from 'next/link'
import CustomBuilder from './_components/CustomBuilder'

export default function BouquetBuilderPage() {
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

        {/* Removed props since CustomBuilder now uses the hardcoded menu */}
        <CustomBuilder />
      </div>
    </main>
  )
}
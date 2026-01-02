import Link from 'next/link'

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden flex">
      {/* Custom Bouquets - Left Side */}
      <Link 
        href="/custom"
        className="relative flex-1 group overflow-hidden"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: "url('/IMG_5299.jpeg')" }} // Path updated here
        />
<div className="absolute inset-0 bg-fuchsia-950/40 group-hover:bg-fuchsia-950/60 transition-all duration-500" />        <div className="relative h-full flex flex-col items-center justify-center text-white px-8">
          <h2 className="text-5xl md:text-6xl font-bold text-center leading-tight transform group-hover:scale-105 transition-transform duration-500">
            Build <br/> Custom <br/> Bouquets
          </h2>
          
          <p className="absolute bottom-1/4 translate-y-9 text-xl md:text-2xl text-center max-w-md opacity-0 group-hover:opacity-100 transition-all duration-500">
            Choose the flowers you want to put in your bouquet, and how big you want your bouquet to be!
          </p>
        </div>
      </Link>

      {/* Divider Line */}
      <div className="w-px bg-white/30 z-10" />

      {/* Individual Flowers - Right Side */}
      <Link 
        href="/premade"
        className="relative flex-1 group overflow-hidden"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: "url('/IMG_5324.jpeg')" }} // Assuming your second image is named similarly
        />
        <div className="absolute inset-0 bg-rose-900/40 group-hover:bg-rose-900/60 transition-all duration-500" />
        
        <div className="relative h-full flex flex-col items-center justify-center text-white px-8">
         <h2 className="text-5xl md:text-6xl font-bold text-center leading-tight transform group-hover:scale-105 transition-transform duration-500">
  Shop <br/> Premade <br/> Bundles
</h2>

<p className="absolute bottom-1/4 translate-y-1 text-xl md:text-2xl text-center max-w-md opacity-0 group-hover:opacity-100 transition-all duration-500">
  Browse our curated flower bundle collections, ready to order!
</p>
        </div>
      </Link>
    </main>
  )
}
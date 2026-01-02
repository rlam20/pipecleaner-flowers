'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  bundleId: string
  bundleName: string
  bundlePrice: number
  colorThemes: string[]
}

export default function BundleOrderForm({ bundleId, bundleName, bundlePrice, colorThemes }: Props) {
  const router = useRouter()
  const [selectedTheme, setSelectedTheme] = useState<string>('')

  const handleCheckout = () => {
    if (!selectedTheme) {
      alert('Please select a color theme')
      return
    }

    const params = new URLSearchParams({
      type: 'bundle',
      bundleId: bundleId,
      bundleName: bundleName,
      price: bundlePrice.toString(),
      theme: selectedTheme
    })

    router.push(`/checkout?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-semibold text-lg mb-4">Choose Your Color Theme:</h3>
      
      <div className="space-y-3 mb-6">
        {colorThemes.map((theme, index) => (
          <label 
            key={index}
            className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:border-rose-300 transition-colors"
            style={{ 
              borderColor: selectedTheme === theme ? '#e11d48' : '#e5e7eb',
              backgroundColor: selectedTheme === theme ? '#fff1f2' : 'white'
            }}
          >
            <input
              type="radio"
              name="theme"
              value={theme}
              checked={selectedTheme === theme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-5 h-5 text-rose-600"
            />
            <span className="flex-1 font-medium text-gray-900">{theme}</span>
          </label>
        ))}
      </div>

      <button
        onClick={handleCheckout}
        disabled={!selectedTheme}
        className="w-full px-6 py-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
      >
        Proceed to Checkout
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Payment via Venmo after order is placed
      </p>
    </div>
  )
}
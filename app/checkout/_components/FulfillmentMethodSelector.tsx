'use client'

import { FulfillmentMethod } from '@/lib/types'

type Props = {
  selected: FulfillmentMethod | null
  onSelect: (method: FulfillmentMethod) => void
  subtotal: number
}

export default function FulfillmentMethodSelector({ selected, onSelect, subtotal }: Props) {
  const deliveryFee = subtotal >= 25 ? 0 : 2.99

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">How would you like to receive your flowers?</h2>
      <p className="text-gray-600 mb-6">
        Choose the most convenient way to get your flowers—pick up at your convenience, 
        or have them delivered right to you for a fraction of the price of your Door Dash ;)
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pickup Option */}
        <button
          type="button"
          onClick={() => onSelect('pickup')}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            selected === 'pickup'
              ? 'border-rose-500 bg-rose-50'
              : 'border-gray-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">📍</div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected === 'pickup' ? 'border-rose-500 bg-rose-500' : 'border-gray-300'
            }`}>
              {selected === 'pickup' && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Pick-up</h3>
          <p className="text-sm text-gray-600 mb-2">
            Meet at Rice Hall or Clemons Library
          </p>
          <div className="text-lg font-bold text-green-600">FREE</div>
          <p className="text-xs text-gray-500 mt-2">
            Generally available weekdays 3-5:50pm (except Wed), Friday most times
          </p>
        </button>

        {/* Delivery Option */}
        <button
          type="button"
          onClick={() => onSelect('delivery')}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            selected === 'delivery'
              ? 'border-rose-500 bg-rose-50'
              : 'border-gray-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">🚗</div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected === 'delivery' ? 'border-rose-500 bg-rose-500' : 'border-gray-300'
            }`}>
              {selected === 'delivery' && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Delivery</h3>
          <p className="text-sm text-gray-600 mb-2">
            Delivered within 3 miles of UVA Grounds
          </p>
          <div className="text-lg font-bold text-rose-600">
            {deliveryFee === 0 ? (
              <span className="text-green-600">FREE (order $25+)</span>
            ) : (
              <span>+${deliveryFee.toFixed(2)}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Generally available weekdays 8pm-12am, Friday most times
          </p>
        </button>
      </div>
    </div>
  )
}
'use client'

import { OrderAddons } from '@/lib/types'

type Props = {
  addons: OrderAddons
  onChange: (field: keyof OrderAddons, value: boolean) => void
}

export default function AddonsSelector({ addons, onChange }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Add-Ons & More</h2>
      <p className="text-gray-600 mb-6">
        Make your bouquet truly one-of-a-kind! Choose from our collection of special add-ons to elevate your flowers!!
      </p>

      <div className="space-y-4">
        {/* Strawberry Pocky */}
        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-rose-300 transition-colors">
          <input
            type="checkbox"
            checked={addons.pocky}
            onChange={(e) => onChange('pocky', e.target.checked)}
            className="w-5 h-5 text-rose-600 rounded"
          />
          <div className="flex-1">
            <span className="font-medium">Add a box of Strawberry Pocky</span>
          </div>
          <span className="font-semibold text-rose-600">+$1.50</span>
        </label>

        {/* Glass Vase */}
        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-rose-300 transition-colors">
          <input
            type="checkbox"
            checked={addons.vase}
            onChange={(e) => onChange('vase', e.target.checked)}
            className="w-5 h-5 text-rose-600 rounded"
          />
          <div className="flex-1">
            <div className="font-medium">Upgrade to a glass vase</div>
            <div className="text-xs text-gray-500">Your flowers will come in paper-based wrapping by default</div>
          </div>
          <span className="font-semibold text-rose-600">+$2.00</span>
        </label>

        {/* Gift Wrapping */}
        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-rose-300 transition-colors">
          <input
            type="checkbox"
            checked={addons.wrapped}
            onChange={(e) => onChange('wrapped', e.target.checked)}
            className="w-5 h-5 text-rose-600 rounded"
          />
          <div className="flex-1">
            <span className="font-medium">Gift wrapped with paper</span>
          </div>
          <span className="font-semibold text-rose-600">+$2.00</span>
        </label>
      </div>
    </div>
  )
}
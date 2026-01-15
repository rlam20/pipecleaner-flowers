'use client'

import { OrderAddons } from '@/lib/types'

type Props = {
  addons: OrderAddons
  onChange: (field: keyof OrderAddons, value: boolean) => void
}

export default function AddonsSelector({ addons, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900">Add-Ons & More</h2>
      
      {/* Strawberry Pocky */}
      <label className="flex items-center gap-3 p-4 border-2 border-stone-200 rounded-xl cursor-pointer hover:border-rose-300 transition-colors">
        <input
          type="checkbox"
          checked={addons.pocky}
          onChange={(e) => onChange('pocky', e.target.checked)}
          className="w-5 h-5 text-rose-600 rounded"
        />
        <div className="flex-1">
          <span className="font-bold text-zinc-800">Strawberry Pocky (yum)</span>
        </div>
        <span className="font-bold text-rose-600">+$1.50</span>
      </label>

      {/* Glass Vase */}
      <label className="flex items-center gap-3 p-4 border-2 border-stone-200 rounded-xl cursor-pointer hover:border-rose-300 transition-colors">
        <input
          type="checkbox"
          checked={addons.vase}
          onChange={(e) => onChange('vase', e.target.checked)}
          className="w-5 h-5 text-rose-600 rounded"
        />
        <div className="flex-1 text-zinc-800 font-bold">Glass Vase</div>
        <span className="font-bold text-rose-600">+$2.00</span>
      </label>
    </div>
  )
}
'use client'

import { useState, useReducer } from 'react'
import { useRouter } from 'next/navigation'
import type { FlowerType, ColorOption, SelectedFlower, CustomBouquetAddons } from '@/lib/types'

type BuilderState = {
  flowers: SelectedFlower[]
  addons: CustomBouquetAddons
}

type BuilderAction =
  | { type: 'ADD_FLOWER'; payload: SelectedFlower }
  | { type: 'REMOVE_FLOWER'; payload: string }
  | { type: 'TOGGLE_WRAPPED' }
  | { type: 'SET_ORGANIZATION'; payload: 'maker' | 'diy' }

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'ADD_FLOWER':
      return { ...state, flowers: [...state.flowers, action.payload] }
    case 'REMOVE_FLOWER':
      return { ...state, flowers: state.flowers.filter(f => f.id !== action.payload) }
    case 'TOGGLE_WRAPPED':
      return { ...state, addons: { ...state.addons, wrapped: !state.addons.wrapped } }
    case 'SET_ORGANIZATION':
      return { ...state, addons: { ...state.addons, organization: action.payload } }
    default:
      return state
  }
}

function calculateTotal(state: BuilderState): number {
  const flowersTotal = state.flowers.reduce((sum, f) => sum + f.price, 0)
  const wrappingFee = state.addons.wrapped ? 2 : 0
  return flowersTotal + wrappingFee
}

type Props = {
  flowerTypes: FlowerType[]
  colorOptions: ColorOption[]
}

export default function CustomBuilder({ flowerTypes, colorOptions }: Props) {
  const router = useRouter()
  
  const [state, dispatch] = useReducer(builderReducer, {
    flowers: [],
    addons: { wrapped: false, organization: 'maker' }
  })

  const [showFlowerModal, setShowFlowerModal] = useState(false)
  const [selectedFlowerType, setSelectedFlowerType] = useState<FlowerType | null>(null)

  const handleAddFlower = (flowerType: FlowerType) => {
    setSelectedFlowerType(flowerType)
    setShowFlowerModal(true)
  }

  const handleColorSelect = (color: ColorOption) => {
    if (!selectedFlowerType) return

    const newFlower: SelectedFlower = {
id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,      flower_type_id: selectedFlowerType.id,
      flower_name: selectedFlowerType.name,
      color_id: color.id,
      color_name: color.name,
      price: selectedFlowerType.base_price + color.price_modifier
    }

    dispatch({ type: 'ADD_FLOWER', payload: newFlower })
    setShowFlowerModal(false)
    setSelectedFlowerType(null)
  }

  const handleCheckout = () => {
    if (state.flowers.length === 0) {
      alert('Please add at least one flower to your bouquet')
      return
    }

    const bouquetData = {
      flowers: state.flowers,
      addons: state.addons,
      total_price: calculateTotal(state)
    }

    // Pass bouquet data to checkout via URL params (encoded)
    const params = new URLSearchParams({
      type: 'custom',
      data: JSON.stringify(bouquetData)
    })
    
    router.push(`/checkout?${params.toString()}`)
  }

  const total = calculateTotal(state)

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left: Flower Selection */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Choose Your Flowers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {flowerTypes.map((flower) => (
              <button
                key={flower.id}
                onClick={() => handleAddFlower(flower)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition-all text-left"
              >
                <div className="font-semibold text-gray-900">{flower.name}</div>
                <div className="text-sm text-gray-600">from ${flower.base_price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Add-ons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Add-ons</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={state.addons.wrapped}
                onChange={() => dispatch({ type: 'TOGGLE_WRAPPED' })}
                className="w-5 h-5 text-rose-600 rounded"
              />
              <span className="flex-1">Wrapped with paper</span>
              <span className="font-semibold text-rose-600">+$2.00</span>
            </label>

            <div>
              <p className="font-medium mb-2">Organization:</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="organization"
                    checked={state.addons.organization === 'maker'}
                    onChange={() => dispatch({ type: 'SET_ORGANIZATION', payload: 'maker' })}
                    className="w-5 h-5 text-rose-600"
                  />
                  <span>Organized by maker</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="organization"
                    checked={state.addons.organization === 'diy'}
                    onChange={() => dispatch({ type: 'SET_ORGANIZATION', payload: 'diy' })}
                    className="w-5 h-5 text-rose-600"
                  />
                  <span>DIY (you arrange them)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Summary */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
          <h2 className="text-2xl font-semibold mb-4">Your Bouquet</h2>
          
          {state.flowers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No flowers added yet</p>
          ) : (
            <div className="space-y-2 mb-4">
              {state.flowers.map((flower) => (
                <div key={flower.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{flower.flower_name}</div>
                    <div className="text-xs text-gray-600">{flower.color_name}</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-700 mr-2">
                    ${flower.price.toFixed(2)}
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_FLOWER', payload: flower.id })}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            {state.addons.wrapped && (
              <div className="flex justify-between text-sm">
                <span>Gift wrapping</span>
                <span>$2.00</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-rose-600">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={state.flowers.length === 0}
            className="w-full mt-4 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      {/* Color Selection Modal */}
      {showFlowerModal && selectedFlowerType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-semibold mb-4">
              Choose color for {selectedFlowerType.name}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleColorSelect(color)}
                  className="p-3 border-2 border-gray-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition-all text-left"
                >
                  <div className="font-medium">{color.name}</div>
                  <div className="text-sm text-gray-600">
                    ${(selectedFlowerType.base_price + color.price_modifier).toFixed(2)}
                    {color.price_modifier > 0 && (
                      <span className="text-rose-600"> (+${color.price_modifier.toFixed(2)})</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowFlowerModal(false)
                setSelectedFlowerType(null)
              }}
              className="mt-4 w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
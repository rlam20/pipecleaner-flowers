'use client'

import { useState, useReducer } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image' // Import Image
import type { FlowerType } from '@/lib/types' // Import shared types

// Removed hardcoded FLOWER_MENU

const COLOR_MENU = [
  { id: 'PK1', name: 'Light Pink', hex: '#FEB6BC' },
  { id: 'PK2', name: 'Pink', hex: '#F2789F' },
  { id: 'PK3', name: 'Deep Pink', hex: '#CA4057' },
  { id: 'PK4', name: 'Peach Pink', hex: '#FC4A3C' },
  { id: 'RD1', name: 'Red', hex: '#BD0001' },
  { id: 'RD2', name: 'Dark Red', hex: '#8F0203' },
  { id: 'RD3', name: 'Burgundy', hex: '#500102' },
  { id: 'RD4', name: 'Deep Burgundy', hex: '#320510' },
]

// PK3 - #cb445c
// PK4 - #fd3b2c
// RD2 - #820102
// RD3 - #6c0002


type SelectedFlower = {
  id: string 
  flower_type_id: string // ADDED: To track the real DB ID
  flower_name: string
  color_name: string
  color_hex: string
  price: number
  quantity: number
}

type BuilderState = {
  flowers: SelectedFlower[]
  addons: { pocky: boolean; vase: boolean }
}

type BuilderAction =
  | { type: 'ADD_FLOWER'; payload: { flower_type_id: string; flower_name: string; color_name: string; color_hex: string; price: number; quantity: number } }
  | { type: 'REMOVE_FLOWER'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'TOGGLE_ADDON'; payload: 'pocky' | 'vase' }

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'ADD_FLOWER': {
      // Create a deterministic ID
      const id = `${action.payload.flower_name}_${action.payload.color_name}`.replace(/\s/g, '_')
      const existing = state.flowers.find(f => f.id === id)
      
      if (existing) {
        return {
          ...state,
          flowers: state.flowers.map(f =>
            f.id === id ? { ...f, quantity: f.quantity + action.payload.quantity } : f
          )
        }
      } else {
        return {
          ...state,
          flowers: [...state.flowers, { id, ...action.payload }]
        }
      }
    }
    case 'REMOVE_FLOWER':
      return { ...state, flowers: state.flowers.filter(f => f.id !== action.payload) }
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload
      if (quantity <= 0) {
        return { ...state, flowers: state.flowers.filter(f => f.id !== id) }
      }
      return {
        ...state,
        flowers: state.flowers.map(f => f.id === id ? { ...f, quantity } : f)
      }
    }
    case 'TOGGLE_ADDON':
      return { ...state, addons: { ...state.addons, [action.payload]: !state.addons[action.payload] } }
    default:
      return state
  }
}

// Add Props interface
type Props = {
  flowerTypes: FlowerType[]
}

export default function CustomBuilder({ flowerTypes }: Props) {
  const router = useRouter()
  const [state, dispatch] = useReducer(builderReducer, {
    flowers: [],
    addons: { pocky: false, vase: false }
  })

  const [showModal, setShowModal] = useState(false)
  const [activeType, setActiveType] = useState<FlowerType | null>(null) // Use FlowerType
  const [quantityInput, setQuantityInput] = useState('')

  const MIN_FLOWERS = 2
  const MAX_FLOWERS = 15
  const totalFlowers = state.flowers.reduce((sum, f) => sum + f.quantity, 0)
  const canCheckout = totalFlowers >= MIN_FLOWERS
  const canAddMore = totalFlowers < MAX_FLOWERS
  
  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') {
      setQuantityInput('')
      return
    }
    if (!/^\d+$/.test(value)) return
    const num = parseInt(value)
    const remaining = MAX_FLOWERS - totalFlowers
    const maxAllowed = Math.min(20, remaining)
    if (num > maxAllowed) {
      setQuantityInput(maxAllowed.toString())
    } else {
      setQuantityInput(value)
    }
  }

  const getQuantityValue = () => {
    if (quantityInput === '') return 1
    return parseInt(quantityInput) || 1
  }

  const handleCheckout = () => {
    if (!canCheckout) return
    const flowersTotal = state.flowers.reduce((s, f) => s + (f.price * f.quantity), 0)
    const total = flowersTotal + (state.addons.pocky ? 1.5 : 0) + (state.addons.vase ? 2 : 0)
    
    const params = new URLSearchParams({ 
      type: 'custom', 
      data: JSON.stringify({ 
        flowers: state.flowers.map(f => ({
          flower_type_id: f.flower_type_id, // Pass the real ID!
          flower_name: f.flower_name,
          color_name: f.color_name,
          price: f.price,
          quantity: f.quantity
        })),
        addons: state.addons,
        total_price: total 
      }) 
    })
    router.push(`/checkout?${params.toString()}`)
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 lg:p-10 grid lg:grid-cols-12 gap-10">
      
      {/* LEFT COLUMN: SELECTION */}
      <div className="lg:col-span-8 space-y-10">
        
        {/* Flower Grid */}
        <section className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-stone-800">Choose Your Flowers</h2>
            <div className="text-sm font-bold text-stone-600">
              {totalFlowers} / {MAX_FLOWERS} flowers
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {flowerTypes.map(f => (
              <button 
                key={f.id} 
                onClick={() => { setActiveType(f); setQuantityInput(''); setShowModal(true) }}
                disabled={!canAddMore}
                className="group flex items-center justify-between p-4 border-2 border-stone-100 rounded-2xl transition-all duration-200 
                  hover:shadow-lg hover:border-rose-400 hover:bg-rose-50 cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col text-left">
                  <span className="text-xl font-bold text-stone-800">{f.name}</span>
                  <span className="text-lg text-rose-600 font-semibold mt-1">${f.base_price.toFixed(2)}</span>
                </div>
                {/* NEW IMAGE RENDERING */}
                <div className="relative w-20 h-20 bg-stone-200 rounded-xl ml-4 shrink-0 overflow-hidden">
                   {f.image_url ? (
                      <Image 
                        src={`/flowers/${f.image_url}`}
                        alt={f.name}
                        fill
                        className="object-cover"
                      />
                   ) : (
                      <div className="flex items-center justify-center h-full text-4xl">🌸</div>
                   )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ... [Keep Add-ons Section] ... */}
        {/* <section className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="text-3xl font-bold mb-6 text-stone-800">Add-ons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => dispatch({ type: 'TOGGLE_ADDON', payload: 'pocky' })} 
              className={`flex items-center justify-between p-6 border-2 rounded-2xl text-left transition-all duration-200 
                hover:shadow-lg hover:border-rose-400 hover:bg-rose-50
                ${state.addons.pocky ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500' : 'border-stone-100'}`}
            >
              <div>
                <p className="text-xl font-bold text-stone-800">Strawberry Pocky</p>
                <p className="text-stone-500">(yum)</p>
              </div>
              <span className="text-xl text-rose-600 font-bold">+$1.50</span>
            </button>
            
            <button 
              onClick={() => dispatch({ type: 'TOGGLE_ADDON', payload: 'vase' })} 
              className={`flex items-center justify-between p-6 border-2 rounded-2xl text-left transition-all duration-200
                hover:shadow-lg hover:border-rose-400 hover:bg-rose-50
                ${state.addons.vase ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500' : 'border-stone-100'}`}
            >
              <div>
                <p className="text-xl font-bold text-stone-800">Glass Vase</p>
              </div>
              <span className="text-xl text-rose-600 font-bold">+$2.00</span>
            </button>
          </div>
        </section> */}

      </div>

      {/* RIGHT COLUMN: SUMMARY - mostly same, just updating props usage */}
      <aside className="lg:col-span-4">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xl sticky top-6">
          <h2 className="text-2xl font-bold mb-6 border-b pb-4">Your Bouquet</h2>
          
          <p className="text-xs text-stone-500 mb-6 italic">
            All bouquets come wrapped with paper and filled with extra paper for protection
          </p>
          <div className="h-[50vh] overflow-y-auto pr-2 mb-8">
            <div className="space-y-3">
              {state.flowers.length === 0 && (
                <p className="text-stone-400 text-lg italic text-center py-8">No flowers added yet.</p>
              )}
              
              {state.flowers.map(f => (
                <div key={f.id} className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md shrink-0" 
                      style={{ backgroundColor: f.color_hex }} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-stone-800 truncate">{f.flower_name}</div>
                      <div className="text-sm text-stone-500 truncate">{f.color_name}</div>
                      <div className="text-xs text-stone-400">${f.price.toFixed(2)} each</div>
                    </div>
                    <button 
                      onClick={() => dispatch({ type: 'REMOVE_FLOWER', payload: f.id })} 
                      className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Static Quantity Display */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-stone-600 font-medium">Qty:</label>
                    <span className="text-base font-bold text-stone-800">{f.quantity}</span>
                    <span className="text-base font-bold text-rose-600 ml-auto">
                      ${(f.price * f.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* ... [Keep warnings and totals] ... */}
          {!canCheckout && (
            <div className="mb-6 bg-amber-50 border border-amber-100 text-amber-800 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <span>⚠️</span>
              Please add at least {MIN_FLOWERS} flowers to checkout.
            </div>
          )}

          {!canAddMore && (
            <div className="mb-6 bg-orange-50 border border-orange-100 text-orange-800 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <span>📌</span>
              Maximum {MAX_FLOWERS} flowers reached.
            </div>
          )}

          <div className="pt-4 border-t border-stone-100 space-y-3">
            <div className="flex justify-between text-lg text-stone-600">
              <span>Add-ons</span>
              <span>${((state.addons.pocky ? 1.50 : 0) + (state.addons.vase ? 2.00 : 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-3xl font-black text-stone-900">
              <span>Total</span>
              <span className="text-rose-600">
                ${(state.flowers.reduce((s, f) => s + (f.price * f.quantity), 0) + (state.addons.pocky ? 1.5 : 0) + (state.addons.vase ? 2 : 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <button 
            onClick={handleCheckout} 
            disabled={!canCheckout} 
            className="w-full mt-6 py-4 bg-rose-600 text-white text-xl rounded-xl font-bold shadow-lg shadow-rose-200
              disabled:bg-stone-300 disabled:shadow-none disabled:cursor-not-allowed 
              hover:bg-rose-700 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Checkout
          </button>
        </div>
      </aside>

      {/* MODAL */}
      {showModal && activeType && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-8">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh]">
            
            {/* LEFT SIDE: Image - UPDATED TO USE DB IMAGE */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-rose-50 to-pink-50 p-4 md:p-8 flex items-center justify-center relative h-48 md:h-auto shrink-0">
              <div className="w-full h-full md:aspect-square bg-white/50 backdrop-blur rounded-2xl flex flex-col items-center justify-center shadow-inner overflow-hidden relative">
                 {activeType.image_url ? (
                    <Image 
                      src={`/flowers/${activeType.image_url}`}
                      alt={activeType.name}
                      fill
                      className="object-contain md:object-cover p-2 md:p-0"
                    />
                 ) : (
                    <>
                      <span className="text-6xl md:text-8xl mb-2 md:mb-4">🌸</span>
                      <span className="text-xl md:text-2xl font-bold text-stone-700">{activeType.name}</span>
                    </>
                 )}
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="md:hidden absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md font-bold text-stone-500 z-10"
              >
                ✕
              </button>
            </div>

            {/* RIGHT SIDE: Color Selection */}
            <div className="w-full md:w-1/2 p-5 md:p-12 flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-start mb-4 md:mb-6 shrink-0">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-stone-900">{activeType.name}</h3>
                  <p className="text-lg md:text-xl text-rose-600 font-bold mt-1 md:mt-2">${activeType.base_price.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="hidden md:flex w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 items-center justify-center text-stone-500 font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* ... [Keep Quantity Input] ... */}
              <div className="mb-4 md:mb-6 bg-rose-50 p-3 md:p-4 rounded-xl shrink-0">
                <label className="block text-sm font-bold text-stone-700 mb-1 md:mb-2">Quantity</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter quantity"
                  value={quantityInput}
                  onChange={handleQuantityInputChange}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border-2 border-rose-300 rounded-lg focus:border-rose-500 focus:outline-none font-bold text-lg text-center"
                />
            
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                <p className="text-stone-500 font-medium mb-3 md:mb-4 uppercase tracking-wide text-xs md:text-sm">Select a Color</p>
                <div className="grid grid-cols-2 gap-2 md:gap-4 pb-4">
                  {COLOR_MENU.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => { 
                        const qty = getQuantityValue()
                        if (totalFlowers + qty > MAX_FLOWERS) {
                          alert(`Only ${MAX_FLOWERS - totalFlowers} flowers remaining`)
                          return
                        }
                        dispatch({ 
                          type: 'ADD_FLOWER', 
                          payload: { 
                            flower_type_id: activeType.id, // PASS DB ID
                            flower_name: activeType.name, 
                            color_name: c.name, 
                            color_hex: c.hex, 
                            price: activeType.base_price, // Use base_price
                            quantity: qty
                          } 
                        })
                        setShowModal(false)
                        setQuantityInput('')
                      }} 
                      className="group flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border-2 border-transparent hover:border-rose-300 hover:bg-rose-50 transition-all text-left"
                    >
                      <div 
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform shrink-0" 
                        style={{ backgroundColor: c.hex }} 
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-stone-800 text-sm truncate">{c.name}</span>
                        <span className="text-[10px] md:text-xs text-stone-400 font-mono">{c.id}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
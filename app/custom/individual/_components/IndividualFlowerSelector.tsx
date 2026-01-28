'use client'

import { useState, useReducer } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { FlowerType } from '@/lib/types'


const COLOR_MENU = [
  { id: 'PK1', name: 'Light Pink', hex: '#FEB6BC' },
  { id: 'PK2', name: 'Pink', hex: '#F2789F' },
  { id: 'PK3', name: 'Deep Pink', hex: '#CA4057' },
  { id: 'PK4', name: 'Peach Pink', hex: '#FC4A3C' },
  { id: 'RD1', name: 'Red', hex: '#BD0001' },
  { id: 'RD2', name: 'Dark Red', hex: '#8F0203' },
  { id: 'RD3', name: 'Burgundy', hex: '#500102' },
  { id: 'RD4', name: 'Deep Burgundy', hex: '#330100' },
]

type SelectedItem = {
  id: string 
  flower_type_id: string
  flower_name: string
  color_name: string
  color_hex: string
  price: number
  quantity: number
}

type SelectorState = {
  items: SelectedItem[]
}

type SelectorAction =
  | { type: 'ADD_ITEM'; payload: { flower_type_id: string; flower_name: string; color_name: string; color_hex: string; price: number; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }

function selectorReducer(state: SelectorState, action: SelectorAction): SelectorState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const id = `${action.payload.flower_name}_${action.payload.color_name}`.replace(/\s/g, '_')
      const existing = state.items.find(f => f.id === id)
      
      if (existing) {
        return {
          ...state,
          items: state.items.map(f =>
            f.id === id ? { ...f, quantity: f.quantity + action.payload.quantity } : f
          )
        }
      } else {
        return {
          ...state,
          items: [...state.items, { id, ...action.payload }]
        }
      }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(f => f.id !== action.payload) }
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload
      if (quantity <= 0) {
        return { ...state, items: state.items.filter(f => f.id !== id) }
      }
      return {
        ...state,
        items: state.items.map(f => f.id === id ? { ...f, quantity } : f)
      }
    }
    default:
      return state
  }
}

interface Props {
  flowerTypes: FlowerType[]
  colorOptions: any[]
}

export default function IndividualFlowerSelector({ flowerTypes, colorOptions }: Props) {
  const router = useRouter()
  const [state, dispatch] = useReducer(selectorReducer, {
    items: []
  })

  const [showModal, setShowModal] = useState(false)
  const [activeType, setActiveType] = useState<FlowerType | null>(null)
  const [quantityInput, setQuantityInput] = useState('')

  // 1. Define Limit
  const MAX_FLOWERS = 15
  
  // 2. Calculate totals and check limits
  const totalItems = state.items.reduce((sum, f) => sum + f.quantity, 0)
  const canCheckout = totalItems > 0
  const canAddMore = totalItems < MAX_FLOWERS
  
  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') {
      setQuantityInput('')
      return
    }
    if (!/^\d+$/.test(value)) return
    
    const num = parseInt(value)
    
    // 3. Limit input to remaining allowance
    const remaining = MAX_FLOWERS - totalItems
    
    if (num > remaining) {
      setQuantityInput(remaining.toString())
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
    const total = state.items.reduce((s, f) => s + (f.price * f.quantity), 0)
    
    const params = new URLSearchParams({ 
      type: 'individual', 
      data: JSON.stringify({ 
        flowers: state.items.map(f => ({
          flower_type_id: f.flower_type_id,
          flower_name: f.flower_name,
          color_name: f.color_name,
          price: f.price,
          quantity: f.quantity
        })),
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
            <h2 className="text-3xl font-bold text-stone-800">Select Flowers</h2>
            <div className="text-sm font-bold text-stone-600">
              {/* 4. Update header display */}
              {totalItems} / {MAX_FLOWERS} items in cart
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {flowerTypes.map(f => (
              <button 
                key={f.id} 
                onClick={() => { setActiveType(f); setQuantityInput(''); setShowModal(true) }}
                // 5. Disable adding when limit reached
                disabled={!canAddMore}
                className="group flex items-center justify-between p-4 border-2 border-stone-100 rounded-2xl transition-all duration-200 
                  hover:shadow-lg hover:border-rose-400 hover:bg-rose-50 cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col text-left">
                  <span className="text-xl font-bold text-stone-800">{f.name}</span>
                  <span className="text-lg text-rose-600 font-semibold mt-1">${f.base_price.toFixed(2)}</span>
                </div>
                
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

      </div>

      {/* RIGHT COLUMN: SUMMARY */}
      <aside className="lg:col-span-4">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xl sticky top-6">
          <h2 className="text-2xl font-bold mb-6 border-b pb-4">Your Order</h2>
          
          <div className="h-[50vh] overflow-y-auto pr-2 mb-8">
            <div className="space-y-3">
              {state.items.length === 0 && (
                <p className="text-stone-400 text-lg italic text-center py-8">No flowers added yet.</p>
              )}
              
              {state.items.map(f => (
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
                      onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: f.id })} 
                      className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                  
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
          
          {/* 6. Add warning for max flowers */}
          {!canAddMore && (
            <div className="mb-6 bg-orange-50 border border-orange-100 text-orange-800 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <span>📌</span>
              Maximum {MAX_FLOWERS} flowers reached.
            </div>
          )}

          <div className="pt-4 border-t border-stone-100 space-y-3">
            <div className="flex justify-between text-3xl font-black text-stone-900">
              <span>Total</span>
              <span className="text-rose-600">
                ${state.items.reduce((s, f) => s + (f.price * f.quantity), 0).toFixed(2)}
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
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-8">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* LEFT SIDE: Image */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-rose-50 to-pink-50 p-8 flex items-center justify-center relative">
              <div className="w-full aspect-square bg-white/50 backdrop-blur rounded-2xl flex flex-col items-center justify-center shadow-inner overflow-hidden relative">
                 {activeType.image_url ? (
                    <Image 
                      src={`/flowers/${activeType.image_url}`}
                      alt={activeType.name}
                      fill
                      className="object-cover"
                    />
                 ) : (
                    <>
                      <span className="text-8xl mb-4">🌸</span>
                      <span className="text-2xl font-bold text-stone-700">{activeType.name}</span>
                    </>
                 )}
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="md:hidden absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md font-bold text-stone-500"
              >
                ✕
              </button>
            </div>

            {/* RIGHT SIDE: Color Selection */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-black text-stone-900">{activeType.name}</h3>
                  <p className="text-xl text-rose-600 font-bold mt-2">${activeType.base_price.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="hidden md:flex w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 items-center justify-center text-stone-500 font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6 bg-rose-50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-stone-700 mb-2">Quantity</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter quantity"
                  value={quantityInput}
                  onChange={handleQuantityInputChange}
                  className="w-full px-4 py-3 border-2 border-rose-300 rounded-lg focus:border-rose-500 focus:outline-none font-bold text-lg text-center"
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                <p className="text-stone-500 font-medium mb-4 uppercase tracking-wide text-sm">Select a Color</p>
                <div className="grid grid-cols-2 gap-4">
                  {COLOR_MENU.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => { 
                        const qty = getQuantityValue()
                        // 7. Prevent adding if exceeds limit
                        if (totalItems + qty > MAX_FLOWERS) {
                          alert(`Only ${MAX_FLOWERS - totalItems} flowers remaining`)
                          return
                        }
                        
                        dispatch({ 
                          type: 'ADD_ITEM', 
                          payload: { 
                            flower_type_id: activeType.id,
                            flower_name: activeType.name, 
                            color_name: c.name, 
                            color_hex: c.hex, 
                            price: activeType.base_price, 
                            quantity: qty
                          } 
                        })
                        setShowModal(false)
                        setQuantityInput('')
                      }} 
                      className="group flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:border-rose-300 hover:bg-rose-50 transition-all text-left"
                    >
                      <div 
                        className="w-10 h-10 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform shrink-0" 
                        style={{ backgroundColor: c.hex }} 
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-stone-800 text-sm truncate">{c.name}</span>
                        <span className="text-xs text-stone-400 font-mono">{c.id}</span>
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
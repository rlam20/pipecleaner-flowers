'use client'

import { useState, useReducer } from 'react'
import { useRouter } from 'next/navigation'

// Flower Menu
const FLOWER_MENU = [
  { id: 'lily_small', name: 'Lily (Small)', price: 5.00 },
  { id: 'lily_large', name: 'Lily (Large)', price: 7.00 },
  { id: 'rose', name: 'Rose', price: 6.00 },
  { id: 'stargazer_small', name: 'Stargazer Lily (Small)', price: 6.00 },
  { id: 'stargazer_large', name: 'Stargazer Lily (Large)', price: 8.00 },
  { id: 'lavender', name: 'Lavender', price: 5.00 },
  { id: 'hibiscus', name: 'Hibiscus', price: 7.00 },
  { id: 'dahlia', name: 'Dahlia', price: 7.00 },
  { id: 'laceleaf', name: 'Laceleaf', price: 6.00 },
]

const COLOR_MENU = [
  { id: 'PK1', name: 'Light Pink', hex: '#FFC0CB' },
  { id: 'PK2', name: 'Pink', hex: '#FF69B4' },
  { id: 'PK3', name: 'Deep Pink', hex: '#C71585' },
  { id: 'PK4', name: 'Peach Pink', hex: '#FF7F50' },
  { id: 'RD1', name: 'Red', hex: '#FF0000' },
  { id: 'RD2', name: 'Dark Red', hex: '#8B0000' },
  { id: 'RD3', name: 'Burgundy', hex: '#800020' },
  { id: 'RD4', name: 'Deep Burgundy', hex: '#4A0404' },
]

type SelectedFlower = {
  id: string
  flower_name: string
  color_name: string
  color_hex: string
  price: number
}

type BuilderState = {
  flowers: SelectedFlower[]
  addons: { pocky: boolean; vase: boolean }
}

type BuilderAction =
  | { type: 'ADD_FLOWER'; payload: SelectedFlower }
  | { type: 'REMOVE_FLOWER'; payload: string }
  | { type: 'TOGGLE_ADDON'; payload: 'pocky' | 'vase' }

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'ADD_FLOWER':
      return { ...state, flowers: [...state.flowers, action.payload] }
    case 'REMOVE_FLOWER':
      return { ...state, flowers: state.flowers.filter(f => f.id !== action.payload) }
    case 'TOGGLE_ADDON':
      return { ...state, addons: { ...state.addons, [action.payload]: !state.addons[action.payload] } }
    default:
      return state
  }
}

export default function CustomBuilder() {
  const router = useRouter()
  const [state, dispatch] = useReducer(builderReducer, {
    flowers: [],
    addons: { pocky: false, vase: false }
  })

  const [showModal, setShowModal] = useState(false)
  const [activeType, setActiveType] = useState<typeof FLOWER_MENU[0] | null>(null)

  const MIN_FLOWERS = 2
  const flowerCount = state.flowers.length
  const canCheckout = flowerCount >= MIN_FLOWERS

  const handleCheckout = () => {
    if (!canCheckout) return
    const total = state.flowers.reduce((s, f) => s + f.price, 0) + (state.addons.pocky ? 1.5 : 0) + (state.addons.vase ? 2 : 0)
    const params = new URLSearchParams({ type: 'custom', data: JSON.stringify({ ...state, total_price: total }) })
    router.push(`/checkout?${params.toString()}`)
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 lg:p-10 grid lg:grid-cols-12 gap-10">
      
      {/* LEFT COLUMN: SELECTION (Takes up 8/12 columns) */}
      <div className="lg:col-span-8 space-y-10">
        
        {/* Flower Grid */}
        <section className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="text-3xl font-bold mb-6 text-stone-800">Choose Your Flowers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {FLOWER_MENU.map(f => (
              <button 
                key={f.id} 
                onClick={() => { setActiveType(f); setShowModal(true) }} 
                className="group flex items-center justify-between p-6 border-2 border-stone-100 rounded-2xl transition-all duration-200 
                  hover:shadow-lg hover:border-rose-400 hover:bg-rose-50 cursor-pointer"
              >
                <div className="flex flex-col text-left">
                  <span className="text-xl font-bold text-stone-800">{f.name}</span>
                  <span className="text-lg text-rose-600 font-semibold mt-1">${f.price.toFixed(2)}</span>
                </div>
                {/* Placeholder Image on Card */}
                <div className="w-20 h-20 bg-stone-200 rounded-xl ml-4 shrink-0 flex items-center justify-center text-stone-400 font-bold shadow-inner">
                  IMG
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Add-ons Grid */}
        <section className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
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
        </section>
      </div>

      {/* RIGHT COLUMN: SUMMARY (Takes up 4/12 columns) */}
      <aside className="lg:col-span-4">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xl sticky top-6">
          <h2 className="text-2xl font-bold mb-6 border-b pb-4">Your Bouquet</h2>
          
          <div className="space-y-4 mb-8 max-h-[60vh] overflow-y-auto pr-2">
            {state.flowers.length === 0 && (
               <p className="text-stone-400 text-lg italic text-center py-8">No flowers added yet.</p>
            )}
            
            {state.flowers.map(f => (
              <div key={f.id} className="flex items-center gap-4 p-3 bg-stone-50 rounded-xl group border border-transparent hover:border-stone-200 transition-all">
                <div className="w-6 h-6 rounded-full border border-stone-200 shadow-sm shrink-0" style={{ backgroundColor: f.color_hex }} />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-stone-800 truncate">{f.flower_name}</div>
                  <div className="text-sm text-stone-500 truncate">{f.color_name}</div>
                </div>
                <span className="text-base font-bold text-rose-600">${f.price.toFixed(2)}</span>
                <button 
                  onClick={() => dispatch({ type: 'REMOVE_FLOWER', payload: f.id })} 
                  className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          {!canCheckout && (
            <div className="mb-6 bg-amber-50 border border-amber-100 text-amber-800 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <span>⚠️</span>
              Please add at least {MIN_FLOWERS} flowers to checkout.
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
                  ${(state.flowers.reduce((s, f) => s + f.price, 0) + (state.addons.pocky ? 1.5 : 0) + (state.addons.vase ? 2 : 0)).toFixed(2)}
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

      {/* BIG MODAL */}
      {showModal && activeType && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-8">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row max-h-[90vh]">
            
            {/* LEFT SIDE: Big Image Preview */}
            <div className="w-full md:w-1/2 bg-stone-100 p-8 flex items-center justify-center relative">
               {/* This is the big placeholder image */}
               <div className="w-full aspect-square bg-stone-200 rounded-2xl flex items-center justify-center shadow-inner">
                  <span className="text-4xl font-bold text-stone-300">IMAGE OF {activeType.name.toUpperCase()}</span>
               </div>
               {/* Mobile close button */}
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
                  <p className="text-xl text-rose-600 font-bold mt-2">${activeType.price.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="hidden md:flex w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 items-center justify-center text-stone-500 font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <p className="text-stone-500 font-medium mb-4 uppercase tracking-wide text-sm">Select a Color</p>
                <div className="grid grid-cols-2 gap-4">
                  {COLOR_MENU.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => { 
                        dispatch({ 
                          type: 'ADD_FLOWER', 
                          payload: { 
                            id: Math.random().toString(), 
                            flower_name: activeType.name, 
                            color_name: c.name, 
                            color_hex: c.hex, 
                            price: activeType.price 
                          } 
                        }); 
                        setShowModal(false); 
                      }} 
                      className="group flex items-center gap-4 p-3 rounded-xl border-2 border-transparent hover:border-stone-200 hover:bg-stone-50 transition-all text-left"
                    >
                      <div 
                        className="w-12 h-12 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform" 
                        style={{ backgroundColor: c.hex }} 
                      />
                      <div>
                        <span className="block font-bold text-stone-800">{c.name}</span>
                        <span className="text-xs text-stone-400 font-mono">{c.id}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100">
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 text-stone-400 font-bold hover:text-stone-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
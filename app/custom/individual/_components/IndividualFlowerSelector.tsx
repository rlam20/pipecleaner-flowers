'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FlowerType, ColorOption } from '@/lib/types'
import Image from 'next/image'

type CartItem = {
  id: string
  flower_type_id: string
  flower_name: string
  color_id: string
  color_name: string
  price: number
  quantity: number
}

type Props = {
  flowerTypes: FlowerType[]
  colorOptions: ColorOption[]
}

export default function IndividualFlowerSelector({ flowerTypes, colorOptions }: Props) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedFlower, setSelectedFlower] = useState<FlowerType | null>(null)
  const [showColorModal, setShowColorModal] = useState(false)

  const handleFlowerClick = (flower: FlowerType) => {
    setSelectedFlower(flower)
    setShowColorModal(true)
  }

  const handleColorSelect = (color: ColorOption) => {
    if (!selectedFlower) return

    const price = selectedFlower.base_price + color.price_modifier
    
    // Check if this exact combo already exists in cart
    const existingIndex = cart.findIndex(
      item => item.flower_type_id === selectedFlower.id && item.color_id === color.id
    )

    if (existingIndex >= 0) {
      // Increment quantity
      const newCart = [...cart]
      newCart[existingIndex].quantity += 1
      setCart(newCart)
    } else {
      // Add new item
      const newItem: CartItem = {
id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,        flower_type_id: selectedFlower.id,
        flower_name: selectedFlower.name,
        color_id: color.id,
        color_name: color.name,
        price: price,
        quantity: 1
      }
      setCart([...cart, newItem])
    }

    setShowColorModal(false)
    setSelectedFlower(null)
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId))
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ))
    }
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Please add at least one flower to your order')
      return
    }

    const orderData = {
      flowers: cart.map(item => ({
        flower_type_id: item.flower_type_id,
        flower_name: item.flower_name,
        color_id: item.color_id,
        color_name: item.color_name,
        price: item.price,
        quantity: item.quantity
      })),
      total_price: calculateTotal()
    }

    const params = new URLSearchParams({
      type: 'individual',
      data: JSON.stringify(orderData)
    })

    router.push(`/checkout?${params.toString()}`)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left: Flower Selection */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">Select Flowers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {flowerTypes.map((flower) => (
              <button
                key={flower.id}
                onClick={() => handleFlowerClick(flower)}
                className="group p-6 border-2 border-gray-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition-all text-center"
              >
                <div className="text-4xl mb-3">🌸</div>
                <div className="font-semibold text-gray-900 mb-1">{flower.name}</div>
                <div className="text-sm text-gray-600">from ${flower.base_price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div>
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
          <h2 className="text-2xl font-semibold mb-4">Your Order</h2>
          
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No flowers added yet</p>
          ) : (
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.flower_name}</div>
                    <div className="text-xs text-gray-600">{item.color_name}</div>
                    <div className="text-xs text-gray-500">${item.price.toFixed(2)} each</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="text-sm font-semibold text-gray-700">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-rose-600">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      {/* Color Modal */}
      {showColorModal && selectedFlower && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-semibold mb-4">
              Choose color for {selectedFlower.name}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleColorSelect(color)}
                  className="p-3 border-2 border-gray-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition-all text-left"
                >
                  <div className="font-medium">{color.name}</div>
                  <div className="text-sm text-gray-600">
                    ${(selectedFlower.base_price + color.price_modifier).toFixed(2)}
                    {color.price_modifier > 0 && (
                      <span className="text-rose-600"> (+${color.price_modifier.toFixed(2)})</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowColorModal(false)
                setSelectedFlower(null)
              }}
              className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
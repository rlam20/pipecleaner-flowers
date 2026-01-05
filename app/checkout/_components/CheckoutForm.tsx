'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createOrder } from '@/lib/actions/orders'
type Props = {
  orderData: any
}

export default function CheckoutForm({ orderData }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    recipient_name: '',
    notes: ''
  })

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!formData.customer_name || !formData.customer_phone) {
    alert('Please fill in your name and phone number')
    return
  }

  setLoading(true)

  try {
    // Prepare order input based on type
    const orderInput: any = {
      order_type: orderData.type,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      customer_email: formData.customer_email || undefined,
      recipient_name: formData.recipient_name || undefined,
      notes: formData.notes || undefined,
      total_price: getTotal()
    }

    if (orderData.type === 'bundle') {
      orderInput.preset_bundle_id = orderData.bundleId
      orderInput.selected_theme = orderData.theme
    } else {
      orderInput.custom_bouquet = {
        flowers: orderData.flowers,
        addons: orderData.addons || {},
        total_price: orderData.total_price
      }
    }

    const result = await createOrder(orderInput)

    if (!result.success) {
      alert(result.error || 'Failed to place order')
      setLoading(false)
      return
    }

    router.push(`/confirmation/${result.order_number}`)
  } catch (error) {
    console.error('Order failed:', error)
    alert('Failed to place order. Please try again.')
    setLoading(false)
  }
}

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Calculate total based on order type
  const getTotal = () => {
    if (orderData.type === 'bundle') {
      return orderData.price
    } else if (orderData.type === 'custom') {
      return orderData.total_price
    } else if (orderData.type === 'individual') {
      return orderData.total_price
    }
    return 0
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-rose-600 hover:text-rose-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-rose-900 mb-2">
            Checkout
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Your Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="customer_name"
                      name="customer_name"
                      required
                      value={formData.customer_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="customer_phone"
                      name="customer_phone"
                      required
                      value={formData.customer_phone}
                      onChange={handleChange}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      id="customer_email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">Delivery Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="recipient_name"
                      name="recipient_name"
                      value={formData.recipient_name}
                      onChange={handleChange}
                      placeholder="Leave blank if for yourself"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any special requests or delivery instructions..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-rose-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="venmo_acknowledgment"
                    required
                    className="mt-1 w-5 h-5 text-rose-600 rounded"
                  />
                  <label htmlFor="venmo_acknowledgment" className="text-sm text-gray-700">
                    I understand that payment is required via Venmo before my order will be started. 
                    I will receive order details and payment instructions after submitting this form.
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
              
              {orderData.type === 'bundle' && (
                <div className="space-y-3 mb-4">
                  <div className="pb-3 border-b">
                    <div className="font-semibold text-lg">{orderData.bundleName}</div>
                    <div className="text-sm text-gray-600 mt-1">{orderData.theme}</div>
                  </div>
                </div>
              )}

              {orderData.type === 'custom' && (
                <div className="space-y-2 mb-4">
                  <div className="font-medium mb-2">Custom Bouquet:</div>
                  {orderData.flowers.map((flower: any, index: number) => (
                    <div key={index} className="text-sm flex justify-between">
                      <span>{flower.flower_name} ({flower.color_name})</span>
                      <span>${flower.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {orderData.addons.wrapped && (
                    <div className="text-sm flex justify-between pt-2 border-t">
                      <span>Gift wrapping</span>
                      <span>$2.00</span>
                    </div>
                  )}
                </div>
              )}

              {orderData.type === 'individual' && (
                <div className="space-y-2 mb-4">
                  <div className="font-medium mb-2">Individual Flowers:</div>
                  {orderData.flowers.map((flower: any, index: number) => (
                    <div key={index} className="text-sm flex justify-between">
                      <span>{flower.quantity}x {flower.flower_name} ({flower.color_name})</span>
                      <span>${(flower.price * flower.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total</span>
                  <span className="text-rose-600">${getTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium mb-2">Payment Information:</p>
                <p>After placing your order, you'll receive Venmo payment instructions. Your order will begin once payment is confirmed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
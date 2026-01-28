'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createOrder } from '@/lib/actions/orders'
import { FulfillmentMethod, OrderAddons } from '@/lib/types'
import { isValidEmail, isValidPhoneOrInstagram } from '@/lib/utils'
import FulfillmentMethodSelector from './FulfillmentMethodSelector'
import PickupForm from './PickupForm'
import DeliveryForm from './DeliveryForm'
import AddonsSelector from './AddonsSelector'
import AcknowledgmentCheckboxes from './AcknowledgmentCheckboxes'

type Props = {
  orderData: any
}

export default function CheckoutForm({ orderData }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    customer_phone: '',
    customer_email: ''
  })
  
  // Customer info
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    recipient_name: '',
    notes: ''
  })

  // Fulfillment method
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod | null>(null)

  // Pickup details
  const [pickupName, setPickupName] = useState('')
  const [pickupDate, setPickupDate] = useState<Date | null>(null)
  const [pickupLocation, setPickupLocation] = useState('')
  const [pickupInstructions, setPickupInstructions] = useState('')

  // Delivery details
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [addressInstructions, setAddressInstructions] = useState('') // <--- FIXED: Added missing state
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null)
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [onGroundsHousing, setOnGroundsHousing] = useState(false)

  // Add-ons
  const [addons, setAddons] = useState<OrderAddons>({
    pocky: false,
    vase: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    if (name === 'customer_phone') {
      if (value && !isValidPhoneOrInstagram(value)) {
        setErrors(prev => ({ ...prev, customer_phone: 'Enter a valid phone number or Instagram handle' }))
      } else {
        setErrors(prev => ({ ...prev, customer_phone: '' }))
      }
    }

    if (name === 'customer_email') {
      if (value && !isValidEmail(value)) {
        setErrors(prev => ({ ...prev, customer_email: 'Enter a valid email address' }))
      } else {
        setErrors(prev => ({ ...prev, customer_email: '' }))
      }
    }
  }

  const handlePickupChange = (field: string, value: any) => {
    switch (field) {
      case 'pickupName': setPickupName(value); break
      case 'pickupDate': setPickupDate(value); break
      case 'pickupLocation': setPickupLocation(value); break
      case 'pickupInstructions': setPickupInstructions(value); break
    }
  }

  const handleDeliveryChange = (field: string, value: any) => {
    switch (field) {
      case 'deliveryAddress': setDeliveryAddress(value); break
      case 'addressInstructions': setAddressInstructions(value); break // <--- FIXED: Uses the state setter now
      case 'deliveryDate': setDeliveryDate(value); break
      case 'deliveryInstructions': setDeliveryInstructions(value); break
      case 'onGroundsHousing': setOnGroundsHousing(value); break
    }
  }

  const handleAddonChange = (field: keyof OrderAddons, value: boolean) => {
    setAddons({ ...addons, [field]: value })
  }

  const getSubtotal = () => {
    if (orderData.type === 'bundle') {
      return orderData.price
    } else if (orderData.type === 'custom' || orderData.type === 'individual') {
      return orderData.total_price
    }
    return 0
  }

  const calculateDeliveryFee = () => {
    if (fulfillmentMethod !== 'delivery') return 0
    const subtotal = getSubtotal()
    return subtotal >= 25 ? 0 : 2.99
  }

  const calculateTotal = () => {
    let total = getSubtotal()
    if (addons.pocky) total += 1.50
    if (addons.vase) total += 2.00
    total += calculateDeliveryFee()
    return total
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customer_name || !formData.customer_phone) {
      alert('Please fill in your name and phone number')
      return
    }

    if (!isValidPhoneOrInstagram(formData.customer_phone)) {
      alert('Please enter a valid phone number or Instagram handle')
      return
    }

    if (fulfillmentMethod === 'pickup') {
      if (!pickupName || !pickupDate || !pickupLocation) {
        alert('Please complete all pickup details')
        return
      }
    } else if (fulfillmentMethod === 'delivery') {
      if (!deliveryAddress || !deliveryDate) {
        alert('Please complete all delivery details')
        return
      }
    } else {
        alert('Please select pickup or delivery')
        return
    }

    setLoading(true)

    try {
      const orderInput: any = {
        order_type: orderData.type,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || undefined,
        recipient_name: formData.recipient_name || undefined,
        notes: formData.notes || undefined,
        
        fulfillment_method: fulfillmentMethod,
        fulfillment_date: fulfillmentMethod === 'pickup' 
          ? pickupDate?.toISOString().split('T')[0]
          : deliveryDate?.toISOString().split('T')[0],
        
        addon_pocky: addons.pocky,
        addon_vase: addons.vase,
        
        delivery_fee: calculateDeliveryFee(),
        total_price: calculateTotal()
      }

      if (fulfillmentMethod === 'pickup') {
        orderInput.pickup_name = pickupName
        orderInput.pickup_location = pickupLocation
        orderInput.pickup_instructions = pickupInstructions || undefined
      }

      if (fulfillmentMethod === 'delivery') {
        // Combine address and apt/suite
        const fullAddress = addressInstructions 
            ? `${deliveryAddress}, ${addressInstructions}` 
            : deliveryAddress

        orderInput.delivery_address = fullAddress
        orderInput.delivery_instructions = deliveryInstructions || undefined
        orderInput.on_grounds_housing = onGroundsHousing
      }

      if (orderData.type === 'bundle') {
        orderInput.preset_bundle_id = orderData.bundleId
        orderInput.selected_theme = orderData.theme
      } else {
        orderInput.custom_bouquet = {
          flowers: orderData.flowers,
          addons: { pocky: addons.pocky, vase: addons.vase },
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

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-rose-600 hover:text-rose-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-rose-900 mb-2">
            Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Your Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    required
                    maxLength={50}
                    value={formData.customer_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number / Instagram Handle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customer_phone"
                    name="customer_phone"
                    required
                    value={formData.customer_phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567 or @yourhandle"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                      errors.customer_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.customer_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.customer_phone}</p>
                  )}
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                      errors.customer_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.customer_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.customer_email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Fulfillment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <FulfillmentMethodSelector
                selected={fulfillmentMethod}
                onSelect={setFulfillmentMethod}
                subtotal={getSubtotal()}
              />
            </div>

            {/* Conditional: Pickup or Delivery Form */}
            {fulfillmentMethod && (
              <div className="bg-white rounded-lg shadow-md p-6">
                {fulfillmentMethod === 'pickup' ? (
                  <PickupForm
                    pickupName={pickupName}
                    pickupDate={pickupDate}
                    pickupLocation={pickupLocation}
                    pickupInstructions={pickupInstructions}
                    onChange={handlePickupChange}
                    orderType={orderData.type}
                  />
                ) : (
                  <DeliveryForm
                    deliveryAddress={deliveryAddress}
                    deliveryDate={deliveryDate}
                    deliveryInstructions={deliveryInstructions}
                    addressInstructions={addressInstructions} // <--- FIXED: Now passes correct state
                    onGroundsHousing={onGroundsHousing}
                    onChange={handleDeliveryChange}
                    orderType={orderData.type}
                  />
                )}
              </div>
            )}

            {/* Add-ons */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <AddonsSelector addons={addons} onChange={handleAddonChange} />
            </div>

            {/* Acknowledgments */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <AcknowledgmentCheckboxes />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
              
              {/* Bundle Summary */}
              {orderData.type === 'bundle' && (
                <div className="space-y-3 mb-4">
                  <div className="pb-3 border-b">
                    <div className="font-semibold text-lg">{orderData.bundleName}</div>
                    <div className="text-sm text-gray-600 mt-1">{orderData.theme}</div>
                    <div className="text-sm text-gray-900 mt-2">${orderData.price.toFixed(2)}</div>
                  </div>
                </div>
              )}

               {/* Custom Summary */}
              {orderData.type === 'custom' && (
                <div className="space-y-2 mb-4 pb-4 border-b">
                  <div className="font-medium mb-2">Custom Bouquet:</div>
                  {orderData.flowers.map((flower: any, index: number) => (
                    <div key={index} className="text-sm flex justify-between">
                      <span>{flower.flower_name} ({flower.color_name})</span>
                      <span>${flower.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Individual Summary */}
              {orderData.type === 'individual' && (
                <div className="space-y-2 mb-4 pb-4 border-b">
                  <div className="font-medium mb-2">Individual Flowers:</div>
                  {orderData.flowers.map((flower: any, index: number) => (
                    <div key={index} className="text-sm flex justify-between">
                      <span>{flower.quantity}x {flower.flower_name} ({flower.color_name})</span>
                      <span>${(flower.price * flower.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add-ons breakdown */}
              {(addons.pocky || addons.vase) && (
                <div className="space-y-2 mb-4 pb-4 border-b text-sm">
                  {addons.pocky && (
                    <div className="flex justify-between">
                      <span>Strawberry Pocky</span>
                      <span>$1.50</span>
                    </div>
                  )}
                  {addons.vase && (
                    <div className="flex justify-between">
                      <span>Glass vase</span>
                      <span>$2.00</span>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery fee */}
              {fulfillmentMethod === 'delivery' && (
                <div className="mb-4 pb-4 border-b text-sm">
                  <div className="flex justify-between">
                    <span>Delivery fee</span>
                    <span className={calculateDeliveryFee() === 0 ? 'text-green-600 font-semibold' : ''}>
                      {calculateDeliveryFee() === 0 ? 'FREE' : `$${calculateDeliveryFee().toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 mb-4">
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total</span>
                  <span className="text-rose-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium mb-2">What happens next:</p>
                <p>@fauxlowers.byjz will reach out via Instagram DM to confirm your date/time and send Venmo payment details.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
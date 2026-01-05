'use client'

import DatePickerField from './DatePickerField'

type Props = {
  deliveryAddress: string
  deliveryDate: Date | null
  deliveryInstructions: string
  onGroundsHousing: boolean
  onChange: (field: string, value: any) => void
  orderType: 'bundle' | 'custom' | 'individual'
}

export default function DeliveryForm({ 
  deliveryAddress,
  deliveryDate,
  deliveryInstructions,
  onGroundsHousing,
  onChange,
  orderType
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Delivery Information</h3>
      <p className="text-sm text-gray-600">Straight to your door -- convenient and affordable!</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Address <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Please enter your FULL address, including name of complex if applicable.
          <br />
          Example: Crossroads, 2111 Jefferson Park Avenue, Apt. ____
        </p>
        <textarea
          rows={3}
          required
          value={deliveryAddress}
          onChange={(e) => onChange('deliveryAddress', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          placeholder="Full delivery address..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Disclaimer: This information will not be shared and will only be used for delivery purposes.
        </p>
      </div>

      <DatePickerField
        label="Delivery Date"
        selected={deliveryDate}
        onChange={(date) => onChange('deliveryDate', date)}
        orderType={orderType}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Special Delivery Instructions
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Example: "Leave at front porch" or "Ring the doorbell twice."
        </p>
        <textarea
          rows={3}
          value={deliveryInstructions}
          onChange={(e) => onChange('deliveryInstructions', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          placeholder="Delivery instructions..."
        />
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={onGroundsHousing}
            onChange={(e) => onChange('onGroundsHousing', e.target.checked)}
            className="mt-1 w-5 h-5 text-rose-600 rounded"
          />
          <span className="text-sm text-gray-700">
            I live in On-Grounds Housing
          </span>
        </label>
        {onGroundsHousing && (
          <p className="text-xs text-gray-600 mt-2 ml-8">
            ⚠️ You MUST be home at the time of delivery, so I can make sure your flowers get to YOU.
          </p>
        )}
      </div>

      <div className="bg-rose-50 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            required
            className="mt-1 w-5 h-5 text-rose-600 rounded"
          />
          <span className="text-sm text-gray-700">
            I acknowledge that @fauxlowers.byjz will reach out to me to confirm my delivery date and time, 
            as well as communicate with me during the time of the delivery. Cancel at least 24 hours before 
            designated appointment time. Failure to deliver more than once will result in forfeiture of 
            the items and a partial refund. <span className="text-red-500">*</span>
          </span>
        </label>
      </div>
    </div>
  )
}
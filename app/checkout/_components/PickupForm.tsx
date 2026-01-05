'use client'

import DatePickerField from './DatePickerField'

type Props = {
  pickupName: string
  pickupDate: Date | null
  pickupLocation: string
  pickupInstructions: string
  onChange: (field: string, value: any) => void
  orderType: 'bundle' | 'custom' | 'individual'
}

export default function PickupForm({ 
  pickupName, 
  pickupDate, 
  pickupLocation, 
  pickupInstructions,
  onChange,
  orderType
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Pick-Up Details</h3>
      <p className="text-sm text-gray-600">Straight into your hands -- no funny business here!</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pickup Name <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">Who should we ask for AT pickup?</p>
        <input
          type="text"
          required
          value={pickupName}
          onChange={(e) => onChange('pickupName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          placeholder="Name for pickup"
        />
      </div>

      <DatePickerField
        label="Pickup Date"
        selected={pickupDate}
        onChange={(date) => onChange('pickupDate', date)}
        orderType={orderType}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pick-Up Location <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={pickupLocation}
          onChange={(e) => onChange('pickupLocation', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        >
          <option value="">Select a location</option>
          <option value="Rice Hall">Rice Hall</option>
          <option value="Clemons Library">Clemons Library</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Special Instructions
        </label>
        <p className="text-xs text-gray-500 mb-2">Example: "Call when you arrive," "Will arrive in red car"</p>
        <textarea
          rows={3}
          value={pickupInstructions}
          onChange={(e) => onChange('pickupInstructions', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          placeholder="Any special instructions..."
        />
      </div>

      <div className="bg-rose-50 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            required
            className="mt-1 w-5 h-5 text-rose-600 rounded"
          />
          <span className="text-sm text-gray-700">
            I acknowledge that @fauxlowers.byjz will reach out to me to confirm my pick-up date and time, 
            as well as communicate with me during the time of delivery. Cancel at least 24 hours before 
            designated appointment time. Failure to deliver more than once will result in forfeiture of 
            the items and a partial refund. <span className="text-red-500">*</span>
          </span>
        </label>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type Props = {
  label: string
  selected: Date | null
  onChange: (date: Date | null) => void
  minDays?: number
  orderType: 'bundle' | 'custom' | 'individual'
}

export default function DatePickerField({ label, selected, onChange, minDays = 2, orderType }: Props) {
  const getMinDate = () => {
    const date = new Date()
    
    // Determine minimum days based on order type
    let minDaysRequired = 2
    if (orderType === 'custom' || orderType === 'individual') {
      minDaysRequired = 2 // 48 hours minimum
    } else if (orderType === 'bundle') {
      minDaysRequired = 3 // 3-5 days for large bouquets
    }
    
    date.setDate(date.getDate() + minDaysRequired)
    return date
  }

  const getLeadTimeMessage = () => {
    if (orderType === 'individual') {
      return 'Please allow AT LEAST 48–72 hours for individual/small bouquets.'
    } else if (orderType === 'custom') {
      return 'Please allow AT LEAST 48–72 hours for small bouquets and 3–5 days for large bouquets.'
    } else {
      return 'Please allow AT LEAST 3–5 days for large bouquets.'
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
        <p className="text-xs text-yellow-800">
          ⚠️ {getLeadTimeMessage()} Orders are best placed one week in advance. 
          Orders are completed in the order they're received.
        </p>
      </div>
      <DatePicker
        selected={selected}
        onChange={onChange}
        minDate={getMinDate()}
        dateFormat="MMMM d, yyyy"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        placeholderText="Select a date"
        required
      />
    </div>
  )
}
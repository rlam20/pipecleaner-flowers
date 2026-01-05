'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import CheckoutForm from './_components/CheckoutForm'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const orderType = searchParams.get('type') // 'bundle', 'custom', or 'individual'

  // Parse order data based on type
  let orderData: any = {}

  if (orderType === 'bundle') {
    orderData = {
      type: 'bundle',
      bundleId: searchParams.get('bundleId'),
      bundleName: searchParams.get('bundleName'),
      theme: searchParams.get('theme'),
      price: parseFloat(searchParams.get('price') || '0')
    }
  } else if (orderType === 'custom') {
    const data = searchParams.get('data')
    if (data) {
      const parsed = JSON.parse(data)
      orderData = {
        type: 'custom',
        ...parsed
      }
    }
  } else if (orderType === 'individual') {
    const data = searchParams.get('data')
    if (data) {
      const parsed = JSON.parse(data)
      orderData = {
        type: 'individual',
        ...parsed
      }
    }
  }

  if (!orderType || !orderData.type) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Order</h2>
          <p className="text-gray-600 mb-6">No order data found. Please start over.</p>
          <a href="/" className="text-rose-600 hover:text-rose-700 font-medium">
            ← Back to Home
          </a>
        </div>
      </div>
    )
  }

  return <CheckoutForm orderData={orderData} />
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading checkout...</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
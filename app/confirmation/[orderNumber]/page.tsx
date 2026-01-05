import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single()

  if (!order) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center mb-6">
            <div className="text-6xl mb-4">✓</div>
            <h1 className="text-3xl font-bold text-rose-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your order. We'll start working on it as soon as we receive your payment.
            </p>
            <div className="bg-rose-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 mb-1">Order Number</div>
              <div className="text-2xl font-bold text-rose-600">{order.order_number}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{order.customer_email}</span>
                </div>
              )}
              {order.recipient_name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-medium">{order.recipient_name}</span>
                </div>
              )}
            </div>

            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-rose-600">${order.total_price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Payment Instructions</h2>
            <div className="space-y-4">
              <div className="bg-rose-50 rounded-lg p-4">
                <p className="font-medium mb-2">Send payment via Venmo:</p>
                <p className="text-2xl font-bold text-rose-600 mb-2">@juzoai</p>
                <p className="text-sm text-gray-600">
                  Please include your order number ({order.order_number}) in the payment note.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Once we receive your payment, we'll begin working on your order. You'll receive 
                updates via {order.customer_email ? 'email and ' : ''}text message.
              </p>
            </div>
          </div>

          <div className="text-center space-y-3">
            <Link 
              href="/"
              className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-semibold transition-colors"
            >
              Back to Home
            </Link>
            <p className="text-sm text-gray-600">
              Questions? Text us at (757) 333-2559
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
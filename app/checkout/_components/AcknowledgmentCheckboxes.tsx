'use client'

export default function AcknowledgmentCheckboxes() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Checkout & Order Acknowledgment</h2>
      <p className="text-gray-600 mb-6">
        Please read and acknowledge each statement before submitting your order. Just to make sure we're on the same page :)
      </p>

      <div className="space-y-4">
        {/* Payment */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              className="mt-1 w-5 h-5 text-rose-600 rounded"
            />
            <div className="flex-1">
              <div className="font-medium mb-1">Payment <span className="text-red-500">*</span></div>
              <p className="text-sm text-gray-700">
                I acknowledge that the final payment amount will be confirmed through direct communication 
                with @fauxlowers.byjz before payment is sent. Payment is accepted via Venmo @juzaoi unless 
                otherwise discussed and confirmed. Orders will not be started until payment has been received.
              </p>
            </div>
          </label>
        </div>

        {/* Delivery & Pick-Up Timing */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              className="mt-1 w-5 h-5 text-rose-600 rounded"
            />
            <div className="flex-1">
              <div className="font-medium mb-1">Delivery & Pick-Up Timing <span className="text-red-500">*</span></div>
              <p className="text-sm text-gray-700">
                I acknowledge that delivery and pickup timelines are not guaranteed until they are confirmed 
                on a one-on-one basis by @fauxlowers.byjz.
              </p>
            </div>
          </label>
        </div>

        {/* Custom / Handmade Nature */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              className="mt-1 w-5 h-5 text-rose-600 rounded"
            />
            <div className="flex-1">
              <div className="font-medium mb-1">Custom / Handmade Nature <span className="text-red-500">*</span></div>
              <p className="text-sm text-gray-700">
                I acknowledge that all bouquets are handmade and custom, and small variations in shape, 
                size, or arrangement may occur.
              </p>
            </div>
          </label>
        </div>

        {/* Communication */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              className="mt-1 w-5 h-5 text-rose-600 rounded"
            />
            <div className="flex-1">
              <div className="font-medium mb-1">Communication <span className="text-red-500">*</span></div>
              <p className="text-sm text-gray-700">
                I acknowledge that all order communication and confirmations will take place directly with 
                @fauxlowers.byjz through Instagram DMs or other forms of communication directly with @fauxlowers.byjz.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
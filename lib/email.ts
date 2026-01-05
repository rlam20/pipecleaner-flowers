import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type OrderEmailData = {
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  recipient_name?: string
  notes?: string
  order_type: string
  total_price: number
  
  // For bundle orders
  bundle_name?: string
  selected_theme?: string
  
  // For custom/individual orders
  custom_bouquet?: any
}

export async function sendOrderNotification(data: OrderEmailData) {
  try {
    // Build order details HTML
    let orderDetailsHtml = ''
    
    if (data.order_type === 'bundle') {
      orderDetailsHtml = `
        <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #881337;">Bundle Order</h3>
          <p style="margin: 5px 0;"><strong>Bundle:</strong> ${data.bundle_name}</p>
          <p style="margin: 5px 0;"><strong>Color Theme:</strong> ${data.selected_theme}</p>
        </div>
      `
    } else if (data.order_type === 'custom') {
      const flowers = data.custom_bouquet?.flowers || []
      const addons = data.custom_bouquet?.addons || {}
      
      orderDetailsHtml = `
        <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #881337;">Custom Bouquet</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${flowers.map((f: any) => `
              <li style="margin: 5px 0;">${f.flower_name} (${f.color_name}) - $${f.price.toFixed(2)}</li>
            `).join('')}
          </ul>
          ${addons.wrapped ? '<p style="margin: 5px 0;"><strong>Add-on:</strong> Gift wrapped (+$2.00)</p>' : ''}
          ${addons.organization ? `<p style="margin: 5px 0;"><strong>Organization:</strong> ${addons.organization === 'maker' ? 'Organized by maker' : 'DIY'}</p>` : ''}
        </div>
      `
    } else if (data.order_type === 'individual') {
      const flowers = data.custom_bouquet?.flowers || []
      
      orderDetailsHtml = `
        <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #881337;">Individual Flowers</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${flowers.map((f: any) => `
              <li style="margin: 5px 0;">${f.quantity}x ${f.flower_name} (${f.color_name}) - $${(f.price * f.quantity).toFixed(2)}</li>
            `).join('')}
          </ul>
        </div>
      `
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%); padding: 30px; border-radius: 12px; margin-bottom: 20px;">
            <h1 style="margin: 0; color: #881337; font-size: 28px;">🌸 New Order Received!</h1>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">Order Number</p>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #e11d48;">${data.order_number}</p>
            </div>

            <h2 style="color: #881337; margin-top: 0;">Customer Information</h2>
            <table style="width: 100%; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 140px;">Customer:</td>
                <td style="padding: 8px 0; font-weight: 600;">${data.customer_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Phone:</td>
                <td style="padding: 8px 0; font-weight: 600;">${data.customer_phone}</td>
              </tr>
              ${data.customer_email ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Email:</td>
                <td style="padding: 8px 0; font-weight: 600;">${data.customer_email}</td>
              </tr>
              ` : ''}
              ${data.recipient_name ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Recipient:</td>
                <td style="padding: 8px 0; font-weight: 600;">${data.recipient_name}</td>
              </tr>
              ` : ''}
            </table>

            ${data.notes ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <p style="margin: 0 0 5px 0; font-weight: 600; color: #92400e;">Special Instructions:</p>
              <p style="margin: 0; color: #78350f;">${data.notes}</p>
            </div>
            ` : ''}

            <h2 style="color: #881337;">Order Details</h2>
            ${orderDetailsHtml}

            <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #fce7f3;">
              <table style="width: 100%;">
                <tr>
                  <td style="font-size: 20px; font-weight: bold;">Total:</td>
                  <td style="font-size: 24px; font-weight: bold; color: #e11d48; text-align: right;">$${data.total_price.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 25px; padding: 20px; background-color: #fffbeb; border-radius: 8px; border: 2px dashed #f59e0b;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">⏳ Awaiting Payment</p>
              <p style="margin: 0; color: #78350f; font-size: 14px;">
                This order is waiting for Venmo payment confirmation before work begins.
              </p>
            </div>
          </div>

          <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Order placed on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `

    // Send to business
    await resend.emails.send({
      from: 'Pipecleaner Flowers <orders@resend.dev>', // This is Resend's test domain
      to: process.env.BUSINESS_EMAIL!,
      subject: `New Order: ${data.order_number}`,
      html: emailHtml
    })

    console.log('Order notification sent successfully')
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}
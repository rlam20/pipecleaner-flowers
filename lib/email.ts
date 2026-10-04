import 'server-only'

import { Resend } from 'resend'
import type { CustomerDetails, OrderReceipt } from '@/lib/types'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

const currency = (cents: number) => `$${(cents / 100).toFixed(2)}`

export async function sendCookieOrderNotification(receipt: OrderReceipt, customer: CustomerDetails): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.BUSINESS_EMAIL
  const from = process.env.RESEND_FROM_EMAIL || 'Dough Not Disturb <onboarding@resend.dev>'
  if (!apiKey || !to) {
    console.warn('Order saved; order email is not configured.')
    return false
  }

  const contact = [
    `${customer.first_name.trim()} ${customer.last_name.trim()}`,
    customer.phone.trim(), customer.email.trim(), customer.social_handle.trim(),
  ].filter(Boolean)
  const lines = receipt.items.map((item) =>
    `${item.quantity} × ${item.name} — ${currency(item.unit_price_cents)} each — ${currency(item.line_total_cents)}`
  )
  const pickup = `${receipt.pickup_date} at ${receipt.pickup_time} (${receipt.time_zone})`
  const location = receipt.pickup_location || 'Pickup location will be confirmed directly.'
  const payment = `${receipt.payment_method === 'venmo' ? 'Venmo' : 'Zelle'}: ${receipt.payment_recipient}`
  const text = [
    `DoughNotDisturb order ${receipt.order_number}`,
    `Order date: ${receipt.order_date}`, '', ...contact, '', ...lines,
    `Order type: ${receipt.order_type === 'snack' ? 'Snack Pick Up' : 'Party Pack'}`,
    `Packaging: ${receipt.packaging === 'card' ? 'Card with Note (no charge)' : 'Standard'}`,
    receipt.card_message ? `Card message: ${receipt.card_message}` : '',
    `Total: ${currency(receipt.total_cents)}`, `Pickup: ${pickup}`, location,
    `Payment: ${payment}`, 'Status: Awaiting payment. Payment has not been verified.',
  ].filter((line) => line !== '').join('\n')

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#280800;line-height:1.6;max-width:640px;margin:0 auto;padding:24px">
    <h1>DoughNotDisturb</h1><h2>New cookie order</h2>
    <p><strong>${escapeHtml(receipt.order_number)}</strong><br>Order date: ${escapeHtml(receipt.order_date)}</p>
    <h3>Customer</h3><p>${contact.map(escapeHtml).join('<br>')}</p>
    <h3>${receipt.order_type === 'snack' ? 'Snack Pick Up' : 'Party Pack'}</h3>
    <ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
    <p>Packaging: ${receipt.packaging === 'card' ? 'Card with Note (no charge)' : 'Standard'}</p>
    ${receipt.card_message ? `<p><strong>Card message:</strong><br>${escapeHtml(receipt.card_message).replace(/\n/g, '<br>')}</p>` : ''}
    <p><strong>Total: ${currency(receipt.total_cents)}</strong></p>
    <h3>Pickup</h3><p>${escapeHtml(pickup)}<br>${escapeHtml(location)}</p>
    <h3>Payment</h3><p>${escapeHtml(payment)}<br><strong>Awaiting payment</strong> — payment has not been verified.</p>
    </body></html>`

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to,
      ...(customer.email.trim() ? { replyTo: customer.email.trim() } : {}),
      subject: `Cookie order ${receipt.order_number}`,
      text,
      html,
    }, { idempotencyKey: `cookie-order-${receipt.order_number}` })
    if (error) {
      console.error('Order saved; the email provider could not send its notification.')
      return false
    }
    return true
  } catch {
    console.error('Order saved; its email notification could not be sent.')
    return false
  }
}

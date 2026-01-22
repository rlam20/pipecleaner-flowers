export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${date}-${random}`
}

// Email validation - RFC 5322 simplified
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

// Phone validation - accepts various formats
// Supports: (555) 123-4567, 555-123-4567, 555.123.4567, 5551234567, +1 555 123 4567
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
  const trimmed = phone.trim()
  return phoneRegex.test(trimmed)
}

// Check if input is Instagram handle - starts with @ and contains valid characters
export function isValidInstagramHandle(handle: string): boolean {
  const instagramRegex = /^@[a-zA-Z0-9._]{1,29}$/
  return instagramRegex.test(handle.trim())
}

// Validate phone or Instagram handle
export function isValidPhoneOrInstagram(input: string): boolean {
  const trimmed = input.trim()
  return isValidPhone(trimmed) || isValidInstagramHandle(trimmed)
}
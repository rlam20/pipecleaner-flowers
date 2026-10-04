import { expect, test } from '@playwright/test'

test('renders the complete storefront without horizontal overflow', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/DoughNotDisturb/)
  await expect(page.getByRole('heading', { name: /A little pause/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Matcha Neapolitan' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Biscoff Chai' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mango Lassi' })).toBeVisible()
  await expect(page.locator('body')).toContainText('The cookie counter is getting ready')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})

test('restores private checkout details from this tab without putting them in the URL', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('dough-not-disturb.order.v1', JSON.stringify({
      version: 1,
      receipt: null,
      draft: {
        items: [{ product_id: 'matcha-neapolitan', quantity: 2 }],
        packaging: 'card', card_message: 'A well-earned treat.',
        customer: { first_name: 'Test', last_name: 'Customer', phone: '(555) 123-4567', email: 'test@example.com', social_handle: '@test' },
        pickup_date: '', pickup_time: '', pickup_window_id: '', payment_method: 'venmo',
        request_id: '11111111-1111-4111-8111-111111111111',
      },
    }))
  })
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: /cookie break official/i })).toBeVisible()
  await expect(page.getByLabel('First name')).toHaveValue('Test')
  await expect(page.getByLabel('Phone')).toHaveValue('(555) 123-4567')
  await expect(page.getByText('Matcha Neapolitan × 2')).toBeVisible()
  expect(page.url()).toBe('http://127.0.0.1:3000/checkout')
})

test('redirects retired flower storefront routes to the cookie order section', async ({ page }) => {
  await page.goto('/premade')
  await expect(page).toHaveURL(/\/#order$/)
  await expect(page.getByRole('heading', { name: /Meet your next/i })).toBeVisible()
})

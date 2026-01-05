'use client'

import { useState } from 'react'
import { createBundle } from '@/lib/actions/bundles'

export default function AddBundleForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: ''
  })
  
  // Flower composition state
  const [flowers, setFlowers] = useState<{ flower_name: string; quantity: number }[]>([
    { flower_name: 'Rose', quantity: 3 }
  ])
  
  // Color themes state
  const [themes, setThemes] = useState<string[]>([
    'Warm sunset (oranges, reds, yellows)'
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price) {
      alert('Please fill in name and price')
      return
    }

    if (flowers.length === 0) {
      alert('Please add at least one flower type')
      return
    }

    if (themes.length === 0) {
      alert('Please add at least one color theme')
      return
    }

    setLoading(true)

    try {
      const result = await createBundle({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: formData.image_url || '/placeholder-bundle.jpg',
        flower_composition: flowers,
        color_themes: themes
      })

      if (result.success) {
        alert('Bundle created successfully!')
        // Reset form
        setFormData({ name: '', description: '', price: '', image_url: '' })
        setFlowers([{ flower_name: 'Rose', quantity: 3 }])
        setThemes(['Warm sunset (oranges, reds, yellows)'])
        window.location.reload()
      } else {
        alert(result.error || 'Failed to create bundle')
      }
    } catch (error) {
      console.error('Failed to create bundle:', error)
      alert('Failed to create bundle')
    } finally {
      setLoading(false)
    }
  }

  const addFlower = () => {
    setFlowers([...flowers, { flower_name: '', quantity: 1 }])
  }

  const updateFlower = (index: number, field: 'flower_name' | 'quantity', value: string | number) => {
    // Use an immutable update with explicit property assignments to satisfy TypeScript
    if (field === 'quantity') {
      setFlowers(prev => prev.map((f, i) => i === index ? { ...f, quantity: Number(value) } : f))
    } else {
      setFlowers(prev => prev.map((f, i) => i === index ? { ...f, flower_name: String(value) } : f))
    }
  }

  const removeFlower = (index: number) => {
    setFlowers(flowers.filter((_, i) => i !== index))
  }

  const addTheme = () => {
    setThemes([...themes, ''])
  }

  const updateTheme = (index: number, value: string) => {
    const newThemes = [...themes]
    newThemes[index] = value
    setThemes(newThemes)
  }

  const removeTheme = (index: number) => {
    setThemes(themes.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bundle Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          placeholder="e.g., Sunset Garden"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          placeholder="Describe this bundle..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            step="0.01"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            placeholder="25.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image URL
        </label>
        <input
          type="text"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          placeholder="/your-image.jpg"
        />
        <p className="text-xs text-gray-500 mt-1">Upload image to /public folder first</p>
      </div>

      {/* Flower Composition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Flower Composition *
        </label>
        <div className="space-y-2">
          {flowers.map((flower, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={flower.flower_name}
                onChange={(e) => updateFlower(index, 'flower_name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select flower</option>
                <option value="Rose">Rose</option>
                <option value="Tulip">Tulip</option>
                <option value="Daisy">Daisy</option>
                <option value="Sunflower">Sunflower</option>
                <option value="Carnation">Carnation</option>
              </select>
              <input
                type="number"
                min="1"
                value={flower.quantity}
                onChange={(e) => updateFlower(index, 'quantity', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={() => removeFlower(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addFlower}
          className="mt-2 text-sm text-rose-600 hover:text-rose-700 font-medium"
        >
          + Add Flower
        </button>
      </div>

      {/* Color Themes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color Themes *
        </label>
        <div className="space-y-2">
          {themes.map((theme, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={theme}
                onChange={(e) => updateTheme(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                placeholder="e.g., Warm sunset (oranges, reds, yellows)"
              />
              <button
                type="button"
                onClick={() => removeTheme(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTheme}
          className="mt-2 text-sm text-rose-600 hover:text-rose-700 font-medium"
        >
          + Add Theme
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
      >
        {loading ? 'Creating...' : 'Create Bundle'}
      </button>
    </form>
  )
}
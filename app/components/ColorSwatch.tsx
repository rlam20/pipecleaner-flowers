"use client"

import React from 'react'

type Props = {
  hex?: string
  name?: string
  size?: number
  showLabel?: boolean
  showRemove?: boolean
  onRemove?: () => void
  onClick?: () => void
}

export default function ColorSwatch({ hex = '#e5e7eb', name, size = 24, showLabel = false, showRemove = false, onRemove, onClick }: Props) {
  const swatchStyle: React.CSSProperties = {
    backgroundColor: hex,
    width: size,
    height: size,
    borderRadius: '9999px',
    border: '1px solid rgba(0,0,0,0.06)',
    boxSizing: 'border-box'
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onClick} aria-label={name || hex} className="flex-shrink-0" style={{ padding: 0, lineHeight: 0, border: 'none', background: 'transparent' }}>
        <div style={swatchStyle} />
      </button>

      {showRemove && (
        <button type="button" onClick={onRemove} className="text-xs text-gray-500 hover:text-red-600" aria-label="remove color">
          ✕
        </button>
      )}

      {showLabel && (
        <div className="text-xs text-gray-700">
          {name ? `${name} (${hex})` : hex}
        </div>
      )}
    </div>
  )
}

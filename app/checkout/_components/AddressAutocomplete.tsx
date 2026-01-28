'use client'

import usePlacesAutocomplete from "use-places-autocomplete"
import { useEffect } from "react"

type Props = {
  value: string
  onChange: (value: string) => void
}

export default function AddressAutocomplete({ value, onChange }: Props) {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      // Restrict results to US only (optional but recommended)
      componentRestrictions: { country: "us" }, 
    },
    debounce: 300,
    defaultValue: value,
  })

  // Keep local state in sync if parent updates (e.g. from saved state)
  useEffect(() => {
    if (value !== inputValue) {
      setValue(value, false)
    }
  }, [value, setValue, inputValue])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    onChange(e.target.value)
  }

  const handleSelect = (description: string) => {
    // Update input value and parent state when user clicks a suggestion
    setValue(description, false)
    onChange(description)
    clearSuggestions()
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInput}
        disabled={!ready}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        placeholder="Start typing address..."
      />
      
      {/* Suggestions Dropdown */}
      {status === "OK" && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-xl mt-1 max-h-60 overflow-auto">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="px-4 py-3 hover:bg-rose-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0 transition-colors"
            >
              📍 {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
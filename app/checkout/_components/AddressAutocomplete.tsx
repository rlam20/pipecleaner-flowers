'use client'

import usePlacesAutocomplete from "use-places-autocomplete"
import Script from "next/script"
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
    init, 
  } = usePlacesAutocomplete({
    initOnMount: false,
    requestOptions: {
      componentRestrictions: { country: "us" }, 
    },
    debounce: 300,
    defaultValue: value,
  })

  useEffect(() => {
    // FIX: Cast window to 'any' to stop the TypeScript error
    if (typeof window !== "undefined" && (window as any).google?.maps?.places) {
      init();
    }
  }, [init]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    onChange(e.target.value)
  }

  const handleSelect = (description: string) => {
    setValue(description, false)
    onChange(description)
    clearSuggestions()
  }

  return (
    <div className="relative">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => init()}
      />

      <input
        type="text"
        value={inputValue}
        onChange={handleInput}
        disabled={!ready}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder={ready ? "Start typing address..." : "Loading address search..."}
      />
      
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
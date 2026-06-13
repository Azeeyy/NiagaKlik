'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import { searchMockAddresses, MockAddress } from '@/lib/mock-addresses';

interface AddressComponent {
  fullAddress: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

interface AddressAutocompleteProps {
  onAddressChange: (address: AddressComponent) => void;
  initialValue?: string;
  placeholder?: string;
  className?: string;
}

function getAddressComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string
): string {
  const component = components.find((c) => c.types.includes(type));
  return component ? component.long_name : '';
}

function MockAddressAutocomplete({
  value,
  onValueChange,
  onSelect,
  placeholder,
}: {
  value: string;
  onValueChange: (v: string) => void;
  onSelect: (address: AddressComponent) => void;
  placeholder: string;
}) {
  const [suggestions, setSuggestions] = useState<MockAddress[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSuggestions = useCallback((query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const results = searchMockAddresses(query);
    setSuggestions(results);
    setShowDropdown(results.length > 0);
    setHighlightIdx(-1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => updateSuggestions(value), 150);
    return () => clearTimeout(timer);
  }, [value, updateSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectAddress(addr: MockAddress) {
    onValueChange(addr.fullAddress);
    setShowDropdown(false);
    onSelect({
      fullAddress: addr.fullAddress,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      postalCode: addr.postalCode,
      lat: addr.lat,
      lng: addr.lng,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      selectAddress(suggestions[highlightIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input-field pr-10 border-primary-300 bg-primary-50/30"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
          {suggestions.map((addr, idx) => (
            <button
              key={addr.fullAddress + idx}
              type="button"
              onClick={() => selectAddress(addr)}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                idx === highlightIdx ? 'bg-primary-50' : 'hover:bg-gray-50'
              } ${idx !== suggestions.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{addr.fullAddress}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {addr.district}, {addr.city}, {addr.province} {addr.postalCode}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end">
                <span className="text-[10px] text-gray-400 font-mono">
                  {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}
                </span>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Mode simulasi — data alamat contoh
            </p>
          </div>
        </div>
      )}

      {/* Badge simulasi */}
      <div className="flex items-center gap-2 mt-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-[11px] font-medium rounded-full">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Simulasi
        </span>
        <p className="text-[11px] text-gray-400">
          Google Maps tidak tersedia — menggunakan data contoh. Isi manual atau pilih dari daftar.
        </p>
      </div>
    </div>
  );
}

export default function AddressAutocomplete({
  onAddressChange,
  initialValue = '',
  placeholder = 'Cari alamat...',
  className = '',
}: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autoC: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autoC;
  };

  const onPlaceChanged = () => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    if (!place || !place.address_components || !place.geometry) return;

    const components = place.address_components;

    // Extract street number + route for full address
    const streetNumber = getAddressComponent(components, 'street_number');
    const route = getAddressComponent(components, 'route');
    const sublocality = getAddressComponent(components, 'sublocality') || 
                        getAddressComponent(components, 'sublocality_level_1') || 
                        getAddressComponent(components, 'sublocality_level_2');
    const locality = getAddressComponent(components, 'locality') || 
                     getAddressComponent(components, 'postal_town') ||
                     getAddressComponent(components, 'administrative_area_level_3');
    const adminArea1 = getAddressComponent(components, 'administrative_area_level_1');
    const adminArea2 = getAddressComponent(components, 'administrative_area_level_2');
    const postalCode = getAddressComponent(components, 'postal_code');

    // Build full address string
    const street = [streetNumber, route].filter(Boolean).join(' ');
    const fullAddr = [street, sublocality, locality, adminArea1]
      .filter(Boolean)
      .join(', ');

    const lat = place.geometry.location?.lat();
    const lng = place.geometry.location?.lng();

    // Update input value
    const displayValue = place.formatted_address || fullAddr;
    setValue(displayValue);

    onAddressChange({
      fullAddress: displayValue,
      province: adminArea1 || adminArea2 || '',
      city: locality || sublocality || adminArea2 || '',
      district: sublocality || adminArea2 || '',
      postalCode,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
    });
  };

  if (!isLoaded) {
    // Show mock autocomplete if Maps failed to load (e.g. missing API key)
    if (loadError) {
      return (
        <div className={className}>
          <MockAddressAutocomplete
            value={value || initialValue}
            onValueChange={setValue}
            onSelect={onAddressChange}
            placeholder={placeholder}
          />
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        <input
          type="text"
          value={value || initialValue}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="input-field pr-10"
          disabled
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          componentRestrictions: { country: 'id' },
          fields: ['address_components', 'geometry', 'formatted_address', 'name'],
          types: ['address'],
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`input-field pr-10 ${isFocused ? 'ring-2 ring-primary-500 border-transparent' : ''}`}
        />
      </Autocomplete>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    </div>
  );
}

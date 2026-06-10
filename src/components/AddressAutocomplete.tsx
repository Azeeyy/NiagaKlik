'use client';

import { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';

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
    // Show error if Maps failed to load (e.g. missing API key)
    if (loadError) {
      return (
        <div className={className}>
          <div className="relative">
            <input
              type="text"
              value={value || initialValue}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="input-field pr-10 border-amber-300 bg-amber-50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            Google Maps tidak dapat dimuat. Atur <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> di .env.local untuk mengaktifkan autocomplete alamat. Silakan isi alamat secara manual.
          </p>
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

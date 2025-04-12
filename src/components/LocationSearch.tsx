import React, { useEffect, useRef, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { SearchIcon, AlertCircleIcon } from './fallback/FallbackIcons';
import { Location } from '../types/maps';
import { getGoogleMapsLoadPromise } from './Map';

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Search for a location"
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await getGoogleMapsLoadPromise();
        
        if (!inputRef.current) return;

        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          
          if (place?.geometry?.location) {
            const location: Location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address,
            };
            onLocationSelect(location);
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error);
        setError('Failed to load location search. Please check your connection or try disabling ad blockers.');
        setIsLoading(false);
      }
    };

    initializeAutocomplete();
  }, [onLocationSelect]);

  // Manual location entry fallback
  const handleManualEntry = () => {
    if (inputRef.current?.value) {
      // This is a simple fallback when the autocomplete doesn't work
      // In a real app, we would use a geocoding service to convert the address to coordinates
      // For now, we'll just create a mock location with a random position near Mumbai
      const randomOffset = () => (Math.random() - 0.5) * 0.1; // Small random offset
      const location: Location = {
        lat: 19.0760 + randomOffset(),
        lng: 72.8777 + randomOffset(),
        address: inputRef.current.value,
      };
      onLocationSelect(location);
      
      // Reset the field
      inputRef.current.value = '';
      setError(null);
    }
  };

  const SearchIconComponent = iconError ? SearchIcon : Search;
  const AlertIconComponent = iconError ? AlertCircleIcon : AlertCircle;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={`w-full px-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && error) {
              e.preventDefault();
              handleManualEntry();
            }
          }}
        />
        <SearchIconComponent
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          onError={() => setIconError(true)}
        />
        
        {error && (
          <button
            onClick={handleManualEntry}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-600 hover:text-indigo-800"
            title="Use manual entry"
          >
            Enter
          </button>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertIconComponent size={14} onError={() => setIconError(true)} />
          <span>Google Maps unavailable. Using manual entry mode.</span>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
import React, { useEffect, useRef, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { SearchIcon, AlertCircleIcon } from './fallback/FallbackIcons';
import { Location } from '../types/maps';

// Define for TypeScript support
declare global {
  namespace google.maps.places {
    class PlacesAutocompleteElement extends HTMLElement {
      constructor(options: {
        inputPlaceholder?: string;
        inputType?: string;
        appearance?: {
          style?: 'inline' | 'pill' | 'default';
        };
        types?: string[];
      });
    }
  }
}

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Search for a location"
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteElementRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);
  const [useModernAPI, setUseModernAPI] = useState(false);

  // Helper to check if Google Maps is loaded
  const isGoogleMapsLoaded = () => {
    return typeof window !== 'undefined' && window.google && window.google.maps;
  };

  // Helper to extract location from place
  const extractLocationFromPlace = (place: google.maps.places.PlaceResult): Location | null => {
    if (place?.geometry?.location) {
      return {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address,
      };
    }
    return null;
  };

  useEffect(() => {
    const initializeAutocomplete = () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!isGoogleMapsLoaded()) {
          // Wait for Google Maps to load via event
          const handleMapsLoaded = () => {
            window.removeEventListener('google-maps-loaded', handleMapsLoaded);
            initializeAutocomplete();
          };
          
          window.addEventListener('google-maps-loaded', handleMapsLoaded);
          return;
        }

        // Check if the modern PlacesAutocompleteElement is available
        if (window.google.maps.places.PlacesAutocompleteElement) {
          console.log("Using modern PlacesAutocompleteElement API");
          setUseModernAPI(true);
          setIsLoading(false);
          return;
        }
        
        // Fallback to legacy Autocomplete
        if (!inputRef.current) return;

        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place) {
            const location = extractLocationFromPlace(place);
            if (location) {
              onLocationSelect(location);
            }
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error);
        setError('Failed to load location search. Please check your connection or try disabling ad blockers.');
        setIsLoading(false);
      }
    };

    // Try to initialize directly or wait for maps to load
    if (isGoogleMapsLoaded()) {
      initializeAutocomplete();
    } else {
      // Set up a timeout in case Google Maps never loads
      const timeoutId = setTimeout(() => {
        if (!isGoogleMapsLoaded()) {
          setError('Google Maps API not loaded. Try disabling ad blockers.');
          setIsLoading(false);
        }
      }, 5000);
      
      // Listen for maps loaded event
      const handleMapsLoaded = () => {
        clearTimeout(timeoutId);
        window.removeEventListener('google-maps-loaded', handleMapsLoaded);
        initializeAutocomplete();
      };
      
      window.addEventListener('google-maps-loaded', handleMapsLoaded);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('google-maps-loaded', handleMapsLoaded);
      };
    }
  }, [onLocationSelect]);

  // Initialize the modern API if we're using it
  useEffect(() => {
    if (!useModernAPI || !autocompleteElementRef.current || !window.google?.maps?.places?.PlacesAutocompleteElement) {
      return;
    }

    try {
      // Clean any previous elements
      autocompleteElementRef.current.innerHTML = '';
      
      // Create the modern autocomplete element
      const autocompleteElement = new window.google.maps.places.PlacesAutocompleteElement({
        inputPlaceholder: placeholder,
        inputType: 'text',
        appearance: {
          style: 'inline',
        },
        types: ['geocode', 'establishment'],
      });

      // Add place change listener
      autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
        const place = event.place;
        if (place) {
          const location: Location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formattedAddress,
          };
          onLocationSelect(location);
        }
      });

      // Append to the container
      autocompleteElementRef.current.appendChild(autocompleteElement);
    } catch (error) {
      console.error("Error initializing modern Places Autocomplete:", error);
      setUseModernAPI(false);
      setError("Could not initialize modern Places API");
    }
  }, [useModernAPI, placeholder, onLocationSelect]);

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

  // If modern API is available, use it
  if (useModernAPI) {
    return (
      <div className="space-y-2">
        <div ref={autocompleteElementRef} className="w-full"></div>
        
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <AlertIconComponent size={14} onError={() => setIconError(true)} />
            <span>Google Maps unavailable. Using manual entry mode.</span>
          </div>
        )}
      </div>
    );
  }

  // Traditional API or fallback
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
import React, { useEffect, useRef, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { SearchIcon, AlertCircleIcon } from './fallback/FallbackIcons';
import { Location } from '../types/maps';
import LeafletLocationSearch from './fallback/LeafletLocationSearch';

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
  participantId?: string; // Optional participantId to track which participant this search is for
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Search for a location",
  participantId
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteElementRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);
  const [useModernAPI, setUseModernAPI] = useState(false);
  const [useLeaflet, setUseLeaflet] = useState(false);

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
        timestamp: Date.now(), // Add timestamp for freshness
        participantId // Store which participant this location is for
      };
    }
    return null;
  };

  // Handle location selection with proper participant tracking
  const handleLocationSelection = (location: Location) => {
    // Ensure the participantId is included in the location data
    const locationWithParticipant = {
      ...location,
      timestamp: Date.now(),
      participantId
    };
    onLocationSelect(locationWithParticipant);
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
          
          // Set a timeout for Google Maps loading
          setTimeout(() => {
            if (!isGoogleMapsLoaded() && !useLeaflet) {
              console.log("Google Maps failed to load, switching to Leaflet search");
              setUseLeaflet(true);
              setIsLoading(false);
            }
          }, 3000);
          
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
              handleLocationSelection(location);
            }
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error);
        setError('Failed to load location search. Switching to Leaflet search.');
        setUseLeaflet(true);
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
          setUseLeaflet(true);
          setIsLoading(false);
        }
      }, 3000);
      
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
  }, [onLocationSelect, useLeaflet, participantId]);

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
            timestamp: Date.now(),
            participantId
          };
          handleLocationSelection(location);
        }
      });

      // Append to the container
      autocompleteElementRef.current.appendChild(autocompleteElement);
    } catch (error) {
      console.error("Error initializing modern Places Autocomplete:", error);
      setUseModernAPI(false);
      setUseLeaflet(true);
      setError("Could not initialize Google Places API. Using OpenStreetMap search instead.");
    }
  }, [useModernAPI, placeholder, onLocationSelect, participantId]);

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
        timestamp: Date.now(),
        participantId
      };
      handleLocationSelection(location);
      
      // Reset the field
      inputRef.current.value = '';
      setError(null);
    }
  };

  const SearchIconComponent = iconError ? SearchIcon : Search;
  const AlertIconComponent = iconError ? AlertCircleIcon : AlertCircle;

  // If Leaflet search is enabled, use it
  if (useLeaflet) {
    return (
      <div className="space-y-2">
        <LeafletLocationSearch 
          onLocationSelect={handleLocationSelection}
          placeholder={placeholder}
        />
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <SearchIconComponent size={14} onError={() => setIconError(true)} />
          <span>Using OpenStreetMap search (ad-blocker friendly)</span>
        </div>
      </div>
    );
  }

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
          className={`w-full px-10 py-3 border ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
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
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 px-2 py-1 rounded text-xs font-medium"
            title="Use manual entry"
          >
            Set
          </button>
        )}
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
          <AlertIconComponent size={14} className="flex-shrink-0" onError={() => setIconError(true)} />
          <div>
            <p>{error}</p>
            <button 
              onClick={() => setUseLeaflet(true)} 
              className="mt-1 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Switch to OpenStreetMap search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
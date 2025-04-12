import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
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

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
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
        setIsLoading(false);
      }
    };

    initializeAutocomplete();
  }, [onLocationSelect]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="w-full px-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        disabled={isLoading}
      />
      <Search
        size={18}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      />
    </div>
  );
};

export default LocationSearch;
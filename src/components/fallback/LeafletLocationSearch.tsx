import React, { useState, useRef, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { SearchIcon, AlertCircleIcon } from './FallbackIcons';
import { Location } from '../../types/maps';
import debounce from 'lodash.debounce';

// Install required packages:
// npm install lodash.debounce

interface LeafletLocationSearchProps {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
}

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  boundingbox: string[];
}

const LeafletLocationSearch: React.FC<LeafletLocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Search for a location"
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isResultsVisible, setIsResultsVisible] = useState<boolean>(false);
  const [iconError, setIconError] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle outside click to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsResultsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to search Nominatim (OpenStreetMap's geocoding service)
  const searchNominatim = async (query: string) => {
    if (!query || query.trim().length < 3) {
      setResults([]);
      setIsResultsVisible(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Using Nominatim API with proper attribution and rate-limiting
      // In production, you should run your own Nominatim server or use a geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'MEETease App' // Required by Nominatim usage policy
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }

      const data: NominatimResult[] = await response.json();
      
      // Validate the data
      const validResults = data.filter(result => 
        result && 
        typeof result.lat === 'string' && 
        typeof result.lon === 'string' &&
        !isNaN(parseFloat(result.lat)) &&
        !isNaN(parseFloat(result.lon))
      );
      
      setResults(validResults);
      setIsResultsVisible(validResults.length > 0);
      
      if (data.length > 0 && validResults.length === 0) {
        setError('Invalid location data received. Please try a different search.');
      }
    } catch (err) {
      console.error('Error searching locations:', err);
      setError('Failed to search locations. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create debounced search function
  const debouncedSearch = useRef(
    debounce((query: string) => {
      searchNominatim(query);
    }, 500)
  ).current;

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim().length >= 3) {
      debouncedSearch(value);
    } else {
      setResults([]);
      setIsResultsVisible(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (result: NominatimResult) => {
    try {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates');
      }
      
      const location: Location = {
        lat,
        lng,
        address: result.display_name,
        timestamp: Date.now()
      };
      
      onLocationSelect(location);
      setSearchTerm(result.display_name);
      setIsResultsVisible(false);
      setError(null);
    } catch (err) {
      console.error('Error processing location selection:', err);
      setError('Invalid location data. Please try another option.');
    }
  };

  // Handle manual entry for fallback
  const handleManualEntry = () => {
    if (searchTerm.trim()) {
      // Create a mock location with a random position near Mumbai as fallback
      const randomOffset = () => (Math.random() - 0.5) * 0.1;
      const location: Location = {
        lat: 19.0760 + randomOffset(),
        lng: 72.8777 + randomOffset(),
        address: searchTerm,
        timestamp: Date.now()
      };
      onLocationSelect(location);
      setIsResultsVisible(false);
      setError(null);
    }
  };

  const SearchIconComponent = iconError ? SearchIcon : Search;
  const AlertIconComponent = iconError ? AlertCircleIcon : AlertCircle;

  return (
    <div className="space-y-2 relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsResultsVisible(results.length > 0)}
          placeholder={placeholder}
          className={`w-full px-10 py-3 border ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (results.length > 0) {
                handleLocationSelect(results[0]);
              } else if (error || searchTerm.trim().length > 0) {
                handleManualEntry();
              }
            }
          }}
        />
        <SearchIconComponent
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          onError={() => setIconError(true)}
        />
        
        {(error || searchTerm.trim().length >= 3) && (
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

      {isResultsVisible && (
        <div 
          ref={resultsRef}
          className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
        >
          {results.length > 0 ? (
            <>
              <ul className="py-1">
                {results.map((result) => (
                  <li 
                    key={result.place_id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handleLocationSelect(result)}
                  >
                    {result.display_name}
                  </li>
                ))}
              </ul>
              
              <div className="p-2 text-xs text-gray-500 border-t border-gray-100">
                <p>© <a href="https://www.openstreetmap.org/copyright" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors</p>
              </div>
            </>
          ) : (
            <div className="p-4 text-sm text-gray-500 text-center">
              No results found
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
          <AlertIconComponent className="flex-shrink-0 mt-0.5" size={14} onError={() => setIconError(true)} />
          <div>
            <p>{error}</p>
            <p className="mt-1 text-red-500">Enter location manually and press Enter or click "Set".</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletLocationSearch; 
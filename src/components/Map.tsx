// Add Window interface extension at the top
declare global {
  interface Window {
    GOOGLE_MAPS_API_KEY?: string;
    googleMapsLoaded?: boolean;
    googleMapsCallback?: () => void;
    googleMapsApiKey?: string;
    google: any;
    [key: string]: any; // Add index signature to allow dynamic properties
  }
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import { AlertTriangleIcon } from './fallback/FallbackIcons';
import { Location, MUMBAI_CENTER } from '../types/maps';
import { useMeetingStore } from '../store/meetingStore';
import StaticMap from './fallback/StaticMap';
import LeafletMap from './fallback/LeafletMap';
import LoadingSpinner from './LoadingSpinner';

// Simple helper function to check if Google Maps is loaded
const isGoogleMapsLoaded = () => {
  return typeof window !== 'undefined' && window.google && window.google.maps;
};

// Available map modes
type MapMode = 'google' | 'leaflet' | 'static';

interface MapProps {
  center?: Location;
  zoom?: number;
  width?: string;
  height?: string;
  onMapLoad?: () => void;
}

const Map: React.FC<MapProps> = ({ center = MUMBAI_CENTER, zoom = 12, width = '100%', height = '400px', onMapLoad }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer[]>([]);
  const locationUpdateIntervalRef = useRef<number[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iconError, setIconError] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('leaflet'); // Start with Leaflet as default
  const [iframeAttemptMade, setIframeAttemptMade] = useState<boolean>(false);
  
  const { participants, meetingPoint, destination, updateParticipantLocation, updateDirections } = useMeetingStore();
  const preferLeaflet = true; // Always prefer Leaflet by default for ad-blocker resistance

  // Function to attempt loading Google Maps dynamically
  const attemptLoadGoogleMaps = useCallback(async () => {
    if (preferLeaflet) {
      console.log("Using Leaflet as preferred map provider");
      setMapMode('leaflet');
      setIsLoading(false);
      return false;
    }
    
    // Reset state
    setIsLoading(true);
    setMapError(null);
    
    // List of domains to try loading Google Maps from
    const domains = [
      'maps.googleapis.com',
      'maps.google.com',
      'maps-api-ssl.google.com',
    ];
    
    // Create a unique callback name for this map instance
    const callbackName = `googleMapsCallback_${Math.random().toString(36).substring(2, 10)}`;
    
    // Try each domain in sequence
    for (const domain of domains) {
      try {
        const success = await new Promise<boolean>((resolve) => {
          // Set timeout to detect loading failures
          const timeoutId = setTimeout(() => {
            window[callbackName as keyof Window] = undefined;
            resolve(false);
          }, 5000);
          
          // Set up callback function
          window[callbackName as keyof Window] = () => {
            clearTimeout(timeoutId);
            window[callbackName as keyof Window] = undefined;
            resolve(true);
          };
          
          // Create script element and add to document
          const script = document.createElement('script');
          const apiKey = window.googleMapsApiKey || 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg'; // Fallback to default key
          script.src = `https://${domain}/maps/api/js?key=${apiKey}&callback=${callbackName}&libraries=places`;
          script.async = true;
          script.onerror = () => {
            document.head.removeChild(script);
            clearTimeout(timeoutId);
            window[callbackName as keyof Window] = undefined;
            resolve(false);
          };
          
          document.head.appendChild(script);
        });
        
        if (success) {
          console.log(`Successfully loaded Google Maps from ${domain}`);
          setMapMode('google');
          return true;
        }
      } catch (error) {
        console.error(`Error loading Google Maps from ${domain}:`, error);
      }
    }
    
    console.warn('Failed to load Google Maps from all domains, falling back to Leaflet');
    setMapMode('leaflet');
    setIsLoading(false);
    return false;
  }, [preferLeaflet]);

  // Use direct iframe as fallback
  const useFallbackIframe = () => {
    if (!mapRef.current) return false;
    
    try {
      const apiKey = window.GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      
      // Try to create a data URI iframe to bypass ad blockers
      const iframe = document.createElement('iframe');
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.style.border = '0';
      
      // Try different approaches to load maps in iframe
      const approaches = [
        // Approach 1: Direct Google Maps embed
        `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center.lat},${center.lng}&zoom=${zoom}`,
        
        // Approach 2: Google Maps search
        `https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`,
        
        // Approach 3: URL to static map image
        `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=600x400&key=${apiKey}`
      ];
      
      // Use the first approach
      iframe.src = approaches[0];
      
      mapRef.current.innerHTML = '';
      mapRef.current.appendChild(iframe);
      
      // If the iframe fails to load content, try the next approach
      iframe.onerror = () => {
        if (approaches.length > 1) {
          approaches.shift();
          iframe.src = approaches[0];
        }
      };
      
      setIsLoading(false);
      setIframeAttemptMade(true);
      return true;
    } catch (error) {
      console.error('Failed to create fallback iframe:', error);
      return false;
    }
  };

  useEffect(() => {
    // Immediately start with Leaflet for display and set isLoading to false
    setMapMode('leaflet');
    setIsLoading(false);
    
    // Optionally, still try to load Google Maps in the background
    // but don't wait for it to display the map
    const timeoutId = setTimeout(() => {
      // Only try to load Google Maps if user explicitly toggles to it
      // This prevents the automatic loading which often triggers ad blockers
    }, 1000);
    
    // If the custom event is triggered, then we can try to initialize Google Maps
    const handleMapsLoaded = () => {
      console.log('Maps loaded event received');
      setMapMode('google');
      
      // Initialize map after state update
      setTimeout(() => {
        if (mapRef.current && !mapInstanceRef.current && isGoogleMapsLoaded()) {
          try {
            mapInstanceRef.current = new google.maps.Map(mapRef.current, {
              center,
              zoom,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            });
            
            // Add markers and directions if we have a meeting point
            if (meetingPoint) {
              updateMapWithMeetingPoint();
            }
          } catch (error) {
            console.error('Error initializing map:', error);
            setMapMode('leaflet');
          }
        }
      }, 0);
    };
    
    window.addEventListener('google-maps-loaded', handleMapsLoaded);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('google-maps-loaded', handleMapsLoaded);
      
      // Clean up map instance
      if (mapInstanceRef.current) {
        // Clear all markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        
        // Clear all directions renderers
        directionsRendererRef.current.forEach(renderer => renderer.setMap(null));
        directionsRendererRef.current = [];
        
        // The map instance itself doesn't need explicit cleanup, just null the ref
        mapInstanceRef.current = null;
      }
      
      locationUpdateIntervalRef.current.forEach(interval => clearInterval(interval));
    };
  }, [center, zoom, meetingPoint]);

  // Update map when meeting point or participants change
  const updateMapWithMeetingPoint = () => {
    if (!mapInstanceRef.current || !meetingPoint) return;
    
    // Clear existing markers and directions
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    directionsRendererRef.current.forEach(renderer => renderer.setMap(null));
    directionsRendererRef.current = [];
    
    // Add meeting point marker
    const meetingPointMarker = new google.maps.Marker({
      position: meetingPoint,
      map: mapInstanceRef.current,
      title: "Meeting Point",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#10B981",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#FFFFFF",
      }
    });
    markersRef.current.push(meetingPointMarker);
    
    // Add participant markers
    participants.forEach(participant => {
      if (participant.location) {
        const marker = new google.maps.Marker({
          position: participant.location,
          map: mapInstanceRef.current,
          title: participant.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4F46E5",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#FFFFFF",
          }
        });
        markersRef.current.push(marker);
      }
    });
    
    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  // Update map when meeting point changes
  useEffect(() => {
    if (mapInstanceRef.current && meetingPoint && mapMode === 'google') {
      updateMapWithMeetingPoint();
    }
  }, [meetingPoint, participants, mapMode]);

  // Handle switch to Google Maps if it becomes available
  useEffect(() => {
    if (isGoogleMapsLoaded() && mapMode !== 'google' && !preferLeaflet) {
      setMapMode('google');
    }
  }, [mapMode, preferLeaflet]);

  // Add a button to manually switch between map types
  const toggleMapType = () => {
    if (mapMode === 'google') {
      // Clean up the map instance before switching
      if (mapInstanceRef.current) {
        // Clear all markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        
        // Clear all directions renderers
        directionsRendererRef.current.forEach(renderer => renderer.setMap(null));
        directionsRendererRef.current = [];
        
        mapInstanceRef.current = null;
      }
      // Switch to Leaflet
      setMapMode('leaflet');
    } else if (mapMode === 'leaflet') {
      // Try to load Google Maps
      attemptLoadGoogleMaps().then((success) => {
        if (success) {
          setMapMode('google');
        } else {
          // If Google Maps fails, try static map
          setMapMode('static');
        }
      });
    } else {
      // From static map, go back to Leaflet
      setMapMode('leaflet');
    }
  };

  if (mapError) {
    return (
      <div className="w-full h-full rounded-lg shadow-lg flex items-center justify-center bg-gray-100">
        <div className="text-center p-6 max-w-md">
          {!iconError ? (
            <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" onError={() => setIconError(true)} />
          ) : (
            <AlertTriangleIcon size={48} className="text-amber-500 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Loading Error</h3>
          <p className="text-gray-600">{mapError}</p>
          <button 
            onClick={() => {
              setMapError(null);
              setMapMode('leaflet');
              setIsLoading(false);
            }}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Use Leaflet Map
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full" style={{ height: height, minHeight: '300px' }}>
        <div className="w-full h-full rounded-lg shadow-lg flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="mt-2 text-gray-600">Loading Map...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get participant locations for Leaflet
  const participantLocations = participants
    .filter(p => p.location)
    .map(p => p.location!);

  // The MapContent component renders the appropriate map based on the current mode
  return (
    <div className="w-full" style={{ height: height, minHeight: '300px' }}>
      <div className="mb-2 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setMapMode('leaflet')}
            className={`px-4 py-2 text-xs font-medium rounded-l-lg ${
              mapMode === 'leaflet'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border border-gray-200`}
          >
            OpenStreetMap
          </button>
          <button
            type="button"
            onClick={() => { 
              attemptLoadGoogleMaps();
            }}
            className={`px-4 py-2 text-xs font-medium ${
              mapMode === 'google'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border-t border-b border-r border-gray-200`}
          >
            Google Maps
          </button>
          <button
            type="button"
            onClick={() => setMapMode('static')}
            className={`px-4 py-2 text-xs font-medium rounded-r-lg ${
              mapMode === 'static'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border-t border-b border-r border-gray-200`}
          >
            Static Map
          </button>
        </div>
      </div>

      {mapMode === 'google' && (
        <div ref={mapRef} style={{ width: width, height: height }} className="rounded-lg shadow-lg" />
      )}
      
      {mapMode === 'leaflet' && (
        <LeafletMap 
          center={meetingPoint || center}
          zoom={zoom}
          markers={participantLocations}
          meetingPoint={meetingPoint}
          destination={destination}
          width={width}
          height={height}
        />
      )}
      
      {mapMode === 'static' && (
        <StaticMap
          center={meetingPoint || center}
          zoom={zoom}
          markers={participantLocations}
          meetingPoint={meetingPoint}
          width={width}
          height={height}
        />
      )}
    </div>
  );
};

export default Map;
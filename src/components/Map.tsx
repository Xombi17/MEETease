// Add Window interface extension at the top
declare global {
  interface Window {
    GOOGLE_MAPS_API_KEY?: string;
    googleMapsLoaded?: boolean;
    googleMapsCallback?: () => void;
  }
}

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import { AlertTriangleIcon } from './fallback/FallbackIcons';
import { Location, MUMBAI_CENTER } from '../types/maps';
import { useMeetingStore } from '../store/meetingStore';
import StaticMap from './fallback/StaticMap';

// Simple helper function to check if Google Maps is loaded
const isGoogleMapsLoaded = () => {
  return typeof window !== 'undefined' && window.google && window.google.maps;
};

interface MapProps {
  center?: Location;
  zoom?: number;
}

const Map: React.FC<MapProps> = ({ center = MUMBAI_CENTER, zoom = 12 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer[]>([]);
  const locationUpdateIntervalRef = useRef<number[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iconError, setIconError] = useState(false);
  const [useStaticMap, setUseStaticMap] = useState<boolean>(true);
  const [iframeAttemptMade, setIframeAttemptMade] = useState<boolean>(false);
  
  const { participants, meetingPoint, destination, updateParticipantLocation, updateDirections } = useMeetingStore();

  // Function to attempt loading Google Maps dynamically
  const attemptLoadGoogleMaps = () => {
    if (isGoogleMapsLoaded()) return Promise.resolve(true);
    
    return new Promise<boolean>((resolve) => {
      // Only create a new script if none exists
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        window.googleMapsCallback = () => resolve(true);
        return;
      }
      
      // Define the callback function for the script
      window.googleMapsCallback = () => {
        console.log('Google Maps loaded via dynamic script');
        resolve(true);
      };
      
      // Create and insert the script
      try {
        const apiKey = window.GOOGLE_MAPS_API_KEY || 'AIzaSyA0xt9YcmzryG50eu70TD5fx-Ba-KhPmYI';
        
        // Try different domains to bypass ad blockers
        const domains = [
          'maps.googleapis.com',
          'maps.google.com',
          'www.googleapis.com'
        ];
        
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://${domains[0]}/maps/api/js?key=${apiKey}&callback=googleMapsCallback&libraries=places`;
        script.async = true;
        script.defer = true;
        
        // Handle loading error
        script.onerror = () => {
          // Try next domain
          if (domains.length > 1) {
            domains.shift();
            script.src = `https://${domains[0]}/maps/api/js?key=${apiKey}&callback=googleMapsCallback&libraries=places`;
          } else {
            console.error('Failed to load Google Maps from all domains');
            resolve(false);
          }
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error adding Google Maps script:', error);
        resolve(false);
      }
    });
  };

  // Use direct iframe as fallback
  const useFallbackIframe = () => {
    if (!mapRef.current) return false;
    
    try {
      const apiKey = window.GOOGLE_MAPS_API_KEY || 'AIzaSyA0xt9YcmzryG50eu70TD5fx-Ba-KhPmYI';
      
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
    // Always start with static map for immediate display
    // Then attempt to load Google Maps after a delay
    const timeoutId = setTimeout(() => {
      attemptLoadGoogleMaps().then((success) => {
        if (success) {
          setUseStaticMap(false);
          
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
                setUseStaticMap(true);
              }
            }
          }, 0);
        } else if (!iframeAttemptMade) {
          // Try iframe fallback if Google Maps failed to load
          if (!useFallbackIframe()) {
            setMapError('Unable to load maps. Please disable ad blockers for full map features.');
          }
        }
        setIsLoading(false);
      });
    }, 1000);  // 1 second delay to try Google Maps

    // Listen for the custom event from our HTML script loader
    const handleMapsLoaded = () => {
      console.log('Maps loaded event received');
      setUseStaticMap(false);
      
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
            setUseStaticMap(true);
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
    if (mapInstanceRef.current && meetingPoint && !useStaticMap) {
      updateMapWithMeetingPoint();
    }
  }, [meetingPoint, participants, useStaticMap]);

  // Handle switch to Google Maps if it becomes available
  useEffect(() => {
    if (isGoogleMapsLoaded() && useStaticMap) {
      setUseStaticMap(false);
    }
  }, [useStaticMap]);

  // Add a button to manually switch between map types
  const toggleMapType = () => {
    if (useStaticMap) {
      attemptLoadGoogleMaps().then((success) => {
        if (success) {
          setUseStaticMap(false);
        } else if (!iframeAttemptMade) {
          useFallbackIframe();
        }
      });
    } else {
      // Clean up the map instance before switching to static map
      if (mapInstanceRef.current) {
        // Clear all markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        
        // Clear all directions renderers
        directionsRendererRef.current.forEach(renderer => renderer.setMap(null));
        directionsRendererRef.current = [];
        
        mapInstanceRef.current = null;
      }
      setUseStaticMap(true);
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
              setUseStaticMap(true);
              setIsLoading(false);
            }}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Use Static Map
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full rounded-lg shadow-lg flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Use static map if Google Maps is not available
  if (useStaticMap) {
    return (
      <div className="relative w-full h-full">
        <StaticMap 
          center={center}
          markers={participants.map(p => p.location).filter((loc): loc is Location => !!loc)}
          meetingPoint={meetingPoint}
          destination={destination}
          zoom={zoom}
        />
        <button
          onClick={toggleMapType}
          className="absolute bottom-8 right-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1 rounded"
        >
          Try Google Maps
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />
      <button
        onClick={toggleMapType}
        className="absolute bottom-2 right-2 bg-white hover:bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded shadow"
      >
        Use Static Map
      </button>
    </div>
  );
};

export default Map;
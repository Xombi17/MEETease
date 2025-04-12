import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useMeetingStore } from '../store/meetingStore';
import { Location, MUMBAI_CENTER } from '../types/maps';
import { AlertTriangle } from 'lucide-react';
import { AlertTriangleIcon } from './fallback/FallbackIcons';

// Change the type to match what the loader.load() returns
let googleMapsLoadPromise: Promise<typeof google>;
export const getGoogleMapsLoadPromise = () => googleMapsLoadPromise;

interface MapProps {
  center?: Location;
  zoom?: number;
}

const Map: React.FC<MapProps> = ({ center = MUMBAI_CENTER, zoom = 12 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map>();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer[]>([]);
  const locationUpdateIntervalRef = useRef<number[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iconError, setIconError] = useState(false);
  
  const { participants, meetingPoint, destination, updateParticipantLocation, updateDirections } = useMeetingStore();

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        setIsLoading(true);
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        
        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places", "geometry"],
          // Use relative URL to avoid ad blockers
          mapIds: ["map_id"],
        });

        googleMapsLoadPromise = loader.load();
        await googleMapsLoadPromise;

        if (mapRef.current && !mapInstanceRef.current) {
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
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapError('Failed to load Google Maps. Please check your internet connection or try disabling ad blockers.');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();

    return () => {
      locationUpdateIntervalRef.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !meetingPoint || mapError) return;

    // Clear existing markers and directions renderers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    directionsRendererRef.current.forEach(renderer => renderer.setMap(null));
    directionsRendererRef.current = [];

    // Clear location update intervals
    locationUpdateIntervalRef.current.forEach(interval => clearInterval(interval));
    locationUpdateIntervalRef.current = [];

    // Add participant markers and calculate directions
    participants.forEach(participant => {
      if (participant.location) {
        // Create marker
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

        // Set up live location updates if sharing is enabled
        if (participant.isSharing) {
          const intervalId = window.setInterval(() => {
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition((position) => {
                const newLocation: Location = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  timestamp: Date.now()
                };
                updateParticipantLocation(participant.id, newLocation);
              });
            }
          }, 10000); // Update every 10 seconds
          locationUpdateIntervalRef.current.push(intervalId);
        }

        // Calculate directions to meeting point
        if (meetingPoint) {
          const directionsService = new google.maps.DirectionsService();
          const directionsRenderer = new google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: "#4F46E5",
              strokeOpacity: 0.6,
              strokeWeight: 4,
            }
          });
          directionsRendererRef.current.push(directionsRenderer);

          directionsService.route({
            origin: participant.location,
            destination: meetingPoint,
            travelMode: google.maps.TravelMode.DRIVING,
          }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              directionsRenderer.setDirections(result);
              updateDirections(participant.id, result);
            }
          });
        }
      }
    });

    // Add meeting point marker
    if (meetingPoint) {
      const marker = new google.maps.Marker({
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
      markersRef.current.push(marker);
    }

    // Add destination marker and calculate directions from meeting point
    if (destination && meetingPoint) {
      const marker = new google.maps.Marker({
        position: destination,
        map: mapInstanceRef.current,
        title: "Destination",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#EF4444",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
        }
      });
      markersRef.current.push(marker);

      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#EF4444",
          strokeOpacity: 0.6,
          strokeWeight: 4,
        }
      });
      directionsRendererRef.current.push(directionsRenderer);

      directionsService.route({
        origin: meetingPoint,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        }
      });
    }

    // Fit bounds to include all markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [participants, meetingPoint, destination, mapError]);

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
            onClick={() => window.location.reload()}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Reload Page
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

  return <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />;
};

export default Map;
import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useMeetingStore } from '../store/meetingStore';
import { Location, MUMBAI_CENTER } from '../types/maps';

let googleMapsLoadPromise: Promise<void>;
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
  
  const { participants, meetingPoint, destination, updateParticipantLocation, updateDirections } = useMeetingStore();

  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "geometry"]
    });

    googleMapsLoadPromise = loader.load();

    googleMapsLoadPromise.then(() => {
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
    });

    return () => {
      locationUpdateIntervalRef.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !meetingPoint) return;

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
  }, [participants, meetingPoint, destination]);

  return <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />;
};

export default Map;
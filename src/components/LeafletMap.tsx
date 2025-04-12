import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '../types';

interface LeafletMapProps {
  width?: string;
  height?: string;
  center?: Location;
  zoom?: number;
  meetingPoint?: Location;
  participants?: Array<{ id: string; name: string; location?: Location }>;
  onMapLoad?: () => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  width = '100%',
  height = '400px',
  center = { lat: 51.505, lng: -0.09 },
  zoom = 13,
  meetingPoint,
  participants = [],
  onMapLoad,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView(
        [center.lat, center.lng],
        zoom
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapLoaded(true);
      if (onMapLoad) onMapLoad();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map center and zoom when props change
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, mapLoaded]);

  // Update markers when meeting point or participants change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      marker.remove();
    });
    markersRef.current = {};

    // Add meeting point marker
    if (meetingPoint) {
      const meetingIcon = L.divIcon({
        className: 'meeting-point-marker',
        html: '<div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">M</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const meetingMarker = L.marker([meetingPoint.lat, meetingPoint.lng], {
        icon: meetingIcon,
      }).addTo(mapRef.current);
      
      meetingMarker.bindPopup('Meeting Point');
      markersRef.current['meetingPoint'] = meetingMarker;
    }

    // Add participant markers
    participants.forEach((participant, index) => {
      if (participant.location) {
        const participantIcon = L.divIcon({
          className: 'participant-marker',
          html: `<div class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">${index + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(
          [participant.location.lat, participant.location.lng],
          { icon: participantIcon }
        ).addTo(mapRef.current);
        
        marker.bindPopup(participant.name || `Participant ${index + 1}`);
        markersRef.current[participant.id] = marker;
      }
    });

    // Fit bounds to include all markers if we have any
    if (Object.keys(markersRef.current).length > 0) {
      const markers = Object.values(markersRef.current);
      const bounds = L.featureGroup(markers).getBounds();
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [meetingPoint, participants, mapLoaded]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ width, height, position: 'relative' }}
      className="rounded-lg overflow-hidden border border-gray-300"
    />
  );
};

export default LeafletMap; 
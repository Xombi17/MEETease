import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Location } from '../../types/maps';

// Fix for default marker icons in Leaflet with bundlers
// We need to manually set the path to marker images
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

// Helper to determine meeting point type from address
const getMeetingPointType = (address: string | undefined): 'restaurant' | 'cafe' | 'park' | 'shopping' | 'transport' | 'default' => {
  if (!address) return 'default';
  
  const lowerAddress = address.toLowerCase();
  
  if (lowerAddress.includes('restaurant') || lowerAddress.includes('food') || lowerAddress.includes('diner')) {
    return 'restaurant';
  } else if (lowerAddress.includes('cafe') || lowerAddress.includes('coffee') || lowerAddress.includes('tea')) {
    return 'cafe';
  } else if (lowerAddress.includes('park') || lowerAddress.includes('garden') || lowerAddress.includes('playground')) {
    return 'park';
  } else if (lowerAddress.includes('mall') || lowerAddress.includes('shop') || lowerAddress.includes('store')) {
    return 'shopping';
  } else if (lowerAddress.includes('station') || lowerAddress.includes('bus') || lowerAddress.includes('terminal')) {
    return 'transport';
  }
  
  return 'default';
};

// Get icon HTML for meeting point
const getMeetingPointIconHtml = (type: 'restaurant' | 'cafe' | 'park' | 'shopping' | 'transport' | 'default'): string => {
  const iconColors = {
    restaurant: '#EF4444', // Red
    cafe: '#F59E0B',      // Amber
    park: '#10B981',      // Green
    shopping: '#8B5CF6',  // Purple
    transport: '#3B82F6', // Blue
    default: '#10B981'    // Green
  };
  
  const iconSymbols = {
    restaurant: '🍽️',
    cafe: '☕',
    park: '🌳',
    shopping: '🛍️',
    transport: '🚉',
    default: '📍'
  };
  
  return `
    <div style="display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <div style="background-color: ${iconColors[type]}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px;">
        ${iconSymbols[type]}
      </div>
      <div style="transform: translateY(-50%) rotate(45deg); width: 12px; height: 12px; background-color: ${iconColors[type]}; position: relative; top: -6px;"></div>
    </div>
  `;
};

interface LeafletMapProps {
  center: Location;
  markers?: Location[];
  meetingPoint?: Location;
  destination?: Location;
  zoom?: number;
  width?: string;
  height?: string;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  markers = [],
  meetingPoint,
  destination,
  zoom = 12,
  width = '100%',
  height = '100%'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Fix Leaflet icon paths
    fixLeafletIcons();

    // Initialize Leaflet map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([center.lat, center.lng], zoom);
      
      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    } else {
      // Update center and zoom if map already exists
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Add meeting point marker with appropriate type
    if (meetingPoint) {
      const meetingPointType = getMeetingPointType(meetingPoint.address);
      
      const meetingIcon = L.divIcon({
        className: 'custom-div-icon',
        html: getMeetingPointIconHtml(meetingPointType),
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });
      
      const marker = L.marker([meetingPoint.lat, meetingPoint.lng], { icon: meetingIcon })
        .addTo(mapInstanceRef.current);
      
      if (meetingPoint.address) {
        marker.bindPopup(`<b>Meeting Point</b><br>${meetingPoint.address}`);
      } else {
        marker.bindPopup('<b>Meeting Point</b>');
      }
      
      markersRef.current.push(marker);
    }
    
    // Add destination marker (red)
    if (destination) {
      const destIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #EF4444; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      const marker = L.marker([destination.lat, destination.lng], { icon: destIcon })
        .addTo(mapInstanceRef.current);
      
      if (destination.address) {
        marker.bindPopup(`<b>Destination</b><br>${destination.address}`);
      } else {
        marker.bindPopup('<b>Destination</b>');
      }
      
      markersRef.current.push(marker);
    }
    
    // Add participant markers (blue)
    if (markers && markers.length > 0) {
      markers.forEach((marker, index) => {
        if (!marker) return;
        
        const participantIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #4F46E5; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        
        const markerInstance = L.marker([marker.lat, marker.lng], { icon: participantIcon })
          .addTo(mapInstanceRef.current!);
        
        if (marker.address) {
          markerInstance.bindPopup(`<b>Participant ${index + 1}</b><br>${marker.address}`);
        } else {
          markerInstance.bindPopup(`<b>Participant ${index + 1}</b>`);
        }
        
        markersRef.current.push(markerInstance);
      });
    }

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [30, 30] });
    }

    // Clean up function
    return () => {
      if (mapInstanceRef.current) {
        // Clear markers on unmount
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
      }
    };
  }, [center, zoom, markers, meetingPoint, destination]);

  // Add a legend for the map that explains the marker types
  const renderLegend = () => {
    return (
      <div className="absolute bottom-10 left-2 z-20 bg-white/90 p-2 rounded-lg shadow text-xs max-w-xs">
        <div className="font-semibold text-gray-700 mb-1">Map Legend</div>
        <div className="grid grid-cols-1 gap-1">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-600 mr-1.5"></div>
            <span>Participants</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-600 mr-1.5"></div>
            <span>Meeting Point</span>
          </div>
          {destination && (
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-600 mr-1.5"></div>
              <span>Destination</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="leaflet-container" style={{ width, height, position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} className="rounded-lg shadow-lg" />
      
      {renderLegend()}
      
      {/* Credit banner */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 text-black text-xs py-1 px-2 text-center">
        <p>Map by <a href="https://www.openstreetmap.org/copyright" className="text-blue-600" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> | Ad-blocker friendly!</p>
      </div>
    </div>
  );
};

export default LeafletMap; 
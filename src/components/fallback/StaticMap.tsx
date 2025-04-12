import React, { useEffect, useRef } from 'react';
import { Location } from '../../types/maps';

interface StaticMapProps {
  center: Location;
  markers?: Location[];
  meetingPoint?: Location;
  destination?: Location;
  zoom?: number;
  width?: string;
  height?: string;
}

// A completely static fallback map that uses pure Canvas rendering
// This bypasses ad blockers as it doesn't load external resources
const StaticMap: React.FC<StaticMapProps> = ({
  center,
  markers = [],
  meetingPoint,
  destination,
  zoom = 12,
  width = '100%',
  height = '100%'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert lat/lng to pixel coordinates (very simplified)
  const latLngToPoint = (lat: number, lng: number, centerLat: number, centerLng: number, zoom: number, width: number, height: number) => {
    // Simple mercator projection (very approximate)
    const scale = Math.pow(2, zoom) * 256;
    const worldCoordX = scale * (0.5 + lng / 360);
    const worldCoordY = scale * (0.5 - Math.log(Math.tan((lat + 90) * Math.PI / 360)) / (2 * Math.PI));
    
    const centerWorldX = scale * (0.5 + centerLng / 360);
    const centerWorldY = scale * (0.5 - Math.log(Math.tan((centerLat + 90) * Math.PI / 360)) / (2 * Math.PI));
    
    return {
      x: width / 2 + (worldCoordX - centerWorldX),
      y: height / 2 + (worldCoordY - centerWorldY)
    };
  };

  // Draw the map
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    // Set canvas size to match container
    const rect = containerRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw a simple map background
    const width = canvas.width;
    const height = canvas.height;
    
    // Background
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, width, height);
    
    // Draw a grid for streets
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    
    // Grid spacing based on zoom level
    const gridSize = 40 / Math.pow(2, zoom - 10);
    
    // Horizontal grid lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Add some random "blocks" for visual interest
    ctx.fillStyle = '#d1d5db';
    const blockSize = gridSize * 0.8;
    const blockCount = 40;
    
    for (let i = 0; i < blockCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, blockSize, blockSize);
    }
    
    // Draw markers
    if (markers && markers.length > 0) {
      markers.forEach(marker => {
        if (!marker) return;
        
        const point = latLngToPoint(
          marker.lat, 
          marker.lng, 
          center.lat, 
          center.lng, 
          zoom, 
          width, 
          height
        );
        
        // Participant marker (blue dot)
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#4F46E5';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
    
    // Draw meeting point
    if (meetingPoint) {
      const point = latLngToPoint(
        meetingPoint.lat, 
        meetingPoint.lng, 
        center.lat, 
        center.lng, 
        zoom, 
        width, 
        height
      );
      
      // Meeting point marker (green dot)
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#10B981';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw destination
    if (destination) {
      const point = latLngToPoint(
        destination.lat, 
        destination.lng, 
        center.lat, 
        center.lng, 
        zoom, 
        width, 
        height
      );
      
      // Destination marker (red dot)
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw "You are here" text at center
    const centerPoint = { x: width / 2, y: height / 2 };
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('Map blocked by ad blocker', centerPoint.x, centerPoint.y - 20);
    ctx.fillText('Showing approximate locations', centerPoint.x, centerPoint.y - 5);
    
    // Add map legend
    const legendX = 20;
    let legendY = height - 20;
    
    // Legend title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.fillText('Legend:', legendX, legendY);
    legendY -= 20;
    
    // User marker
    ctx.beginPath();
    ctx.arc(legendX + 8, legendY + 4, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#4F46E5';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#000000';
    ctx.fillText('Participants', legendX + 20, legendY + 8);
    legendY -= 20;
    
    // Meeting point marker
    if (meetingPoint) {
      ctx.beginPath();
      ctx.arc(legendX + 8, legendY + 4, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#10B981';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#000000';
      ctx.fillText('Meeting Point', legendX + 20, legendY + 8);
      legendY -= 20;
    }
    
    // Destination marker
    if (destination) {
      ctx.beginPath();
      ctx.arc(legendX + 8, legendY + 4, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#000000';
      ctx.fillText('Destination', legendX + 20, legendY + 8);
    }
  };

  // Redraw map on resize
  useEffect(() => {
    drawMap();
    
    const handleResize = () => {
      drawMap();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [center, markers, meetingPoint, destination, zoom]);

  return (
    <div 
      ref={containerRef} 
      style={{ width, height, position: 'relative' }}
      className="rounded-lg shadow-lg overflow-hidden"
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Map attribution and disclaimer */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2 text-center">
        <p>Static map rendering (Google Maps is blocked by ad blocker)</p>
      </div>
      
      {/* "Disable Ad Blocker" message */}
      <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs p-2 rounded-bl-lg">
        <p className="font-semibold">For full map features:</p>
        <p>Please disable ad blocker for this site</p>
      </div>
    </div>
  );
};

export default StaticMap; 
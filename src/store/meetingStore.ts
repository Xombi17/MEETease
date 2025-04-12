import { create } from 'zustand';
import { MeetingState, Location, Participant, MUMBAI_CENTER, MeetingSettings } from '../types/maps';

// Helper function to generate a unique ID
const generateUniqueId = (): string => {
  // Use a combination of timestamp and random string
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper function to find nearby places using OpenStreetMap/Nominatim API
const findNearbyPlacesOSM = async (centerLat: number, centerLng: number): Promise<Location | null> => {
  try {
    // Query for amenities near the centroid - expanded types of places
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=cafe+OR+restaurant+OR+park+OR+mall+OR+station&limit=5&lat=${centerLat}&lon=${centerLng}&radius=1000`,
      {
        headers: {
          'User-Agent': 'MEETease App'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from OSM');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      // Use the first result
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name
      };
    }
    
    // Fallback to reverse geocoding to find the nearest address
    const reverseResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${centerLat}&lon=${centerLng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MEETease App'
        }
      }
    );
    
    if (!reverseResponse.ok) {
      throw new Error('Failed to reverse geocode from OSM');
    }
    
    const reverseData = await reverseResponse.json();
    
    if (reverseData && reverseData.display_name) {
      return {
        lat: parseFloat(reverseData.lat),
        lng: parseFloat(reverseData.lon),
        address: reverseData.display_name
      };
    }
    
    // Last resort: use the centroid with a generic address
    return {
      lat: centerLat,
      lng: centerLng,
      address: "Meeting Point"
    };
  } catch (error) {
    console.error('Error finding nearby places via OSM:', error);
    
    // Last resort: use the centroid with a generic address
    return {
      lat: centerLat,
      lng: centerLng,
      address: "Meeting Point (Approximate)"
    };
  }
};

// Helper function to find nearby places using Google Places API
const findNearbyPlacesGoogle = async (centerLat: number, centerLng: number): Promise<Location | null> => {
  // Check if Google Maps is loaded
  if (typeof window === 'undefined' || !window.google || !window.google.maps) {
    console.warn('Google Maps not loaded, falling back to OSM');
    return findNearbyPlacesOSM(centerLat, centerLng);
  }

  try {
    return new Promise((resolve) => {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      // First try to find cafes, restaurants, or public places
      service.nearbySearch({
        location: { lat: centerLat, lng: centerLng },
        radius: 1000, // 1km radius
        // Look for good meeting place types - pass just one type here
        type: 'restaurant' // Primary search type
        // We'll search for other types separately in our fallback logic
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          // Sort results by distance from center
          results.sort((a, b) => {
            if (!a.geometry?.location || !b.geometry?.location) return 0;
            
            const distA = google.maps.geometry.spherical.computeDistanceBetween(
              new google.maps.LatLng(centerLat, centerLng),
              a.geometry.location
            );
            const distB = google.maps.geometry.spherical.computeDistanceBetween(
              new google.maps.LatLng(centerLat, centerLng),
              b.geometry.location
            );
            return distA - distB;
          });
          
          // Use the nearest result
          const place = results[0];
          if (place && place.geometry && place.geometry.location) {
            const placeLocation: Location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.name + (place.vicinity ? `, ${place.vicinity}` : ''),
            };
            
            resolve(placeLocation);
          } else {
            console.warn('Invalid place result, trying transit stations');
            tryTransitStations();
          }
        } else {
          console.warn('No cafes/restaurants found, trying transit stations', status);
          tryTransitStations();
        }
      });

      // Second fallback: try to find transit stations or public landmarks
      const tryTransitStations = () => {
        service.nearbySearch({
          location: { lat: centerLat, lng: centerLng },
          radius: 1000,
          type: 'transit_station' // Primary transit type
        }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            results.sort((a, b) => {
              if (!a.geometry?.location || !b.geometry?.location) return 0;
              
              const distA = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(centerLat, centerLng),
                a.geometry.location
              );
              const distB = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(centerLat, centerLng),
                b.geometry.location
              );
              return distA - distB;
            });
            
            const place = results[0];
            if (place && place.geometry && place.geometry.location) {
              const placeLocation: Location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.name + (place.vicinity ? `, ${place.vicinity}` : ''),
              };
              
              resolve(placeLocation);
            } else {
              console.warn('Invalid transit station result, falling back to roads');
              reverseGeocode();
            }
          } else {
            console.warn('No transit stations found, falling back to roads', status);
            reverseGeocode();
          }
        });
      };

      // Last fallback: use reverse geocoding to get the nearest road/landmark
      const reverseGeocode = () => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: centerLat, lng: centerLng } },
          (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
              const place = results[0];
              if (place && place.geometry && place.geometry.location) {
                const placeLocation: Location = {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                  address: place.formatted_address || "Meeting Point",
                };
                
                resolve(placeLocation);
              } else {
                console.warn('Invalid geocoder result, falling back to OSM');
                findNearbyPlacesOSM(centerLat, centerLng).then(resolve);
              }
            } else {
              console.warn('Geocoding failed, falling back to OSM', status);
              findNearbyPlacesOSM(centerLat, centerLng).then(resolve);
            }
          }
        );
      };
    });
  } catch (error) {
    console.error('Error finding nearby places via Google:', error);
    return findNearbyPlacesOSM(centerLat, centerLng);
  }
};

export const useMeetingStore = create<MeetingState>((set, get) => ({
  participants: [],
  meetingPoint: undefined,
  destination: undefined,
  settings: {
    preferLeaflet: true // Default to prefer Leaflet for maps
  },

  addParticipant: (name: string, id?: string) => set((state) => {
    // Check if there's already a participant with this name
    const existingParticipant = state.participants.find(p => p.name === name);
    
    // If participant already exists, return existing state
    if (existingParticipant) {
      return { participants: state.participants };
    }
    
    // Otherwise, add new participant
    return {
      participants: [...state.participants, {
        id: id || generateUniqueId(),
        name,
        isReady: false,
        isSharing: false,
      }]
    };
  }),

  removeParticipant: (id: string) => set((state) => ({
    participants: state.participants.filter((p) => p.id !== id),
  })),

  updateParticipantLocation: (id: string, location: Location) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === id ? { 
        ...p, 
        location: { ...location, timestamp: Date.now() }, 
        isReady: true 
      } : p
    ),
  })),

  setMeetingPoint: (location: Location) => set({ meetingPoint: location }),
  
  setDestination: (location: Location) => set({ destination: location }),

  toggleLocationSharing: (id: string) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === id ? { ...p, isSharing: !p.isSharing } : p
    ),
  })),

  updateDirections: (id: string, directions: google.maps.DirectionsResult) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === id ? { ...p, directions } : p
    ),
  })),

  calculateMeetingPoint: async () => {
    const state = get();
    const readyParticipants = state.participants.filter(p => p.location);
    
    if (readyParticipants.length === 0) return;

    // Calculate the centroid of all participant locations
    const totalLat = readyParticipants.reduce((sum, p) => sum + (p.location?.lat || 0), 0);
    const totalLng = readyParticipants.reduce((sum, p) => sum + (p.location?.lng || 0), 0);
    const count = readyParticipants.length;

    let centerLat = totalLat / count;
    let centerLng = totalLng / count;

    // If there's a destination, adjust the center point to be between participants and destination
    if (state.destination) {
      centerLat = (centerLat + state.destination.lat) / 2;
      centerLng = (centerLng + state.destination.lng) / 2;
    }

    // Set a temporary centroid point while we find a better meeting point
    state.setMeetingPoint({
      lat: centerLat,
      lng: centerLng,
      address: "Calculating optimal meeting point..."
    });

    try {
      // First try OpenStreetMap/Nominatim for place finding (more ad-blocker friendly)
      let meetingPlace = await findNearbyPlacesOSM(centerLat, centerLng);
      
      // Fallback to Google Places API if OSM fails and Google Maps is loaded
      if (!meetingPlace && typeof window !== 'undefined' && window.google && window.google.maps) {
        console.log('Falling back to Google Places API for meeting point');
        meetingPlace = await findNearbyPlacesGoogle(centerLat, centerLng);
      }
      
      if (meetingPlace) {
        // Update the meeting point with the found place
        state.setMeetingPoint(meetingPlace);
      }
    } catch (error) {
      console.error("Error finding meeting point:", error);
      
      // Fallback to centroid if place search failed
      state.setMeetingPoint({
        lat: centerLat,
        lng: centerLng,
        address: "Meeting Point (Approximate)"
      });
    }
  },

  updateSettings: (settings: Partial<MeetingSettings>) => set((state) => ({
    settings: { ...state.settings, ...settings } as MeetingSettings
  })),
}));
import { create } from 'zustand';
import { MeetingState, Location, Participant, MUMBAI_CENTER } from '../types/maps';

export const useMeetingStore = create<MeetingState>((set, get) => ({
  participants: [],
  meetingPoint: undefined,
  destination: undefined,

  addParticipant: (name: string, id?: string) => set((state) => ({
    participants: [...state.participants, {
      id: id || crypto.randomUUID(),
      name,
      isReady: false,
      isSharing: false,
    }]
  })),

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

  calculateMeetingPoint: () => {
    const state = get();
    const readyParticipants = state.participants.filter(p => p.location);
    
    if (readyParticipants.length === 0) return;

    // Calculate the centroid of all participant locations
    const totalLat = readyParticipants.reduce((sum, p) => sum + (p.location?.lat || 0), 0);
    const totalLng = readyParticipants.reduce((sum, p) => sum + (p.location?.lng || 0), 0);
    const count = readyParticipants.length;

    const meetingPoint: Location = {
      lat: totalLat / count,
      lng: totalLng / count,
    };

    // If there's a destination, adjust the meeting point to be between participants and destination
    if (state.destination) {
      meetingPoint.lat = (meetingPoint.lat + state.destination.lat) / 2;
      meetingPoint.lng = (meetingPoint.lng + state.destination.lng) / 2;
    }

    state.setMeetingPoint(meetingPoint);
  },
}));
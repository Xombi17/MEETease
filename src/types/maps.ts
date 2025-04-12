export interface Location {
  lat: number;
  lng: number;
  address?: string;
  timestamp?: number;
}

export interface Participant {
  id: string;
  name: string;
  location?: Location;
  isReady: boolean;
  isSharing: boolean;
  directions?: google.maps.DirectionsResult;
}

export interface MeetingState {
  participants: Participant[];
  meetingPoint?: Location;
  destination?: Location;
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  updateParticipantLocation: (id: string, location: Location) => void;
  setMeetingPoint: (location: Location) => void;
  setDestination: (location: Location) => void;
  calculateMeetingPoint: () => void;
  toggleLocationSharing: (id: string) => void;
  updateDirections: (id: string, directions: google.maps.DirectionsResult) => void;
}

export const MUMBAI_CENTER: Location = {
  lat: 19.0760,
  lng: 72.8777,
  address: "Mumbai, Maharashtra, India"
};
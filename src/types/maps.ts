export interface Location {
  lat: number;
  lng: number;
  address?: string;
  timestamp?: number;
  participantId?: string;
}

export interface Participant {
  id: string;
  name: string;
  location?: Location;
  isReady: boolean;
  isSharing: boolean;
  directions?: google.maps.DirectionsResult;
}

export interface MeetingSettings {
  preferLeaflet: boolean;
}

export interface MeetingState {
  participants: Participant[];
  meetingPoint?: Location;
  destination?: Location;
  settings?: MeetingSettings;
  
  addParticipant: (name: string, id?: string) => void;
  removeParticipant: (id: string) => void;
  updateParticipantLocation: (id: string, location: Location) => void;
  setMeetingPoint: (location: Location) => void;
  setDestination: (location: Location) => void;
  toggleLocationSharing: (id: string) => void;
  updateDirections: (id: string, directions: google.maps.DirectionsResult) => void;
  calculateMeetingPoint: () => void;
  updateSettings?: (settings: Partial<MeetingSettings>) => void;
}

export const MUMBAI_CENTER: Location = {
  lat: 19.0760,
  lng: 72.8777,
  address: "Mumbai, Maharashtra, India"
};
import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, Database } from "firebase/database";

// Check if Firebase environment variables are configured
const isFirebaseConfigured = () => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_DATABASE_URL &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
};

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase with error handling
let app: FirebaseApp | undefined;
let database: Database | undefined;

try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase configuration missing. Running in development mode.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Meeting session functions
export const createMeetingSession = async (sessionCode: string) => {
  if (!database) {
    console.warn("Firebase not initialized. Simulating createMeetingSession.");
    return sessionCode;
  }

  const sessionRef = ref(database, `meetings/${sessionCode}`);
  await set(sessionRef, {
    createdAt: new Date().toISOString(),
    active: true,
    participants: {},
    meetingPoint: null,
    destination: null
  });
  return sessionCode;
};

export const joinMeetingSession = async (sessionCode: string, participantId: string, name: string) => {
  if (!database) {
    console.warn("Firebase not initialized. Simulating joinMeetingSession.");
    return;
  }

  const participantRef = ref(database, `meetings/${sessionCode}/participants/${participantId}`);
  await set(participantRef, {
    id: participantId,
    name,
    isReady: false,
    isSharing: false,
    joinedAt: new Date().toISOString()
  });
};

export const updateParticipantLocation = async (
  sessionCode: string, 
  participantId: string, 
  location: { lat: number; lng: number }
) => {
  if (!database) {
    console.warn("Firebase not initialized. Simulating updateParticipantLocation.");
    return;
  }

  const locationRef = ref(database, `meetings/${sessionCode}/participants/${participantId}`);
  await update(locationRef, {
    location: {
      ...location,
      timestamp: Date.now()
    },
    isReady: true
  });
};

export const updateMeetingPoint = async (sessionCode: string, meetingPoint: { lat: number; lng: number }) => {
  if (!database) {
    console.warn("Firebase not initialized. Simulating updateMeetingPoint.");
    return;
  }

  const meetingPointRef = ref(database, `meetings/${sessionCode}/meetingPoint`);
  await set(meetingPointRef, meetingPoint);
};

export const updateDestination = async (sessionCode: string, destination: { lat: number; lng: number }) => {
  if (!database) {
    console.warn("Firebase not initialized. Simulating updateDestination.");
    return;
  }

  const destinationRef = ref(database, `meetings/${sessionCode}/destination`);
  await set(destinationRef, destination);
};

export const listenToMeetingChanges = (sessionCode: string, callback: (data: any) => void) => {
  if (!database) {
    console.warn("Firebase not initialized. Simulating listenToMeetingChanges.");
    return () => {}; // Return empty unsubscribe function
  }

  const meetingRef = ref(database, `meetings/${sessionCode}`);
  const unsubscribe = onValue(meetingRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
  
  return unsubscribe;
};

export { database, ref, onValue, set, update }; 
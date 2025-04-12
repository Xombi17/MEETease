import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Users, Map as MapIcon, ArrowRight, ChevronRight, Clock, Route, Share2, Star, Menu, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './components/Map';
import ParticipantList from './components/ParticipantList';
import LocationSearch from './components/LocationSearch';
import { useMeetingStore } from './store/meetingStore';
import type { Location } from './types/maps';
import { 
  createMeetingSession, 
  joinMeetingSession, 
  updateParticipantLocation as updateFirebaseLocation,
  updateMeetingPoint,
  updateDestination as updateFirebaseDestination,
  listenToMeetingChanges
} from './firebase';

function App() {
  const [showApp, setShowApp] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionCode, setSessionCode] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const { 
    participants, 
    setDestination, 
    updateParticipantLocation, 
    addParticipant,
    setMeetingPoint
  } = useMeetingStore();

  // Generate a random user ID on first load
  useEffect(() => {
    // Generate a random user ID if not already set
    if (!userId) {
      setUserId(crypto.randomUUID());
    }

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isCreatingSession || isJoiningSession) {
        setIsCreatingSession(false);
        setIsJoiningSession(false);
        alert('Connection timed out. Please check your Firebase configuration and try again.');
      }
    }, 5000);

    return () => clearTimeout(safetyTimeout);
  }, [isCreatingSession, isJoiningSession]);

  const handleParticipantLocation = (participantId: string) => (location: Location) => {
    // Update local state
    updateParticipantLocation(participantId, location);
    
    // Update Firebase if we're in an active session
    if (isSessionActive && sessionCode) {
      updateFirebaseLocation(sessionCode, participantId, location);
    }
  };

  const generateSessionCode = () => {
    // Generate a random 6-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleCreateSession = async () => {
    if (!userName) {
      setIsNameModalOpen(true);
      return;
    }
    
    setIsCreatingSession(true);
    try {
      // Check if Firebase is configured
      if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_DATABASE_URL) {
        // If Firebase is not configured, simulate session creation for development
        console.warn('Firebase not configured. Running in development mode with simulated backend.');
        const newCode = generateSessionCode();
        setSessionCode(newCode);
        addParticipant(userName);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsCreatingSession(false);
        setIsSessionActive(true);
        return;
      }
      
      // Generate a random session code
      const newCode = generateSessionCode();
      
      // Create session in Firebase
      await createMeetingSession(newCode);
      
      // Add user as first participant in Firebase
      await joinMeetingSession(newCode, userId, userName);
      
      // Add self as participant in local state
      addParticipant(userName);
      
      setSessionCode(newCode);
      setupRealtimeSync(newCode);
      
      setIsCreatingSession(false);
      setIsSessionActive(true);
    } catch (error) {
      console.error('Error creating session:', error);
      setIsCreatingSession(false);
      alert('Failed to create meeting. Please try again.');
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode) return;
    if (!userName) {
      setIsNameModalOpen(true);
      return;
    }
    
    setIsJoiningSession(true);
    try {
      // Check if Firebase is configured
      if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_DATABASE_URL) {
        // If Firebase is not configured, simulate session joining for development
        console.warn('Firebase not configured. Running in development mode with simulated backend.');
        setSessionCode(joinCode);
        addParticipant(userName);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsJoiningSession(false);
        setIsSessionActive(true);
        return;
      }
      
      // Join session in Firebase
      await joinMeetingSession(joinCode, userId, userName);
      
      // Add self as participant in local state
      addParticipant(userName);
      
      setSessionCode(joinCode);
      setupRealtimeSync(joinCode);
      
      setIsJoiningSession(false);
      setIsSessionActive(true);
    } catch (error) {
      console.error('Error joining session:', error);
      setIsJoiningSession(false);
      alert('Failed to join meeting. Please check the code and try again.');
    }
  };
  
  // Setup realtime synchronization with Firebase
  const setupRealtimeSync = (code: string) => {
    // Skip Firebase sync if not configured
    if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_DATABASE_URL) {
      console.warn('Firebase not configured. Skipping realtime sync.');
      return () => {}; // Return empty cleanup function
    }
    
    try {
      // Listen to changes in the meeting data
      const unsubscribe = listenToMeetingChanges(code, (meetingData) => {
        // Update local state based on Firebase data
        if (meetingData.meetingPoint) {
          setMeetingPoint(meetingData.meetingPoint);
        }
        
        if (meetingData.destination) {
          setDestination(meetingData.destination);
        }
        
        // Sync participants
        if (meetingData.participants) {
          Object.values(meetingData.participants).forEach((participant: any) => {
            // Only update other participants' locations, not our own
            if (participant.id !== userId && participant.location) {
              updateParticipantLocation(participant.id, participant.location);
            }
          });
        }
      });
      
      // Clean up listener on component unmount
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('Error setting up realtime sync:', error);
      return () => {}; // Return empty cleanup function
    }
  };
  
  const handleDestinationChange = (location: Location) => {
    // Update local state
    setDestination(location);
    
    // Update Firebase if we're in an active session
    if (isSessionActive && sessionCode) {
      updateFirebaseDestination(sessionCode, location);
    }
  };

  if (!showApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 text-white overflow-hidden">
        {/* Navbar */}
        <nav className="relative z-10 border-b border-white/10 backdrop-blur-sm bg-black/20">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-indigo-600">
                <Navigation size={20} className="text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
                MEETease
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</a>
              <button 
                onClick={() => setShowApp(true)}
                className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-full text-white transition-colors"
              >
                Get Started
              </button>
            </div>
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden bg-black/30 backdrop-blur-lg border-b border-white/10"
              >
                <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                  <a href="#features" className="text-gray-300 hover:text-white transition-colors py-2">Features</a>
                  <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors py-2">How It Works</a>
                  <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors py-2">Testimonials</a>
                  <button 
                    onClick={() => setShowApp(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-full text-white transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="relative">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-600 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute top-40 right-10 w-72 h-72 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-600 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
              <svg className="absolute top-0 left-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"></path>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)"></rect>
              </svg>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12 relative z-10">
              {/* Hero Content */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-xl"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-900/50 border border-indigo-700 mb-6">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                  <span className="text-sm font-medium text-indigo-300">Real-time location sharing</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  Connect and <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">meet up</span> from anywhere
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  MEETease lets you connect multiple devices, share locations in real-time, and find the perfect meeting spot for everyone in your group.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowApp(true)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    Create Meeting
                    <ArrowRight size={20} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 border border-white/20"
                  >
                    How It Works
                    <ChevronRight size={20} />
                  </motion.button>
                </div>
              </motion.div>

              {/* Hero Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="hidden lg:block relative"
              >
                <div className="w-full aspect-square rounded-2xl bg-indigo-900/20 border border-indigo-800/50 backdrop-blur-sm p-6 shadow-2xl shadow-indigo-900/20 overflow-hidden">
                  <div className="w-full h-full rounded-xl relative bg-black/40 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-3/4 h-3/4">
                        {/* Map mock representation with multiple devices */}
                        <div className="absolute inset-0 bg-gray-800 rounded-xl overflow-hidden">
                          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100%" height="100%" fill="#1f2937"/>
                            <path d="M0 50 Q 25 25, 50 50 T 100 50 T 150 50 T 200 50" stroke="#4f46e5" strokeWidth="2" fill="none"/>
                            <path d="M0 70 Q 25 95, 50 70 T 100 70 T 150 70 T 200 70" stroke="#7c3aed" strokeWidth="2" fill="none"/>
                            <path d="M70 0 Q 95 25, 70 50 T 70 100 T 70 150 T 70 200" stroke="#ec4899" strokeWidth="2" fill="none"/>
                          </svg>
                        </div>
                        
                        {/* Multiple device frames with location markers */}
                        <div className="absolute top-0 left-0 w-1/2 h-1/2 transform -translate-x-1/4 -translate-y-1/4">
                          <div className="w-full h-full rounded-xl border-4 border-gray-700 bg-gray-800 p-2">
                            <div className="w-full h-full rounded-lg bg-gray-900 relative overflow-hidden">
                              <div className="absolute bottom-1/4 right-1/4 w-6 h-6">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center animate-bounce">
                                  <span className="block w-4 h-4 rounded-full bg-indigo-300"></span>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-indigo-500/30 absolute -top-3 -left-3 animate-ping"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="absolute bottom-0 right-0 w-3/5 h-3/5 transform translate-x-1/4 translate-y-1/4">
                          <div className="w-full h-full rounded-xl border-4 border-gray-700 bg-gray-800 p-2">
                            <div className="w-full h-full rounded-lg bg-gray-900 relative overflow-hidden">
                              <div className="absolute top-1/4 left-1/4 w-6 h-6">
                                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center animate-bounce animation-delay-1000">
                                  <span className="block w-4 h-4 rounded-full bg-purple-300"></span>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-purple-500/30 absolute -top-3 -left-3 animate-ping animation-delay-1000"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Central meeting point */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                            <span className="block w-6 h-6 rounded-full bg-green-300"></span>
                          </div>
                          <div className="w-16 h-16 rounded-full bg-green-500/30 absolute -top-4 -left-4 animate-ping"></div>
                        </div>
                        
                        {/* Connection lines */}
                        <svg className="absolute inset-0" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                          <line x1="25%" y1="25%" x2="50%" y2="50%" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4" className="animate-pulse"/>
                          <line x1="75%" y1="75%" x2="50%" y2="50%" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4" className="animate-pulse"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Features */}
          <motion.div 
            id="features"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="py-24"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose MEETease?</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Our app makes multi-device coordination effortless with smart features designed to connect people in real time.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <Share2 className="text-indigo-400" size={32} />,
                  title: "Real-time Sharing",
                  description: "Share your live location across multiple devices just like WhatsApp, but with more features."
                },
                {
                  icon: <MapIcon className="text-indigo-400" size={32} />,
                  title: "Smart Meeting Points",
                  description: "Automatically calculates the optimal meeting point based on everyone's location."
                },
                {
                  icon: <Users className="text-indigo-400" size={32} />,
                  title: "Multi-Device Support",
                  description: "Works on any device with a browser - no app installation required."
                },
                {
                  icon: <Route className="text-indigo-400" size={32} />,
                  title: "Dynamic Routing",
                  description: "Get personalized directions to the meeting point from your current location."
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors shadow-lg"
                >
                  <div className="w-14 h-14 rounded-full bg-indigo-900/50 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* How It Works */}
          <motion.div
            id="how-it-works"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="py-24"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How MEETease Works</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Connect across devices and find the perfect meeting spot in four easy steps.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-600 to-purple-600 ml-6 md:ml-8 lg:mx-auto lg:left-0 lg:right-0 lg:w-0.5"></div>
                
                {[
                  {
                    title: "Create a Meeting",
                    description: "Start a new meeting and share the unique meeting code with your friends.",
                    icon: <MapPin className="text-white" size={24} />
                  },
                  {
                    title: "Join From Any Device",
                    description: "Everyone joins using the meeting code from their phones, tablets, or computers.",
                    icon: <Users className="text-white" size={24} />
                  },
                  {
                    title: "Share Real-time Locations",
                    description: "All participants share their locations, which are visible on everyone's maps.",
                    icon: <Share2 className="text-white" size={24} />
                  },
                  {
                    title: "Find Your Meeting Point",
                    description: "The app calculates the optimal meeting spot and provides directions for everyone.",
                    icon: <MapIcon className="text-white" size={24} />
                  }
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="relative flex items-start mb-12 last:mb-0"
                  >
                    <div className="flex-shrink-0 relative z-10">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        {step.icon}
                      </div>
                    </div>
                    <div className="ml-6 lg:ml-12 pt-2">
                      <h3 className="text-xl md:text-2xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-gray-300">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Testimonials */}
          <motion.div
            id="testimonials"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="py-24"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What People Say</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Join thousands of happy users who have simplified their meetups with MEETease.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Alex Johnson",
                  role: "Group Organizer",
                  content: "MEETease has completely changed how I organize meetups with my friends. No more back-and-forth about where to meet!",
                  rating: 5
                },
                {
                  name: "Sarah Williams",
                  role: "Travel Enthusiast",
                  content: "I use this app every time my travel buddies and I meet in a new city. It saves us so much time and confusion.",
                  rating: 5
                },
                {
                  name: "Michael Chen",
                  role: "College Student",
                  content: "Perfect for study groups! We all come from different dorms, and MEETease helps us find a convenient spot every time.",
                  rating: 4
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-lg"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" />
                    ))}
                    {[...Array(5 - testimonial.rating)].map((_, i) => (
                      <Star key={i} size={18} className="text-gray-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="py-16 text-center"
          >
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-lg border border-indigo-800/50 rounded-2xl p-12 shadow-2xl shadow-indigo-900/20">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to simplify your meetups?</h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of users who have made group coordination effortless with MEETease.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowApp(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-4 rounded-full text-xl font-semibold inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                Start Using MEETease Now
                <ArrowRight size={20} />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 backdrop-blur-sm bg-black/20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <div className="p-2 rounded-full bg-indigo-600">
                  <Navigation size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold">MEETease</span>
              </div>
              <div className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} MEETease. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // New session management UI that appears before the main app
  if (!isSessionActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 text-white flex flex-col">
        <header className="border-b border-white/10 backdrop-blur-sm bg-black/20 px-4 py-4">
          <div className="container mx-auto flex items-center gap-2">
            <div className="p-2 rounded-full bg-indigo-600">
              <Navigation size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
              MEETease
            </span>
          </div>
        </header>
        
        {/* Name Input Modal */}
        {isNameModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-lg w-full max-w-md mx-4">
              <h2 className="text-2xl font-bold mb-4 text-center">What's your name?</h2>
              <p className="text-gray-300 mb-6 text-center">Enter your name to continue</p>
              
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name" 
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
                autoFocus
              />
              
              <div className="flex justify-end">
                <button
                  disabled={!userName.trim()}
                  onClick={() => {
                    if (userName.trim()) {
                      setIsNameModalOpen(false);
                      // Continue with the action that opened the modal
                      if (joinCode) {
                        handleJoinSession();
                      } else {
                        handleCreateSession();
                      }
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Start or Join a Meeting</h2>
            
            <div className="space-y-6">
              <div className="p-6 border border-indigo-500/30 rounded-xl bg-indigo-900/20">
                <h3 className="text-xl font-medium mb-4">Create a New Meeting</h3>
                <p className="text-gray-300 mb-4">Create a meeting and share the code with others to join.</p>
                <button 
                  onClick={handleCreateSession}
                  disabled={isCreatingSession}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white px-4 py-3 rounded-lg flex items-center justify-center"
                >
                  {isCreatingSession ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : 'Create Meeting'}
                </button>
              </div>
              
              <div className="p-6 border border-purple-500/30 rounded-xl bg-purple-900/20">
                <h3 className="text-xl font-medium mb-4">Join an Existing Meeting</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Meeting Code
                  </label>
                  <input 
                    type="text" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code" 
                    maxLength={6}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button 
                  onClick={handleJoinSession}
                  disabled={isJoiningSession || joinCode.length !== 6}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center"
                >
                  {isJoiningSession ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Joining...
                    </>
                  ) : 'Join Meeting'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main app interface - now with session info
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="text-indigo-600" />
              MEETease
            </h1>
            <p className="text-gray-600 mt-2">
              Find the perfect meeting point for everyone
            </p>
          </div>
          
          {/* Session information */}
          <div className="mt-4 sm:mt-0 flex items-center gap-3 bg-white py-2 px-4 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Meeting Code:</span>
              <span className="font-mono font-bold text-indigo-600">{sessionCode}</span>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(sessionCode);
                // In a real app, show a toast notification
                alert("Meeting code copied to clipboard!");
              }}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </header>

        {/* Ad Blocker Warning Banner - Only shown when needed */}
        <div id="adblock-warning" className="mb-6 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg hidden">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Ad blocker detected</h3>
              <div className="mt-1 text-sm">
                <p>Some map features might not work correctly with ad blockers enabled. If you experience issues, please disable your ad blocker for this site.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="h-[600px]">
                <Map />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <ParticipantList />

            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Locations</h2>
              
              {participants.map((participant) => (
                <div key={participant.id} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {participant.name}'s Location
                  </label>
                  <LocationSearch
                    onLocationSelect={handleParticipantLocation(participant.id)}
                    placeholder={`Set ${participant.name}'s location`}
                  />
                </div>
              ))}

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Final Destination (Optional)
                </label>
                <LocationSearch
                  onLocationSelect={handleDestinationChange}
                  placeholder="Set final destination"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ad blocker detection script */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Simple ad blocker detection
          setTimeout(() => {
            fetch('https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places', { method: 'HEAD', mode: 'no-cors' })
              .catch(() => {
                document.getElementById('adblock-warning').classList.remove('hidden');
              });
          }, 2000);
        `
      }} />
    </div>
  );
}

export default App;
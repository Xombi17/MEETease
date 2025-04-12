import React, { useState } from 'react';
import { MapPin, Navigation, Users, Map as MapIcon, ArrowRight, ChevronRight, Clock, Route, Share2, Star, Menu, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './components/Map';
import ParticipantList from './components/ParticipantList';
import LocationSearch from './components/LocationSearch';
import { useMeetingStore } from './store/meetingStore';
import type { Location } from './types/maps';

function App() {
  const [showApp, setShowApp] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { participants, setDestination, updateParticipantLocation } = useMeetingStore();

  const handleParticipantLocation = (participantId: string) => (location: Location) => {
    updateParticipantLocation(participantId, location);
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
                  <span className="text-sm font-medium text-indigo-300">Making meetups simpler than ever</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  Find the <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">perfect</span> meeting spot for everyone
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  MEETease helps you and your friends find the most convenient meeting point based on everyone's location, making group coordination effortless.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowApp(true)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    Get Started
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
                        {/* Map mock representation */}
                        <div className="absolute inset-0 bg-gray-800 rounded-xl overflow-hidden">
                          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100%" height="100%" fill="#1f2937"/>
                            <path d="M0 50 Q 25 25, 50 50 T 100 50 T 150 50 T 200 50" stroke="#4f46e5" strokeWidth="2" fill="none"/>
                            <path d="M0 70 Q 25 95, 50 70 T 100 70 T 150 70 T 200 70" stroke="#7c3aed" strokeWidth="2" fill="none"/>
                            <path d="M70 0 Q 95 25, 70 50 T 70 100 T 70 150 T 70 200" stroke="#ec4899" strokeWidth="2" fill="none"/>
                            <circle cx="50" cy="50" r="6" fill="#4f46e5"/>
                            <circle cx="150" cy="70" r="6" fill="#7c3aed"/>
                            <circle cx="100" cy="60" r="8" fill="#10b981"/>
                          </svg>
                        </div>
                        
                        {/* Animated location markers */}
                        <div className="absolute top-1/4 left-1/4 w-6 h-6">
                          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center animate-bounce">
                            <span className="block w-4 h-4 rounded-full bg-indigo-300"></span>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-indigo-500/30 absolute -top-3 -left-3 animate-ping"></div>
                        </div>
                        
                        <div className="absolute bottom-1/4 right-1/4 w-6 h-6">
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center animate-bounce animation-delay-1000">
                            <span className="block w-4 h-4 rounded-full bg-purple-300"></span>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-purple-500/30 absolute -top-3 -left-3 animate-ping animation-delay-1000"></div>
                        </div>
                        
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                            <span className="block w-6 h-6 rounded-full bg-green-300"></span>
                          </div>
                          <div className="w-16 h-16 rounded-full bg-green-500/30 absolute -top-4 -left-4 animate-ping"></div>
                        </div>
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
                Our app makes coordination effortless with smart features designed to eliminate the "where should we meet" hassle.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <Users className="text-indigo-400" size={32} />,
                  title: "Group Coordination",
                  description: "Perfect for groups of any size, making it easy to find a central meeting point."
                },
                {
                  icon: <MapIcon className="text-indigo-400" size={32} />,
                  title: "Smart Location",
                  description: "Automatically calculates the optimal meeting point based on everyone's location."
                },
                {
                  icon: <Route className="text-indigo-400" size={32} />,
                  title: "Travel Optimization",
                  description: "Considers travel time, distance, and traffic to suggest the most convenient spot."
                },
                {
                  icon: <Clock className="text-indigo-400" size={32} />,
                  title: "Time Saving",
                  description: "Less time coordinating, more time enjoying with friends and family."
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
                Simple, intuitive, and designed to make your life easier.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-600 to-purple-600 ml-6 md:ml-8 lg:mx-auto lg:left-0 lg:right-0 lg:w-0.5"></div>
                
                {[
                  {
                    title: "Add Your Group",
                    description: "Enter the locations of all participants who will be meeting up.",
                    icon: <Users className="text-white" size={24} />
                  },
                  {
                    title: "Algorithm Magic",
                    description: "Our smart algorithm calculates the optimal meeting point based on everyone's location.",
                    icon: <MapIcon className="text-white" size={24} />
                  },
                  {
                    title: "Get Directions",
                    description: "Each person receives personalized directions to the meeting point.",
                    icon: <Route className="text-white" size={24} />
                  },
                  {
                    title: "Meet & Go",
                    description: "Meet at the suggested location and continue to your final destination together.",
                    icon: <Share2 className="text-white" size={24} />
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Navigation className="text-indigo-600" />
            MEETease
          </h1>
          <p className="text-gray-600 mt-2">
            Find the perfect meeting point for everyone
          </p>
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
                  onLocationSelect={setDestination}
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
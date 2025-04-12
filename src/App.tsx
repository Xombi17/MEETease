import React, { useState } from 'react';
import { MapPin, Navigation, Users, Map as MapIcon, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Map from './components/Map';
import ParticipantList from './components/ParticipantList';
import LocationSearch from './components/LocationSearch';
import { useMeetingStore } from './store/meetingStore';
import type { Location } from './types/maps';

function App() {
  const [showApp, setShowApp] = useState(false);
  const { participants, setDestination, updateParticipantLocation } = useMeetingStore();

  const handleParticipantLocation = (participantId: string) => (location: Location) => {
    updateParticipantLocation(participantId, location);
  };

  if (!showApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="inline-block p-4 rounded-full bg-white/10 backdrop-blur-lg mb-6"
            >
              <Navigation size={48} className="text-indigo-400" />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
              MeetPoint
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Find the perfect meeting spot for everyone, automatically calculated based on everyone's location.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowApp(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center gap-2 mx-auto"
            >
              Get Started
              <ArrowRight size={20} />
            </motion.button>
          </motion.div>

          {/* Features */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
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
                icon: <MapPin className="text-indigo-400" size={32} />,
                title: "Real-time Updates",
                description: "See when everyone arrives and get instant updates on meeting point changes."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-colors"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                "Add your group members and their locations",
                "We calculate the optimal meeting point",
                "Get directions and meet up!"
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-lg">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="text-center"
          >
            <button
              onClick={() => setShowApp(true)}
              className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold inline-flex items-center gap-2 transition-all duration-300"
            >
              Try MeetPoint Now
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Navigation className="text-indigo-600" />
            MeetPoint
          </h1>
          <p className="text-gray-600 mt-2">
            Find the perfect meeting point for everyone
          </p>
        </header>

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
    </div>
  );
}

export default App;
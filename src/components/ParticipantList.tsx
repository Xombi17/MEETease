import React, { useState, useEffect } from 'react';
import { MapPin, UserPlus, X, Navigation, Share2, Clock, Coffee, MapIcon } from 'lucide-react';
import { useMeetingStore } from '../store/meetingStore';

const ParticipantList: React.FC = () => {
  const { 
    participants, 
    addParticipant, 
    removeParticipant, 
    calculateMeetingPoint,
    toggleLocationSharing,
    meetingPoint 
  } = useMeetingStore();
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addParticipant(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    return `${minutes}m ago`;
  };

  const formatDuration = (duration?: google.maps.Duration) => {
    if (!duration) return '';
    return duration.text;
  };

  const handleCalculateMeetingPoint = async () => {
    setIsCalculating(true);
    await calculateMeetingPoint();
    setTimeout(() => setIsCalculating(false), 1000); // Give some visual feedback
  };

  const readyParticipants = participants.filter(p => p.isReady).length;
  const showCalculateButton = readyParticipants >= 2;

  // Show a loading state while calculating the meeting point
  useEffect(() => {
    if (meetingPoint?.address === "Calculating optimal meeting point...") {
      setIsCalculating(true);
    } else if (isCalculating) {
      // Keep loading state for at least 1 second to show feedback
      setTimeout(() => setIsCalculating(false), 1000);
    }
  }, [meetingPoint, isCalculating]);

  return (
    <div>
      {isAdding ? (
        <form onSubmit={handleAddParticipant} className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter participant name"
              className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <UserPlus size={18} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newName.trim()}
              className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              Add Participant
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-dashed border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors"
        >
          <UserPlus size={18} className="text-indigo-600" />
          <span>Add Participant</span>
        </button>
      )}

      {participants.length === 0 && !isAdding && (
        <div className="text-center py-8 text-gray-500">
          <UserPlus size={24} className="mx-auto mb-2 text-gray-400" />
          <p>No participants yet</p>
          <p className="text-sm">Add participants to get started</p>
        </div>
      )}

      <div className="space-y-3">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-lg transition-all hover:shadow-sm"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${participant.isReady ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <span className="text-sm font-medium">
                      {participant.name && participant.name.length > 0 
                        ? participant.name.charAt(0).toUpperCase() 
                        : '?'}
                    </span>
                  </div>
                  {participant.isReady && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <span className="font-medium">{participant.name || 'Unnamed'}</span>
                  {participant.isSharing && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  )}
                  
                  {participant.location?.address && (
                    <div className="text-sm text-gray-500 mt-0.5">
                      <div className="flex items-start gap-1">
                        <MapPin size={14} className="flex-shrink-0 mt-0.5 text-gray-400" />
                        <div>
                          <div className="truncate max-w-[200px]">
                            {participant.location.address}
                          </div>
                          {participant.location.timestamp && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Clock size={12} />
                              {formatTime(participant.location.timestamp)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {participant.directions?.routes[0]?.legs[0]?.duration && (
                    <div className="flex items-center gap-1 text-xs text-indigo-600 mt-1">
                      <Navigation size={12} />
                      ETA: {formatDuration(participant.directions.routes[0].legs[0].duration)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleLocationSharing(participant.id)}
                className={`p-1.5 rounded-full focus:outline-none ${
                  participant.isSharing ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={participant.isSharing ? "Stop sharing location" : "Share location"}
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={() => removeParticipant(participant.id)}
                className="p-1.5 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 focus:outline-none"
                title="Remove participant"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Meeting Point Display */}
      {meetingPoint && meetingPoint.address && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <Coffee size={18} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Meeting Point</h3>
              <p className="text-sm text-gray-700 mt-1">{meetingPoint.address}</p>
              
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <MapIcon size={12} />
                  <span>{meetingPoint.lat.toFixed(6)}, {meetingPoint.lng.toFixed(6)}</span>
                </div>
                <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${meetingPoint.lat},${meetingPoint.lng}`)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Open in Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCalculateButton && (
        <button
          onClick={handleCalculateMeetingPoint}
          disabled={isCalculating}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
        >
          {isCalculating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Finding Best Meeting Point...</span>
            </>
          ) : (
            <>
              <Navigation size={18} />
              <span>Calculate Meeting Point</span>
            </>
          )}
        </button>
      )}

      {!showCalculateButton && participants.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p>
              Add locations for at least 2 participants to calculate a meeting point
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantList;
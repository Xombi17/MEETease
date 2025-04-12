import React from 'react';
import { MapPin, UserPlus, X, Navigation, Share2, Clock } from 'lucide-react';
import { useMeetingStore } from '../store/meetingStore';

const ParticipantList: React.FC = () => {
  const { 
    participants, 
    addParticipant, 
    removeParticipant, 
    calculateMeetingPoint,
    toggleLocationSharing 
  } = useMeetingStore();
  const [newName, setNewName] = React.useState('');

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addParticipant(newName.trim());
      setNewName('');
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

  const readyParticipants = participants.filter(p => p.isReady).length;
  const showCalculateButton = readyParticipants >= 2;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Participants</h2>
      
      <form onSubmit={handleAddParticipant} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter participant name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <UserPlus size={18} />
          Add
        </button>
      </form>

      <div className="space-y-2 mb-4">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <MapPin
                  size={18}
                  className={participant.isReady ? "text-green-500" : "text-gray-400"}
                />
                <span>{participant.name}</span>
                {participant.isSharing && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                )}
              </div>
              {participant.location?.address && (
                <div className="text-sm text-gray-500 mt-1">
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
              )}
              {participant.directions?.routes[0]?.legs[0]?.duration && (
                <div className="text-xs text-indigo-600 mt-1">
                  ETA to meeting point: {formatDuration(participant.directions.routes[0].legs[0].duration)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleLocationSharing(participant.id)}
                className={`text-gray-400 hover:text-indigo-600 focus:outline-none ${
                  participant.isSharing ? 'text-indigo-600' : ''
                }`}
                title={participant.isSharing ? "Stop sharing location" : "Share location"}
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={() => removeParticipant(participant.id)}
                className="text-gray-400 hover:text-red-500 focus:outline-none"
                title="Remove participant"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCalculateButton && (
        <button
          onClick={calculateMeetingPoint}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <Navigation size={18} />
          Calculate Meeting Point
        </button>
      )}

      {!showCalculateButton && participants.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Add locations for at least 2 participants to calculate a meeting point
        </p>
      )}
    </div>
  );
};

export default ParticipantList;
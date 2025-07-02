import React, { useState, useEffect } from 'react';
import { Activity, Zap } from 'lucide-react';
import VideoUpload from './components/VideoUpload';
import VideoPlayer from './components/VideoPlayer';
import CourtMap from './components/CourtMap';
import Toast from './components/Toast';
import { useVideoSync } from './hooks/useVideoSync';
import { generateCourtPositions } from './utils/courtData';
import { VideoFile, CourtPosition } from './types';

function App() {
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [courtPositions, setCourtPositions] = useState<CourtPosition[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | undefined>();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const {
    videoRef,
    currentTime,
    isPlaying,
    currentPosition,
    handleTimeUpdate,
    handlePlay,
    handlePause,
  } = useVideoSync(courtPositions);

  useEffect(() => {
    if (videoFile?.processed) {
      // Generate mock court positions for 60 seconds
      const positions = generateCourtPositions(60);
      setCourtPositions(positions);
      setToast({ message: 'Video analysis complete!', type: 'success' });
    }
  }, [videoFile]);

  const handleVideoUploaded = (video: VideoFile) => {
    setVideoFile(video);
    setSelectedPlayerId(undefined);
  };

  const handlePlayerSelect = (playerId: number) => {
    setSelectedPlayerId(selectedPlayerId === playerId ? undefined : playerId);
    setToast({ message: `Player ${playerId} selected`, type: 'success' });
  };

  const closeToast = () => setToast(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CourtCast</h1>
                <p className="text-sm text-gray-400">Professional Sports Video Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Real-time Analysis</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <VideoUpload onVideoUploaded={handleVideoUploaded} />
          </div>

          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <VideoPlayer
              video={videoFile}
              onTimeUpdate={handleTimeUpdate}
              onPlay={handlePlay}
              onPause={handlePause}
            />
          </div>

          {/* Court Map Section - Full Width */}
          <div className="lg:col-span-3">
            <CourtMap
              currentPosition={currentPosition}
              isPlaying={isPlaying}
              selectedPlayerId={selectedPlayerId}
              onPlayerSelect={handlePlayerSelect}
            />
          </div>
        </div>

        {/* Stats Footer */}
        {videoFile?.processed && currentPosition && (
          <div className="mt-8 bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Real-time Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400">
                  {currentPosition.players.filter(p => p.team === 'home').length}
                </div>
                <div className="text-sm text-gray-400">Home Players</div>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                <div className="text-2xl font-bold text-red-400">
                  {currentPosition.players.filter(p => p.team === 'away').length}
                </div>
                <div className="text-sm text-gray-400">Away Players</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                <div className="text-2xl font-bold text-green-400">
                  {currentTime.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-400">Game Time</div>
              </div>
              <div className="text-center p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
                <div className="text-2xl font-bold text-orange-400">
                  {selectedPlayerId ? '1' : '0'}
                </div>
                <div className="text-sm text-gray-400">Selected Players</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
}

export default App;
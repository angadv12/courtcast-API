import React, { useState, useEffect } from 'react';
import { Map, Users, Download, Eye, TrendingUp } from 'lucide-react';
import { Player, CourtPosition, ViewMode } from '../types';
import { COURT_DIMENSIONS, VIEW_MODES } from '../utils/courtData';

interface CourtMapProps {
  currentPosition: CourtPosition | null;
  isPlaying: boolean;
  selectedPlayerId?: number;
  onPlayerSelect?: (playerId: number) => void;
}

const CourtMap: React.FC<CourtMapProps> = ({
  currentPosition,
  isPlaying,
  selectedPlayerId,
  onPlayerSelect,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES[0]);
  const [playerTrails, setPlayerTrails] = useState<{ [key: number]: { x: number; y: number }[] }>({});

  useEffect(() => {
    if (currentPosition && viewMode.id === 'trails') {
      setPlayerTrails(prev => {
        const newTrails = { ...prev };
        currentPosition.players.forEach(player => {
          if (!newTrails[player.id]) {
            newTrails[player.id] = [];
          }
          newTrails[player.id].push(player.position);
          // Keep only last 20 positions for performance
          if (newTrails[player.id].length > 20) {
            newTrails[player.id] = newTrails[player.id].slice(-20);
          }
        });
        return newTrails;
      });
    }
  }, [currentPosition, viewMode.id]);

  const handlePlayerClick = (player: Player) => {
    onPlayerSelect?.(player.id);
  };

  const exportData = () => {
    if (!currentPosition) return;
    
    const data = {
      timestamp: currentPosition.timestamp,
      players: currentPosition.players,
      viewMode: viewMode.id,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `court-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const courtImageRef = React.useRef<HTMLImageElement>(new Image());

  useEffect(() => {
    courtImageRef.current.src = '/nba_court.png';
    courtImageRef.current.onload = () => {
      drawCourtAndPlayers();
    };
  }, []);

  useEffect(() => {
    drawCourtAndPlayers();
  }, [currentPosition, viewMode, selectedPlayerId, playerTrails]);

  const drawCourtAndPlayers = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw court image as background
    if (courtImageRef.current.complete) {
      ctx.drawImage(courtImageRef.current, 0, 0, canvas.width, canvas.height);

      // Scale factor for player positions (1:1 with COURT_DIMENSIONS)
      const scaleX = canvas.width / COURT_DIMENSIONS.width;
      const scaleY = canvas.height / COURT_DIMENSIONS.height;
      const offsetX = 0;
      const offsetY = 0;

      // Draw players
      if (currentPosition) {
        currentPosition.players.forEach(player => {
          const isSelected = selectedPlayerId === player.id;
          const teamColor = player.team === 'home' ? '#3B82F6' : '#EF4444'; // Blue for home, Red for away

          // Draw player trail
          if (viewMode.id === 'trails' && playerTrails[player.id]) {
            ctx.beginPath();
            playerTrails[player.id].forEach((pos, index) => {
              const x = pos.x * scaleX;
              const y = pos.y * scaleY;
              if (index === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            });
            ctx.strokeStyle = teamColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1; // Reset alpha
          }

          // Draw player dot
          const playerX = player.position.x * scaleX;
          const playerY = player.position.y * scaleY;
          const playerRadius = isSelected ? 8 : 6; // Smaller radius for canvas

          ctx.beginPath();
          ctx.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
          ctx.fillStyle = teamColor;
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#FFFFFF' : teamColor;
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.stroke();

          // Draw player number
          ctx.fillStyle = 'white';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(player.number.toString(), playerX, playerY);

          // Draw player name on hover (simplified for canvas, always show if selected)
          if (isSelected) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(player.name, playerX, playerY - playerRadius - 10);
          }
        });
      }

      // Draw heatmap
      if (viewMode.id === 'heatmap' && currentPosition) {
        currentPosition.players.forEach(player => {
          const playerX = player.position.x * scaleX + offsetX;
          const playerY = player.position.y * scaleY + offsetY;
          const gradient = ctx.createRadialGradient(playerX, playerY, 0, playerX, playerY, 30);
          gradient.addColorStop(0, 'rgba(249, 115, 22, 0.8)'); // Orange
          gradient.addColorStop(0.5, 'rgba(234, 179, 8, 0.4)'); // Yellow
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)'); // Green

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(playerX, playerY, 30, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentPosition) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    // Recalculate scale factors based on image drawing
    const aspectRatio = courtImageRef.current.width / courtImageRef.current.height;
    let drawWidth = canvas.width;
    let drawHeight = canvas.width / aspectRatio;

    if (drawHeight > canvas.height) {
      drawHeight = canvas.height;
      drawWidth = canvas.height * aspectRatio;
    }

    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;

    const playerScaleX = canvas.width / COURT_DIMENSIONS.width;
    const playerScaleY = canvas.height / COURT_DIMENSIONS.height;

    currentPosition.players.forEach(player => {
      const playerCanvasX = player.position.x * playerScaleX;
      const playerCanvasY = player.position.y * playerScaleY;
      const playerRadius = 8; // Match the drawing radius

      const distance = Math.sqrt(
        Math.pow(mouseX - playerCanvasX, 2) + Math.pow(mouseY - playerCanvasY, 2)
      );

      if (distance <= playerRadius) {
        onPlayerSelect?.(player.id);
        return;
      }
    });
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-400" />
          Live Court Map
        </h2>
        
        <div className="flex items-center gap-2">
          <select
            value={viewMode.id}
            onChange={(e) => setViewMode(VIEW_MODES.find(mode => mode.id === e.target.value) || VIEW_MODES[0])}
            className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm border border-gray-600"
          >
            {VIEW_MODES.map(mode => (
              <option key={mode.id} value={mode.id}>{mode.name}</option>
            ))}
          </select>
          
          <button
            onClick={exportData}
            disabled={!currentPosition}
            className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            title="Export court data"
          >
            <Download className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Court Canvas */}
        <div className="bg-green-900/20 rounded-xl p-4 border border-green-700/30">
          <canvas
            ref={canvasRef}
            width={COURT_DIMENSIONS.width}
            height={COURT_DIMENSIONS.height}
            className="w-full h-auto"
            onClick={handleCanvasClick}
          />
        </div>

        {/* View Mode Description */}
        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">{viewMode.name}</span>
          </div>
          <p className="text-sm text-gray-400">{viewMode.description}</p>
        </div>

        {/* Team Legend */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-white">Home Team</span>
            </div>
            <div className="text-xs text-gray-400">
              {currentPosition?.players.filter(p => p.team === 'home').length || 0} players
            </div>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-white">Away Team</span>
            </div>
            <div className="text-xs text-gray-400">
              {currentPosition?.players.filter(p => p.team === 'away').length || 0} players
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400' : 'bg-gray-400'}`}></div>
            <span className="text-gray-400">
              {isPlaying ? 'Live tracking' : 'Paused'}
            </span>
          </div>
          {currentPosition && (
            <span className="text-gray-400">
              Time: {currentPosition.timestamp.toFixed(1)}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourtMap;
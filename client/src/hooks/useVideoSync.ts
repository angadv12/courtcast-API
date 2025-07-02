import { useState, useEffect, useRef } from 'react';
import { CourtPosition } from '../types';

export const useVideoSync = (courtPositions: CourtPosition[]) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<CourtPosition | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (courtPositions.length === 0) return;

    // Find the closest court position for current time
    const closestPosition = courtPositions.reduce((prev, curr) =>
      Math.abs(curr.timestamp - currentTime) < Math.abs(prev.timestamp - currentTime)
        ? curr
        : prev
    );

    setCurrentPosition(closestPosition);
  }, [currentTime, courtPositions]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return {
    videoRef,
    currentTime,
    isPlaying,
    currentPosition,
    handleTimeUpdate,
    handlePlay,
    handlePause,
    seekTo,
  };
};
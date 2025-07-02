export interface Player {
  id: number;
  name: string;
  team: 'home' | 'away';
  position: { x: number; y: number };
  number: number;
}

export interface CourtPosition {
  timestamp: number;
  players: Player[];
}

export interface VideoFile {
  file: File;
  url: string;
  thumbnail?: string;
  duration?: number;
  processed: boolean;
}

export interface UploadProgress {
  percentage: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message: string;
}

export interface ViewMode {
  id: string;
  name: string;
  description: string;
}
import React, { useState, useCallback } from 'react';
import { Upload, Play, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { VideoFile, UploadProgress } from '../types';

interface VideoUploadProps {
  onVideoUploaded: (video: VideoFile) => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoUploaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    percentage: 0,
    status: 'idle',
    message: 'Ready to upload',
  });
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('video/mp4')) {
      setUploadProgress({
        percentage: 0,
        status: 'error',
        message: 'Please upload an MP4 video file',
      });
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setUploadProgress({
        percentage: 0,
        status: 'error',
        message: 'File size must be less than 100MB',
      });
      return;
    }

    const url = URL.createObjectURL(file);
    const newVideoFile: VideoFile = {
      file,
      url,
      processed: false,
    };

    setVideoFile(newVideoFile);
    simulateUpload(newVideoFile);
  };

  const simulateUpload = (video: VideoFile) => {
    setUploadProgress({ percentage: 0, status: 'uploading', message: 'Uploading video...' });

    // Simulate upload progress
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);
        setUploadProgress({
          percentage: 100,
          status: 'complete',
          message: 'Upload complete',
        });
      } else {
        setUploadProgress({
          percentage: Math.round(progress),
          status: 'uploading',
          message: `Uploading... ${Math.round(progress)}%`,
        });
      }
    }, 200);
  };

  const handleProcessVideo = () => {
    if (!videoFile) return;

    setUploadProgress({
      percentage: 0,
      status: 'processing',
      message: 'Processing video for analysis...',
    });

    // Simulate processing
    setTimeout(() => {
      const processedVideo = { ...videoFile, processed: true };
      setVideoFile(processedVideo);
      setUploadProgress({
        percentage: 100,
        status: 'complete',
        message: 'Video ready for analysis',
      });
      onVideoUploaded(processedVideo);
    }, 3000);
  };

  const getStatusIcon = () => {
    switch (uploadProgress.status) {
      case 'uploading':
      case 'processing':
        return <Loader className="w-5 h-5 animate-spin text-blue-400" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Upload className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-400" />
        Video Upload
      </h2>

      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-blue-400 bg-blue-400/10'
            : videoFile
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="video/mp4"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadProgress.status === 'uploading' || uploadProgress.status === 'processing'}
        />

        <div className="space-y-4">
          {videoFile ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">{videoFile.file.name}</p>
                <p className="text-sm text-gray-400">
                  {(videoFile.file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-white font-medium">Drop your MP4 video here</p>
                <p className="text-sm text-gray-400">or click to browse files</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {(uploadProgress.status !== 'idle' || videoFile) && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <span className="text-sm text-gray-300">{uploadProgress.message}</span>
          </div>

          {uploadProgress.percentage > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  uploadProgress.status === 'error'
                    ? 'bg-red-500'
                    : uploadProgress.status === 'complete'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
          )}

          {videoFile && uploadProgress.status === 'complete' && !videoFile.processed && (
            <button
              onClick={handleProcessVideo}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              Process Video for Analysis
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
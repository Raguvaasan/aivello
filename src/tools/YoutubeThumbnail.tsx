import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaYoutube, FaCopy } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';
import { ToolWrapper } from '../components/common/ToolWrapper';

interface ThumbnailOption {
  quality: string;
  url: string;
  resolution: string;
}

export default function YoutubeThumbnail() {
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnails, setThumbnails] = useState<ThumbnailOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([\w-]{11})/,
      /^([\w-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const generateThumbnails = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube URL or Video ID');
      return;
    }

    setLoading(true);
    setError('');
    setThumbnails([]);

    const videoId = extractVideoId(videoUrl.trim());
    if (!videoId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube URL or 11-character Video ID.');
      setLoading(false);
      return;
    }

    // Generate different quality thumbnails
    const thumbnailOptions: ThumbnailOption[] = [
      {
        quality: 'Max Resolution',
        url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        resolution: '1280x720'
      },
      {
        quality: 'High Quality',
        url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        resolution: '480x360'
      },
      {
        quality: 'Medium Quality',
        url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        resolution: '320x180'
      },
      {
        quality: 'Standard Definition',
        url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
        resolution: '640x480'
      },
      {
        quality: 'Default',
        url: `https://img.youtube.com/vi/${videoId}/default.jpg`,
        resolution: '120x90'
      }
    ];

    // Verify if thumbnails exist by checking if they load
    const validThumbnails: ThumbnailOption[] = [];
    
    for (const thumbnail of thumbnailOptions) {
      try {
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject();
          img.src = thumbnail.url;
        });
        validThumbnails.push(thumbnail);
      } catch {
        // Skip thumbnails that don't exist
      }
    }

    if (validThumbnails.length === 0) {
      setError('No thumbnails found for this video. Please check the URL.');
    } else {
      setThumbnails(validThumbnails);
    }

    setLoading(false);
  };

  const downloadThumbnail = async (url: string, quality: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `youtube-thumbnail-${quality.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try right-clicking the image and selecting "Save image as..."');
    }
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Image URL copied to clipboard!');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      generateThumbnails();
    }
  };

  return (
    <ToolWrapper
      toolId="youtube-thumbnail-downloader"
      toolName="YouTube Thumbnail Downloader"
      toolDescription="Download YouTube video thumbnails in multiple resolutions. Extract high-quality thumbnails from any YouTube video"
      toolCategory="Media"
    >
      <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <IconWrapper icon={FaYoutube} className="text-3xl text-red-600" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            YouTube Thumbnail Downloader
          </h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            YouTube URL or Video ID
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              onClick={generateThumbnails}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                       text-white font-medium rounded-lg transition-colors duration-200
                       flex items-center gap-2 min-w-[120px] justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Get Thumbnails'
              )}
            </button>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 
                       text-red-700 dark:text-red-300 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
        </div>

        {thumbnails.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Available Thumbnails ({thumbnails.length})
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {thumbnails.map((thumbnail, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="aspect-video mb-3 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600">
                    <img
                      src={thumbnail.url}
                      alt={`${thumbnail.quality} thumbnail`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800 dark:text-white">
                      {thumbnail.quality}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Resolution: {thumbnail.resolution}
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadThumbnail(thumbnail.url, thumbnail.quality)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 
                                 bg-green-600 hover:bg-green-700 text-white text-sm font-medium 
                                 rounded-lg transition-colors duration-200"
                      >
                        <IconWrapper icon={FaDownload} className="text-xs" />
                        Download
                      </button>
                      
                      <button
                        onClick={() => copyImageUrl(thumbnail.url)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm 
                                 rounded-lg transition-colors duration-200"
                        title="Copy URL"
                      >
                        <IconWrapper icon={FaCopy} className="text-xs" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
            💡 How to use:
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Paste any YouTube video URL or just the 11-character Video ID</li>
            <li>• Choose from multiple thumbnail qualities and resolutions</li>
            <li>• Download images directly or copy URLs for later use</li>
            <li>• Works with any public YouTube video</li>
          </ul>
        </div>
      </div>
    </div>
    </ToolWrapper>
  );
}
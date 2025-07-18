import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaTrash, FaSpinner, FaMagic, FaImage } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { SEOHelmet } from '../components/common/SEOHelmet';
import config from '../config/environment';

interface ProcessingOptions {
  format: 'png' | 'jpg';
  quality: 'hd' | 'regular';
}

export default function BgRemover() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<ProcessingOptions>({
    format: 'png',
    quality: 'regular'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setError('');
    setProcessedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImage(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const removeBackground = useCallback(async () => {
    if (!originalImage) return;

    setLoading(true);
    setError('');

    try {
      // Convert data URL to blob
      const response = await fetch(originalImage);
      const blob = await response.blob();

      // Create FormData for the API request
      const formData = new FormData();
      formData.append('image_file', blob);
      formData.append('size', options.quality === 'hd' ? 'full' : 'regular');

      // Call remove.bg API
      const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': config.apiKeys.removeBg,
        },
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${apiResponse.status}`);
      }

      // Get the processed image blob
      const resultBlob = await apiResponse.blob();
      
      // Convert to data URL for display
      const reader = new FileReader();
      reader.onload = () => {
        setProcessedImage(reader.result as string);
      };
      reader.readAsDataURL(resultBlob);

    } catch (err) {
      console.error('Background removal failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove background. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [originalImage, options]);

  const downloadImage = useCallback(() => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `background-removed.${options.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedImage, options.format]);

  const resetTool = useCallback(() => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <>
      <SEOHelmet
        title="AI Background Remover - Free Online Tool | Aivello"
        description="Remove backgrounds from images instantly using AI technology. Free, fast, and secure background removal tool."
        keywords="background remover, remove background, AI image editing, photo editing, transparent background"
        url="https://aivello.vercel.app/app/bg-remover"
      />
      
      <ToolWrapper
        toolId="bg-remover"
        toolName="AI Background Remover"
        toolDescription="Remove backgrounds from images instantly using AI technology"
        toolCategory="Image Tools"
      >
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              AI Background Remover
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Remove backgrounds from images instantly using AI technology
            </p>
          </div>
          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Upload Image
            </h3>
            
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <IconWrapper icon={FaImage} className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Click to upload an image (Max 10MB)
                </p>
              </label>
            </div>

            {/* Processing Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Format
                </label>
                <select
                  value={options.format}
                  onChange={(e) => setOptions({...options, format: e.target.value as 'png' | 'jpg'})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="png">PNG (Transparent)</option>
                  <option value="jpg">JPG (White Background)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quality
                </label>
                <select
                  value={options.quality}
                  onChange={(e) => setOptions({...options, quality: e.target.value as 'hd' | 'regular'})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="regular">Regular</option>
                  <option value="hd">High Definition</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md mb-4">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Image Display */}
          {originalImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Original Image */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-medium mb-3 text-gray-900 dark:text-white">
                  Original Image
                </h4>
                <div className="relative">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-auto max-h-64 object-contain rounded border"
                  />
                </div>
              </div>

              {/* Processed Image */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-medium mb-3 text-gray-900 dark:text-white">
                  Processed Image
                </h4>
                <div className="relative min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded">
                  {loading ? (
                    <div className="text-center">
                      <IconWrapper icon={FaSpinner} className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Removing background...
                      </p>
                    </div>
                  ) : processedImage ? (
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="w-full h-auto max-h-64 object-contain rounded"
                    />
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Processed image will appear here
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {originalImage && (
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={removeBackground}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <IconWrapper icon={loading ? FaSpinner : FaMagic} className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Processing...' : 'Remove Background'}
              </motion.button>

              {processedImage && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadImage}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <IconWrapper icon={FaDownload} className="h-4 w-4 mr-2" />
                  Download
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetTool}
                className="flex items-center px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <IconWrapper icon={FaTrash} className="h-4 w-4 mr-2" />
                Reset
              </motion.button>
            </div>
          )}

          {/* Usage Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-md font-medium text-blue-900 dark:text-blue-300 mb-2">
              How to use:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Upload an image with a clear subject</li>
              <li>• Choose your preferred output format and quality</li>
              <li>• Click "Remove Background" to process</li>
              <li>• Download the result with transparent background</li>
            </ul>
          </div>
        </div>
      </ToolWrapper>
    </>
  );
}

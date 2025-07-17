import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaTrash, FaSpinner, FaMagic } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';

export default function BgRemover() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState(128);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setError('');
    setProcessedImage(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!originalImage || !canvasRef.current) return;

    setLoading(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const img = new Image();
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple background removal algorithm
        // This is a basic implementation - in real applications, you'd use more sophisticated AI models
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate brightness
          const brightness = (r + g + b) / 3;
          
          // Simple background detection based on color similarity to corners
          // Check if pixel is similar to corner colors (assuming background)
          const isBackground = isBackgroundPixel(r, g, b, data, canvas.width, canvas.height);
          
          if (isBackground || brightness > threshold + 50 || brightness < threshold - 50) {
            // Make pixel transparent
            data[i + 3] = 0;
          }
        }

        // Put processed image data back
        ctx.putImageData(imageData, 0, 0);

        // Convert to data URL
        const processedDataURL = canvas.toDataURL('image/png');
        setProcessedImage(processedDataURL);
        setLoading(false);
      };

      img.onerror = () => {
        setError('Failed to load image for processing.');
        setLoading(false);
      };

      img.src = originalImage;
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
      setLoading(false);
    }
  };

  const isBackgroundPixel = (r: number, g: number, b: number, data: Uint8ClampedArray, width: number, height: number): boolean => {
    // Sample corner pixels to determine background color
    const corners = [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: 0, y: height - 1 },
      { x: width - 1, y: height - 1 }
    ];

    for (const corner of corners) {
      const index = (corner.y * width + corner.x) * 4;
      const cornerR = data[index];
      const cornerG = data[index + 1];
      const cornerB = data[index + 2];

      // Check color similarity (tolerance of 50)
      const tolerance = 50;
      if (
        Math.abs(r - cornerR) < tolerance &&
        Math.abs(g - cornerG) < tolerance &&
        Math.abs(b - cornerB) < tolerance
      ) {
        return true;
      }
    }

    return false;
  };

  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'background-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetTool = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <IconWrapper icon={FaMagic} className="text-3xl text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            AI Background Remover
          </h2>
        </div>

        {/* Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload Image
          </label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                       file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {originalImage && (
              <button
                onClick={resetTool}
                className="p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg 
                         transition-colors duration-200"
                title="Clear and start over"
              >
                <IconWrapper icon={FaTrash} />
              </button>
            )}
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

        {/* Threshold Control */}
        {originalImage && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Background Detection Sensitivity: {threshold}
            </label>
            <input
              type="range"
              min="50"
              max="200"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>More Sensitive</span>
              <span>Less Sensitive</span>
            </div>
          </div>
        )}

        {/* Process Button */}
        {originalImage && (
          <div className="text-center mb-6">
            <button
              onClick={processImage}
              disabled={loading}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400
                       text-white font-medium rounded-lg transition-colors duration-200
                       flex items-center gap-3 mx-auto"
            >
              {loading ? (
                <>
                  <IconWrapper icon={FaSpinner} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IconWrapper icon={FaMagic} />
                  Remove Background
                </>
              )}
            </button>
          </div>
        )}

        {/* Images Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {originalImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Original Image
              </h3>
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          )}

          {processedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Background Removed
              </h3>
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                   style={{
                     backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='smallGrid' width='8' height='8' patternUnits='userSpaceOnUse'%3e%3cpath d='M 8 0 L 0 0 0 8' fill='none' stroke='gray' stroke-width='0.5'/%3e%3c/pattern%3e%3cpattern id='grid' width='80' height='80' patternUnits='userSpaceOnUse'%3e%3crect width='80' height='80' fill='url(%23smallGrid)'/%3e%3cpath d='M 80 0 L 0 0 0 80' fill='none' stroke='gray' stroke-width='1'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100' height='100' fill='url(%23grid)' /%3e%3c/svg%3e")`,
                     backgroundSize: '20px 20px'
                   }}>
                <img
                  src={processedImage}
                  alt="Background Removed"
                  className="w-full h-full object-contain"
                />
              </div>
              
              <button
                onClick={downloadImage}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 
                         bg-green-600 hover:bg-green-700 text-white font-medium 
                         rounded-lg transition-colors duration-200"
              >
                <IconWrapper icon={FaDownload} />
                Download PNG
              </button>
            </motion.div>
          )}
        </div>

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Instructions */}
        <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">
            💡 How to use:
          </h3>
          <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
            <li>• Upload any image with a simple background</li>
            <li>• Adjust sensitivity slider for better background detection</li>
            <li>• Click "Remove Background" to process the image</li>
            <li>• Download the result as a PNG with transparent background</li>
            <li>• Works best with images that have uniform backgrounds</li>
          </ul>
          
          <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs text-yellow-800 dark:text-yellow-300">
            <strong>Note:</strong> This is a simplified background removal tool. For professional results with complex backgrounds, consider using AI-powered services like Remove.bg or Photoshop.
          </div>
        </div>
      </div>
    </div>
  );
}

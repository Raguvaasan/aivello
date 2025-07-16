import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import ApiService from '../services/apiService';
import { handleApiError, logError } from '../utils/errorHandling';

const BgRemover = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        ApiService.validateImage(file);
        const url = URL.createObjectURL(file);
        setPreview(url);
        setResult(null);
      } catch (error) {
        const apiError = handleApiError(error);
        toast.error(apiError.message);
        logError(apiError, 'BgRemover - File Upload');
      }
    }
  };

  const handleRemoveBg = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Removing background...');

    try {
      const resultBlob = await ApiService.removeBg(file);
      const resultUrl = URL.createObjectURL(resultBlob);
      setResult(resultUrl);
      
      // Save to Firestore (optional - for usage tracking)
      try {
        await addDoc(collection(db, 'bgRemovalHistory'), {
          timestamp: serverTimestamp(),
          originalSize: file.size,
          resultSize: resultBlob.size,
        });
      } catch (firestoreError) {
        // Don't fail the main operation if logging fails
        logError(handleApiError(firestoreError), 'BgRemover - Firestore');
      }

      toast.success('Background removed successfully!', { id: loadingToast });
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(apiError.message, { id: loadingToast });
      logError(apiError, 'BgRemover - Remove Background');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = 'bg-removed.png';
    link.click();
  };

  const resetImages = () => {
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        AI Background Remover
      </h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Upload Image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleUpload}
          className="block w-full text-sm text-gray-500 dark:text-gray-400
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Supported formats: JPEG, PNG, WebP (max 10MB)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {preview && (
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Original Image</h3>
            <img
              src={preview}
              alt="Original"
              className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
            />
          </div>
        )}

        {result && (
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Background Removed</h3>
            <img
              src={result}
              alt="Background Removed"
              className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleRemoveBg}
          disabled={!preview || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                     disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Remove Background'}
        </button>

        {result && (
          <button
            onClick={downloadImage}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Download Result
          </button>
        )}

        {(preview || result) && (
          <button
            onClick={resetImages}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {!preview && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-2">How to use:</h3>
          <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>Upload an image using the file input above</li>
            <li>Click "Remove Background" to process the image</li>
            <li>Download the result with transparent background</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default BgRemover;

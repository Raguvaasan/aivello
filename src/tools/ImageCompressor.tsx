import React, { useState, useRef } from 'react';
import { db } from '../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ToolWrapper } from '../components/common/ToolWrapper';

const ImageCompressor = () => {
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filename, setFilename] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFilename(file.name);
      compressImage(file);
    }
  };

  const compressImage = (file: File) => {
    setLoading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const width = img.width / 2;
        const height = img.height / 2;

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setCompressedUrl(compressedDataUrl);
        uploadToFirebase(compressedDataUrl);
      };
    };

    reader.readAsDataURL(file);
  };

  const uploadToFirebase = async (dataUrl: string) => {
    try {
     

      await addDoc(collection(db, 'compressedImages'), {
        filename,
        url: dataUrl,
        createdAt: serverTimestamp(),
      });

     // console.log('Uploaded to Firestore + Storage:', dataUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!compressedUrl) return;
    const link = document.createElement('a');
    link.href = compressedUrl;
    link.download = 'compressed.jpg';
    link.click();
  };

  return (
    <ToolWrapper
      toolId="image-compressor"
      toolName="Image Compressor"
      toolDescription="Compress and optimize images online. Reduce file size while maintaining quality for faster web loading"
      toolCategory="Media"
    >
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Image Compressor + Uploader</h2>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mb-4 w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                   file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-gray-200"
      />

      {loading && <p className="text-blue-600 dark:text-blue-400">Compressing & Uploading...</p>}

      {compressedUrl && (
        <div className="mt-4">
          <p className="font-semibold text-gray-900 dark:text-white">Compressed Preview:</p>
          <img src={compressedUrl} alt="Compressed" className="max-w-full rounded" />
          <button
            onClick={downloadImage}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Download Image
          </button>
        </div>
      )}
    </div>
    </ToolWrapper>
  );
};

export default ImageCompressor;

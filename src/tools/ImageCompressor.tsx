import React, { useState, useRef } from 'react';
import { db } from '../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

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
    <div className="bg-white p-6 rounded shadow max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Image Compressor + Uploader</h2>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mb-4"
      />

      {loading && <p className="text-blue-600">Compressing & Uploading...</p>}

      {compressedUrl && (
        <div className="mt-4">
          <p className="font-semibold">Compressed Preview:</p>
          <img src={compressedUrl} alt="Compressed" className="max-w-full rounded" />
          <button
            onClick={downloadImage}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
          >
            Download Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;

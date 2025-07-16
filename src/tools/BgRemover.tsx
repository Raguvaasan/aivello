import React, { useState, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BgRemover = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setResult(null);
    }
  };

  const handleRemoveBg = async () => {
    if (!imageRef.current) return;
    setLoading(true);

    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        alert('No file selected!');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('image_file', file);
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': 'KTfop4jE8jCBf4CiyR6C7RfC', // Replace with your API Key
        },
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const resultUrl = URL.createObjectURL(blob);
        setResult(resultUrl);

        await addDoc(collection(db, 'images'), {
          originalFileName: file.name,
          createdAt: serverTimestamp(),
        });
      } else {
        const errorData = await response.text();
        alert('Failed to remove background:\n' + errorData);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
      console.error(err);
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

  return (
    <div className="bg-white p-6 rounded shadow max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">AI Background Remover</h2>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="mb-4"
      />

      {preview && (
        <div className="mb-4">
          <p className="font-semibold">Original:</p>
          <img
            src={preview}
            ref={imageRef}
            alt="Original"
            crossOrigin="anonymous"
            className="max-w-full h-auto rounded"
            onLoad={() => setResult(null)}
          />
        </div>
      )}

      <button
        onClick={handleRemoveBg}
        disabled={!preview || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Remove Background'}
      </button>

      {result && (
        <div className="mt-6">
          <p className="font-semibold">Result:</p>
          <img src={result} alt="Result" className="w-full max-h-64 object-contain rounded" />
          <button onClick={downloadImage} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">
            Download Image
          </button>
        </div>
      )}
    </div>
  );
};

export default BgRemover;

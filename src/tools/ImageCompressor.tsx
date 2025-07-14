import React, { useState } from 'react';

const ImageCompressor = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOriginalImage(e.target.files[0]);
      compressImage(e.target.files[0]);
    }
  };

  const compressImage = (file: File) => {
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
        const compressed = canvas.toDataURL('image/jpeg', 0.6);
        setCompressedUrl(compressed);
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      
      <h2 className="text-xl font-bold mb-4">Image Compressor</h2>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {compressedUrl && (
        <div className="mt-4">
          <img src={compressedUrl} alt="Compressed" className="max-w-full rounded" />
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;
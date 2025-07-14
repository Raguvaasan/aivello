import React, { useState } from 'react';

const BgRemover = () => {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleRemoveBg = () => {
    // Simulated result
    if (image) {
      const fakeResultUrl = URL.createObjectURL(image); // Mock result
      setResult(fakeResultUrl);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      
      <h2 className="text-xl font-bold mb-4">Background Remover (Mock)</h2>
      <input type="file" accept="image/*" onChange={handleUpload} />
      <button onClick={handleRemoveBg} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
        Remove Background
      </button>
      {result && (
        <div className="mt-4">
          <img src={result} alt="Result" className="max-w-full rounded" />
        </div>
      )}
    </div>
  );
};

export default BgRemover;
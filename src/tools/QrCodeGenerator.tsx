// File: src/tools/QrCodeGenerator.tsx
import React, { useState } from 'react';
import { QRCode } from 'react-qrcode-logo';

export default function QrCodeGenerator() {
  const [text, setText] = useState('');

  return (
    <div className="bg-white shadow-md p-4 rounded-xl">
      <h2 className="text-xl font-semibold mb-4">QR Code Generator</h2>
      <input
        type="text"
        placeholder="Enter text or URL"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      {text && (
        <div className="text-center">
          <QRCode value={text} size={200} />
          <p className="mt-2 text-sm text-gray-600">Right-click the QR to save</p>
        </div>
      )}
    </div>
  );
}

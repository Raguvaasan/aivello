// File: src/tools/QrCodeGenerator.tsx
import React, { useState } from 'react';
import { QRCode } from 'react-qrcode-logo';

export default function QrCodeGenerator() {
  const [text, setText] = useState('');

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md p-6 rounded-xl transition-colors duration-200">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">QR Code Generator</h2>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Enter text or URL
        </label>
        <input
          type="text"
          placeholder="Enter text or URL"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>
      {text && (
        <div className="text-center bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <QRCode value={text} size={200} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Right-click the QR code to save</p>
        </div>
      )}
      {!text && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Enter text or URL above to generate QR code</p>
        </div>
      )}
    </div>
  );
}

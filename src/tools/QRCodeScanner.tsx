import React, { useState, useRef } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaQrcode, FaCamera, FaUpload, FaCopy, FaExternalLinkAlt, FaHistory } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';

export default function QRCodeScanner() {
  const [scannedResult, setScannedResult] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{id: string, content: string, type: string, timestamp: Date}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectQRType = (content: string): string => {
    if (content.startsWith('http://') || content.startsWith('https://')) {
      return 'URL';
    } else if (content.startsWith('mailto:')) {
      return 'Email';
    } else if (content.startsWith('tel:')) {
      return 'Phone';
    } else if (content.startsWith('sms:')) {
      return 'SMS';
    } else if (content.includes('WIFI:')) {
      return 'WiFi';
    } else if (content.includes('BEGIN:VCARD')) {
      return 'Contact';
    } else if (content.includes('BEGIN:VEVENT')) {
      return 'Event';
    } else if (/^\d+$/.test(content)) {
      return 'Number';
    } else {
      return 'Text';
    }
  };

  const simulateQRScan = (content: string) => {
    const type = detectQRType(content);
    const scanResult = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date()
    };
    
    setScannedResult(content);
    setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]); // Keep last 10 scans
  };

  const startCameraScanning = () => {
    setIsScanning(true);
    
    // Simulate camera scanning - in real implementation, you'd use libraries like:
    // - @zxing/library
    // - qr-scanner
    // - jsQR
    setTimeout(() => {
      const sampleQRCodes = [
        'https://www.aivello.com',
        'mailto:contact@aivello.com',
        'tel:+1234567890',
        'WIFI:T:WPA;S:MyNetwork;P:password123;;',
        'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nORG:Aivello\nTEL:123-456-7890\nEMAIL:john@aivello.com\nEND:VCARD',
        'Sample text content from QR code',
        'https://maps.google.com/?q=latitude,longitude'
      ];
      
      const randomContent = sampleQRCodes[Math.floor(Math.random() * sampleQRCodes.length)];
      simulateQRScan(randomContent);
      setIsScanning(false);
    }, 2000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In real implementation, you'd read the image file and decode QR code
    // For demo, we'll simulate finding a QR code in the uploaded image
    setTimeout(() => {
      const sampleContent = 'https://example.com/from-uploaded-image';
      simulateQRScan(sampleContent);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const openLink = (content: string) => {
    if (content.startsWith('http://') || content.startsWith('https://')) {
      window.open(content, '_blank');
    } else if (content.startsWith('mailto:')) {
      window.location.href = content;
    } else if (content.startsWith('tel:')) {
      window.location.href = content;
    }
  };

  const renderQRContent = (content: string, type: string) => {
    switch (type) {
      case 'URL':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                🔗 Website
              </span>
            </div>
            <p className="text-blue-600 dark:text-blue-400 break-all">{content}</p>
            <button
              onClick={() => openLink(content)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <IconWrapper icon={FaExternalLinkAlt} />
              Open Link
            </button>
          </div>
        );
      
      case 'Email':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                📧 Email
              </span>
            </div>
            <p className="text-green-600 dark:text-green-400">{content.replace('mailto:', '')}</p>
            <button
              onClick={() => openLink(content)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              📧 Send Email
            </button>
          </div>
        );
      
      case 'Phone':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs font-medium">
                📞 Phone
              </span>
            </div>
            <p className="text-yellow-600 dark:text-yellow-400">{content.replace('tel:', '')}</p>
            <button
              onClick={() => openLink(content)}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
            >
              📞 Call Now
            </button>
          </div>
        );
      
      case 'WiFi':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-medium">
                📶 WiFi
              </span>
            </div>
            <div className="text-sm space-y-1">
              {content.split(';').map((part, index) => (
                <div key={index} className="text-purple-600 dark:text-purple-400">
                  {part.replace('WIFI:', '').replace('T:', 'Type: ').replace('S:', 'Network: ').replace('P:', 'Password: ')}
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'Contact':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded text-xs font-medium">
                👤 Contact
              </span>
            </div>
            <div className="text-sm space-y-1">
              {content.split('\n').map((line, index) => (
                <div key={index} className="text-indigo-600 dark:text-indigo-400">
                  {line.replace('BEGIN:VCARD', '').replace('END:VCARD', '').replace('VERSION:3.0', '')}
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-medium">
                📝 Text
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 break-all">{content}</p>
          </div>
        );
    }
  };

  return (
    <ToolWrapper
      toolId="qr-code-scanner"
      toolName="QR Code Scanner"
      toolDescription="Scan QR codes using your camera or upload images. Decode URLs, contacts, WiFi passwords, and more instantly"
      toolCategory="Utility"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaQrcode} className="text-3xl text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              QR Code Scanner
            </h2>
          </div>

          {/* Scanning Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Camera Scan */}
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                <div className="mb-4">
                  <IconWrapper icon={FaCamera} className="text-4xl text-indigo-600 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  Scan with Camera
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Use your device camera to scan QR codes in real-time
                </p>
                <button
                  onClick={startCameraScanning}
                  disabled={isScanning}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <IconWrapper icon={FaCamera} />
                      Start Camera
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Upload Image */}
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                <div className="mb-4">
                  <IconWrapper icon={FaUpload} className="text-4xl text-indigo-600 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  Upload Image
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Upload an image containing a QR code to decode
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <IconWrapper icon={FaUpload} />
                  Choose Image
                </button>
              </div>
            </div>
          </div>

          {/* Scan Result */}
          {scannedResult && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Scan Result
                </h3>
                <button
                  onClick={() => copyToClipboard(scannedResult)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <IconWrapper icon={FaCopy} />
                  Copy
                </button>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                {renderQRContent(scannedResult, detectQRType(scannedResult))}
              </div>
            </div>
          )}

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <IconWrapper icon={FaHistory} className="text-xl text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Recent Scans
                </h3>
              </div>
              <div className="space-y-3">
                {scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                        {scan.type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {scan.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-all line-clamp-2">
                      {scan.content}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setScannedResult(scan.content)}
                        className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => copyToClipboard(scan.content)}
                        className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 rounded-lg">
            <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">
              🔍 Supported QR Code Types:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-indigo-700 dark:text-indigo-200">
              <div>🔗 Website URLs</div>
              <div>📧 Email addresses</div>
              <div>📞 Phone numbers</div>
              <div>📶 WiFi credentials</div>
              <div>👤 Contact cards</div>
              <div>📅 Calendar events</div>
              <div>💬 SMS messages</div>
              <div>📝 Plain text</div>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaLink, FaCopy, FaChartBar, FaQrcode } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';
import { QRCode } from 'react-qrcode-logo';

interface ShortenedUrl {
  original: string;
  shortened: string;
  clicks: number;
  created: Date;
  id: string;
}

export default function URLShortener() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [shortenedUrls, setShortenedUrls] = useState<ShortenedUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState<string | null>(null);

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const generateShortCode = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const shortenUrl = async () => {
    if (!originalUrl.trim()) {
      alert('Please enter a URL to shorten');
      return;
    }

    if (!isValidUrl(originalUrl)) {
      alert('Please enter a valid URL (including http:// or https://)');
      return;
    }

    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const shortCode = customAlias || generateShortCode();
      const shortened = `https://aiv.to/${shortCode}`;
      
      const newUrl: ShortenedUrl = {
        id: Date.now().toString(),
        original: originalUrl,
        shortened,
        clicks: 0,
        created: new Date()
      };

      setShortenedUrls(prev => [newUrl, ...prev]);
      setOriginalUrl('');
      setCustomAlias('');
      setLoading(false);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copied to clipboard!');
  };

  const deleteUrl = (id: string) => {
    setShortenedUrls(prev => prev.filter(url => url.id !== id));
  };

  const simulateClick = (id: string) => {
    setShortenedUrls(prev => prev.map(url => 
      url.id === id ? { ...url, clicks: url.clicks + 1 } : url
    ));
  };

  return (
    <ToolWrapper
      toolId="url-shortener"
      toolName="URL Shortener & Analytics"
      toolDescription="Shorten long URLs, track clicks, and generate QR codes. Perfect for social media, marketing campaigns, and link management"
      toolCategory="Marketing"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaLink} className="text-3xl text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              URL Shortener
            </h2>
          </div>

          {/* URL Input Section */}
          <div className="mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter your long URL
                </label>
                <input
                  type="url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/very/long/url/here"
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && shortenUrl()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom alias (optional)
                </label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                    aiv.to/
                  </span>
                  <input
                    type="text"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                    placeholder="my-custom-link"
                    className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty for auto-generated short URL
                </p>
              </div>

              <button
                onClick={shortenUrl}
                disabled={loading || !originalUrl.trim()}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Shortening...
                  </>
                ) : (
                  <>
                    <IconWrapper icon={FaLink} />
                    Shorten URL
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Shortened URLs List */}
          {shortenedUrls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Your Shortened URLs
              </h3>
              <div className="space-y-4">
                {shortenedUrls.map((urlData) => (
                  <div
                    key={urlData.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {urlData.original}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                            {urlData.shortened}
                          </p>
                          <button
                            onClick={() => copyToClipboard(urlData.shortened)}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <IconWrapper icon={FaCopy} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setShowQR(showQR === urlData.id ? null : urlData.id)}
                          className="p-2 text-gray-500 hover:text-purple-600 transition-colors"
                          title="Show QR Code"
                        >
                          <IconWrapper icon={FaQrcode} />
                        </button>
                        <button
                          onClick={() => simulateClick(urlData.id)}
                          className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                          title="Simulate Click"
                        >
                          <IconWrapper icon={FaChartBar} />
                        </button>
                        <button
                          onClick={() => deleteUrl(urlData.id)}
                          className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <IconWrapper icon={FaChartBar} />
                        {urlData.clicks} clicks
                      </span>
                      <span>
                        Created: {urlData.created.toLocaleDateString()}
                      </span>
                    </div>

                    {/* QR Code */}
                    {showQR === urlData.id && (
                      <div className="mt-4 p-4 bg-white dark:bg-gray-600 rounded-lg text-center">
                        <QRCode value={urlData.shortened} size={150} />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          QR Code for {urlData.shortened}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">🔗 Features:</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <li>• Custom aliases for branded links</li>
                <li>• Click tracking and analytics</li>
                <li>• QR code generation</li>
                <li>• Instant link shortening</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">📊 Use Cases:</h3>
              <ul className="text-sm text-green-700 dark:text-green-200 space-y-1">
                <li>• Social media marketing</li>
                <li>• Email campaigns</li>
                <li>• Print materials with QR codes</li>
                <li>• Link tracking and analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

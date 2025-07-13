import React, { useState } from 'react';

export default function YoutubeThumbnail() {
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const extractThumbnail = () => {
    const regex = /(?:v=|\.be\/|embed\/)([\w-]{11})/;
    const match = videoUrl.match(regex);
    if (match && match[1]) {
      const videoId = match[1];
      setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    } else {
      setThumbnailUrl('');
      alert('Invalid YouTube URL');
    }
  };

  return (
    <div className="bg-white shadow-md p-4 rounded-xl">
      <h2 className="text-xl font-semibold mb-4">YouTube Thumbnail Downloader</h2>
      <input
        type="text"
        placeholder="Enter YouTube video URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={extractThumbnail}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Get Thumbnail
      </button>
      {thumbnailUrl && (
        <div className="mt-4 text-center">
          <img src={thumbnailUrl} alt="YouTube Thumbnail" className="rounded-lg w-full" />
          <a
            href={thumbnailUrl}
            download
            className="mt-2 inline-block text-blue-600 underline"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
}
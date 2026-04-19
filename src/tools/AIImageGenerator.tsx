import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaImage, FaDownload, FaPalette, FaMagic, FaSync } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';

export default function AIImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('512x512');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateImages = async () => {
    if (!prompt.trim()) {
      alert('Please enter a description for the image');
      return;
    }

    setLoading(true);

    try {
      // Use Pollinations.ai free API (no key needed) to generate real AI images
      const stylePrompt = style !== 'realistic' ? `, ${style} style` : '';
      const fullPrompt = encodeURIComponent(`${prompt}${stylePrompt}`);
      const [w, h] = size.split('x').map(Number);
      
      // Generate 4 unique images with different seeds
      const images: string[] = [];
      for (let i = 0; i < 4; i++) {
        const seed = Date.now() + i * 1000 + Math.floor(Math.random() * 10000);
        images.push(`https://image.pollinations.ai/prompt/${fullPrompt}?width=${w}&height=${h}&seed=${seed}&nologo=true`);
      }

      setGeneratedImages(images);
    } catch (error) {
      console.error('Error generating images:', error);
      alert('Failed to generate images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-generated-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const regenerateImage = (index: number) => {
    if (!prompt.trim()) return;
    
    const stylePrompt = style !== 'realistic' ? `, ${style} style` : '';
    const fullPrompt = encodeURIComponent(`${prompt}${stylePrompt}`);
    const [w, h] = size.split('x').map(Number);
    const seed = Date.now() + Math.floor(Math.random() * 100000);
    
    const newImages = [...generatedImages];
    newImages[index] = `https://image.pollinations.ai/prompt/${fullPrompt}?width=${w}&height=${h}&seed=${seed}&nologo=true`;
    setGeneratedImages(newImages);
  };

  const promptSuggestions = [
    "A futuristic cityscape at sunset with flying cars",
    "A magical forest with glowing mushrooms and fairy lights",
    "A cozy coffee shop in autumn with warm lighting",
    "A serene mountain lake reflecting snow-capped peaks",
    "A cyberpunk street scene with neon lights and rain",
    "A peaceful garden with blooming cherry blossoms"
  ];

  return (
    <ToolWrapper
      toolId="ai-image-generator"
      toolName="AI Image Generator"
      toolDescription="Create stunning images from text descriptions using AI. Generate art, illustrations, and creative visuals instantly"
      toolCategory="Design"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaImage} className="text-3xl text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              AI Image Generator
            </h2>
            <IconWrapper icon={FaMagic} className="text-2xl text-pink-600" />
          </div>

          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe Your Image
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="w-full h-24 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Quick Suggestions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Ideas:
              </label>
              <div className="flex flex-wrap gap-2">
                {promptSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(suggestion)}
                    className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Art Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="realistic">Photorealistic</option>
                  <option value="artistic">Artistic</option>
                  <option value="cartoon">Cartoon/Anime</option>
                  <option value="abstract">Abstract</option>
                  <option value="vintage">Vintage</option>
                  <option value="cyberpunk">Cyberpunk</option>
                  <option value="watercolor">Watercolor</option>
                  <option value="oil-painting">Oil Painting</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="512x512">Square (512x512)</option>
                  <option value="768x512">Landscape (768x512)</option>
                  <option value="512x768">Portrait (512x768)</option>
                  <option value="1024x1024">Large Square (1024x1024)</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateImages}
              disabled={loading || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Images...
                </>
              ) : (
                <>
                  <IconWrapper icon={FaMagic} />
                  Generate Images
                </>
              )}
            </button>
          </div>

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Generated Images
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {generatedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Generated artwork ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-2">
                      <button
                        onClick={() => downloadImage(image, index)}
                        className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                        title="Download"
                      >
                        <IconWrapper icon={FaDownload} />
                      </button>
                      <button
                        onClick={() => regenerateImage(index)}
                        className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                        title="Regenerate"
                      >
                        <IconWrapper icon={FaSync} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-700 rounded-lg">
            <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
              <IconWrapper icon={FaPalette} />
              Pro Tips for Better Results:
            </h3>
            <ul className="text-sm text-purple-700 dark:text-purple-200 space-y-1">
              <li>• Be specific about details: colors, lighting, composition</li>
              <li>• Mention the style you want: "in the style of Van Gogh"</li>
              <li>• Include mood and atmosphere: "dark and mysterious"</li>
              <li>• Specify the subject's position: "close-up", "full body"</li>
              <li>• Add quality modifiers: "highly detailed", "8K resolution"</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

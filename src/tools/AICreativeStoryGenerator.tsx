import React, { useState } from 'react';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ToolWrapper } from '../components/common/ToolWrapper';

interface StoryResult {
  title: string;
  story: string;
  genre: string;
  wordCount: number;
  readingTime: number;
  characterAnalysis: string;
  plotSummary: string;
  themes: string[];
  moodAnalysis: string;
  sequel_suggestions: string[];
}

const AICreativeStoryGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [length, setLength] = useState('');
  const [characters, setCharacters] = useState('');
  const [setting, setSetting] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [story, setStory] = useState<StoryResult | null>(null);
  const [storyHistory, setStoryHistory] = useState<any[]>([]);

  const genres = [
    'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Horror',
    'Adventure', 'Comedy', 'Drama', 'Thriller', 'Historical Fiction',
    'Dystopian', 'Magical Realism', 'Western', 'Cyberpunk', 'Steampunk'
  ];

  const moods = [
    'Uplifting', 'Dark', 'Mysterious', 'Romantic', 'Humorous',
    'Suspenseful', 'Melancholic', 'Inspiring', 'Eerie', 'Adventurous',
    'Nostalgic', 'Intense', 'Whimsical', 'Dramatic', 'Peaceful'
  ];

  const lengths = [
    { value: 'flash', label: 'Flash Fiction (100-300 words)', words: 200 },
    { value: 'short', label: 'Short Story (500-1000 words)', words: 750 },
    { value: 'medium', label: 'Medium Story (1000-2000 words)', words: 1500 },
    { value: 'long', label: 'Long Story (2000+ words)', words: 2500 }
  ];

  const generateStory = async () => {
    if (!prompt.trim()) {
      alert('❌ Please provide a story prompt first.');
      return;
    }

    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const generatedStory = await createStory(prompt, genre, mood, length, characters, setting);
      setStory(generatedStory);
      
      // Add to history
      const storyEntry = {
        id: Date.now(),
        title: generatedStory.title,
        genre: generatedStory.genre,
        wordCount: generatedStory.wordCount,
        timestamp: new Date().toLocaleString(),
        preview: generatedStory.story.substring(0, 100) + '...'
      };
      setStoryHistory(prev => [storyEntry, ...prev.slice(0, 9)]);

      alert('📚 Story generated successfully! Check your creative masterpiece below.');
    } catch (error) {
      console.error('Error generating story:', error);
      alert('❌ Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const createStory = async (
    prompt: string, 
    genre: string, 
    mood: string, 
    length: string, 
    characters: string, 
    setting: string
  ): Promise<StoryResult> => {
    const selectedLength = lengths.find(l => l.value === length);
    const targetWords = selectedLength?.words || 750;
    
    // Generate story based on inputs
    const storyContent = generateStoryContent(prompt, genre, mood, characters, setting, targetWords);
    const title = generateTitle(prompt, genre);
    const themes = extractThemes(genre, mood, prompt);
    
    return {
      title,
      story: storyContent,
      genre: genre || 'General Fiction',
      wordCount: storyContent.split(' ').length,
      readingTime: Math.ceil(storyContent.split(' ').length / 200), // 200 WPM average
      characterAnalysis: analyzeCharacters(characters, storyContent),
      plotSummary: generatePlotSummary(storyContent),
      themes,
      moodAnalysis: analyzeMood(mood, storyContent),
      sequel_suggestions: generateSequelSuggestions(prompt, genre, storyContent)
    };
  };

  const generateStoryContent = (
    prompt: string, 
    genre: string, 
    mood: string, 
    characters: string, 
    setting: string, 
    targetWords: number
  ): string => {
    // This is a simplified story generation - in a real app, this would use AI APIs
    const storyTemplates = {
      'Fantasy': {
        opening: "In a realm where magic flows like rivers through ancient forests,",
        conflict: "An ancient evil stirred, threatening to consume all that was pure and good.",
        resolution: "With courage born of desperation and magic forged in friendship, our heroes prevailed."
      },
      'Science Fiction': {
        opening: "In the year 2157, when humanity had spread across the stars,",
        conflict: "A discovery that challenged everything we thought we knew about the universe.",
        resolution: "Through innovation and sacrifice, a new chapter in human evolution began."
      },
      'Mystery': {
        opening: "The rain hadn't stopped for three days when the first body was discovered,",
        conflict: "Each clue led deeper into a web of secrets that someone was desperate to keep buried.",
        resolution: "The truth, when it finally emerged, was more shocking than anyone could have imagined."
      },
      'Romance': {
        opening: "Their eyes met across the crowded room, and in that instant, everything changed.",
        conflict: "But fate, it seemed, had other plans for their newfound love.",
        resolution: "Love, they learned, was not just about finding each other, but about choosing to stay."
      },
      'Horror': {
        opening: "The old house had been empty for decades, yet something still moved within its walls,",
        conflict: "What had started as curiosity quickly turned into a fight for survival.",
        resolution: "Some doors, once opened, can never truly be closed again."
      }
    };

    const template = storyTemplates[genre as keyof typeof storyTemplates] || storyTemplates['Fantasy'];
    
    let story = `${template.opening} ${prompt}\n\n`;
    
    if (characters) {
      story += `Our tale centers around ${characters}, whose lives would soon be forever changed. `;
    }
    
    if (setting) {
      story += `The story unfolds in ${setting}, a place where ordinary rules seemed not to apply. `;
    }
    
    // Generate middle section based on genre and mood
    story += generateMiddleSection(genre, mood, prompt);
    
    // Add conflict
    story += `\n\n${template.conflict}\n\n`;
    
    // Generate climax and resolution
    story += generateClimax(genre, mood);
    story += `\n\n${template.resolution}`;
    
    // Adjust length if needed
    const currentWords = story.split(' ').length;
    if (currentWords < targetWords * 0.8) {
      story += generateAdditionalContent(genre, mood, targetWords - currentWords);
    }
    
    return story;
  };

  const generateMiddleSection = (genre: string, mood: string, prompt: string): string => {
    const sections = {
      dark: "Shadows seemed to lengthen with each passing moment, and an inexplicable dread settled over everything like a suffocating blanket.",
      uplifting: "Hope bloomed in the most unexpected places, reminding everyone that even in darkness, light could always find a way to shine through.",
      mysterious: "Questions multiplied faster than answers, each revelation only deepening the enigma that surrounded them.",
      romantic: "Hearts spoke in languages that words could never capture, and every stolen glance carried the weight of unspoken promises.",
      adventurous: "Each step forward brought new challenges and discoveries, transforming an ordinary journey into an extraordinary quest."
    };
    
    const moodKey = mood.toLowerCase() as keyof typeof sections;
    return sections[moodKey] || sections.mysterious;
  };

  const generateClimax = (genre: string, mood: string): string => {
    const climaxTemplates = {
      'Fantasy': "Magic crackled through the air as ancient powers awakened, and the very fabric of reality trembled under the weight of destiny.",
      'Science Fiction': "Technology and humanity collided in ways never before imagined, forcing a choice between progress and preservation.",
      'Mystery': "The final piece of the puzzle clicked into place, revealing a truth that recontextualized everything that came before.",
      'Romance': "Hearts laid bare, they faced the moment that would either unite them forever or tear them apart.",
      'Horror': "Terror reached its crescendo as the true nature of the evil was finally revealed."
    };
    
    return climaxTemplates[genre as keyof typeof climaxTemplates] || climaxTemplates['Fantasy'];
  };

  const generateAdditionalContent = (genre: string, mood: string, neededWords: number): string => {
    const additionalSections = [
      "\n\nThe journey had changed them all in ways they were only beginning to understand.",
      "\n\nLooking back, they realized this was just the beginning of something much larger.",
      "\n\nThe consequences of their choices would ripple through time in ways they could never have foreseen.",
      "\n\nSome stories end, but the best ones transform into new beginnings."
    ];
    
    return additionalSections.join('');
  };

  const generateTitle = (prompt: string, genre: string): string => {
    const titleWords = prompt.split(' ').slice(0, 3);
    const genreTitles = {
      'Fantasy': ['The Chronicles of', 'The Legend of', 'The Saga of'],
      'Science Fiction': ['Beyond the', 'The Future of', 'Starbound:'],
      'Mystery': ['The Secret of', 'The Case of', 'Shadows of'],
      'Romance': ['Love in', 'Hearts of', 'The Promise of'],
      'Horror': ['The Haunting of', 'Terror in', 'The Curse of']
    };
    
    const prefixes = genreTitles[genre as keyof typeof genreTitles] || ['The Story of'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    return `${randomPrefix} ${titleWords.join(' ')}`;
  };

  const extractThemes = (genre: string, mood: string, prompt: string): string[] => {
    const themes = ['Identity', 'Love', 'Sacrifice', 'Redemption', 'Growth'];
    const genreThemes = {
      'Fantasy': ['Good vs Evil', 'Magic vs Reality', 'Destiny'],
      'Science Fiction': ['Technology vs Humanity', 'Evolution', 'Discovery'],
      'Mystery': ['Truth vs Deception', 'Justice', 'Hidden Secrets'],
      'Romance': ['Love Conquers All', 'Second Chances', 'Soulmates'],
      'Horror': ['Fear of Unknown', 'Survival', 'Corruption']
    };
    
    const specificThemes = genreThemes[genre as keyof typeof genreThemes] || [];
    return [...themes.slice(0, 2), ...specificThemes.slice(0, 2)];
  };

  const analyzeCharacters = (characters: string, story: string): string => {
    if (!characters) return 'Characters emerge organically through the narrative, each serving to advance both plot and theme.';
    
    return `The characters ${characters} are well-developed protagonists whose personal growth mirrors the story's central themes. Their interactions drive the narrative forward while revealing deeper truths about human nature.`;
  };

  const generatePlotSummary = (story: string): string => {
    return 'A compelling narrative that weaves together character development, thematic depth, and engaging plot progression to create a memorable reading experience.';
  };

  const analyzeMood = (mood: string, story: string): string => {
    if (!mood) return 'The story maintains a balanced emotional tone throughout.';
    
    return `The ${mood.toLowerCase()} atmosphere permeates the narrative, creating an immersive emotional experience that enhances character development and plot progression.`;
  };

  const generateSequelSuggestions = (prompt: string, genre: string, story: string): string[] => {
    return [
      'Explore the aftermath and consequences of the main events',
      'Focus on a secondary character\'s perspective',
      'Jump forward in time to see long-term impacts',
      'Prequel exploring the background and origins',
      'Expand the world-building and introduce new locations'
    ];
  };

  const downloadStory = () => {
    if (!story) return;

    const storyDocument = `
${story.title}
${'='.repeat(story.title.length)}

Genre: ${story.genre}
Word Count: ${story.wordCount}
Reading Time: ${story.readingTime} minutes
Generated on: ${new Date().toLocaleString()}

STORY:
${story.story}

---

STORY ANALYSIS:

Plot Summary:
${story.plotSummary}

Character Analysis:
${story.characterAnalysis}

Themes:
${story.themes.map(theme => `• ${theme}`).join('\n')}

Mood Analysis:
${story.moodAnalysis}

Sequel Suggestions:
${story.sequel_suggestions.map(suggestion => `• ${suggestion}`).join('\n')}

---
Generated by AI Creative Story Generator
`;

    const blob = new Blob([storyDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    alert('📚 Story downloaded successfully!');
  };

  const clearForm = () => {
    setPrompt('');
    setGenre('');
    setMood('');
    setLength('');
    setCharacters('');
    setSetting('');
    setStory(null);
  };

  return (
    <ToolWrapper
      toolId="ai-creative-story-generator"
      toolName="AI Creative Story Generator"
      toolDescription="Generate creative stories with AI assistance. Perfect for writers, storytellers, and creative minds."
      toolCategory="AI"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">📚 AI Creative Story Generator</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Transform your ideas into captivating stories with AI-powered creativity
          </p>
        </div>

        {!story ? (
          <div className="space-y-6">
            {/* Story Configuration */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">✨ Story Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Genre</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                    >
                      <option value="">Select genre...</option>
                      {genres.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Mood</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                    >
                      <option value="">Select mood...</option>
                      {moods.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Length</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                    >
                      <option value="">Select length...</option>
                      {lengths.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Main Characters (Optional)</label>
                    <Input
                      placeholder="e.g., a brave knight, a mysterious wizard..."
                      value={characters}
                      onChange={(e) => setCharacters(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Setting (Optional)</label>
                    <Input
                      placeholder="e.g., a magical forest, futuristic city..."
                      value={setting}
                      onChange={(e) => setSetting(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Story Prompt</label>
                  <Textarea
                    placeholder="Describe your story idea... What happens? Who are the characters? What's the central conflict or theme?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={generateStory}
                    disabled={isGenerating || !prompt.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isGenerating ? '✍️ Creating Story...' : '✍️ Generate Story'}
                  </Button>
                  <Button
                    onClick={clearForm}
                    variant="outline"
                  >
                    🧹 Clear Form
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Story History */}
            {storyHistory.length > 0 && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">📖 Recent Stories</h3>
                  <div className="space-y-3">
                    {storyHistory.slice(0, 3).map((storyItem, index) => (
                      <div key={storyItem.id} className="bg-white p-3 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{storyItem.title}</h4>
                            <p className="text-sm text-gray-600">{storyItem.preview}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs bg-blue-100 px-2 py-1 rounded block mb-1">
                              {storyItem.genre}
                            </span>
                            <span className="text-xs text-gray-500">
                              {storyItem.wordCount} words
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Story Results */
          <div className="space-y-6">
            {/* Story Header */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6 text-center">
                <h3 className="text-3xl font-bold mb-2">{story.title}</h3>
                <div className="flex justify-center space-x-6 text-sm text-gray-600">
                  <span>📚 {story.genre}</span>
                  <span>📝 {story.wordCount} words</span>
                  <span>⏱️ {story.readingTime} min read</span>
                </div>
              </CardContent>
            </Card>

            {/* The Story */}
            <Card>
              <CardContent className="p-8">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line text-lg leading-relaxed">
                    {story.story}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-blue-800">📊 Plot Summary</h3>
                  <p className="text-sm leading-relaxed">{story.plotSummary}</p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-green-800">👥 Character Analysis</h3>
                  <p className="text-sm leading-relaxed">{story.characterAnalysis}</p>
                </CardContent>
              </Card>
            </div>

            {/* Themes and Mood */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-yellow-800">🎭 Themes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {story.themes.map((theme, index) => (
                      <div key={index} className="bg-white p-2 rounded border border-yellow-200">
                        <span className="text-sm font-medium">{theme}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-purple-800">🎨 Mood Analysis</h3>
                  <p className="text-sm leading-relaxed">{story.moodAnalysis}</p>
                </CardContent>
              </Card>
            </div>

            {/* Sequel Suggestions */}
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-orange-800">🔮 Sequel Ideas</h3>
                <ul className="space-y-2">
                  {story.sequel_suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-orange-600 mt-1">•</span>
                      <span className="text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={downloadStory}
                className="bg-green-600 hover:bg-green-700"
              >
                📥 Download Story
              </Button>
              <Button
                onClick={() => setStory(null)}
                variant="outline"
              >
                ✍️ Generate New Story
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">✍️ Crafting Your Story...</h3>
              <p className="text-gray-600">Weaving characters, plot, and magic together</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AICreativeStoryGenerator;

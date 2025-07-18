import React, { useState } from 'react';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ToolWrapper } from '../components/common/ToolWrapper';

interface DreamInterpretation {
  mainThemes: string[];
  psychologicalMeaning: string;
  emotionalState: string;
  symbolAnalysis: {
    symbol: string;
    meaning: string;
    significance: string;
  }[];
  lifeReflections: string[];
  actionableInsights: string[];
  dreamType: string;
  lucidityLevel: number;
  emotionalIntensity: number;
  spiritualMeaning: string;
  recommendations: string[];
}

const AIDreamInterpreter = () => {
  const [dreamDescription, setDreamDescription] = useState('');
  const [dreamDate, setDreamDate] = useState('');
  const [dreamMood, setDreamMood] = useState('');
  const [recentLife, setRecentLife] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interpretation, setInterpretation] = useState<DreamInterpretation | null>(null);
  const [dreamHistory, setDreamHistory] = useState<any[]>([]);

  const moodOptions = [
    'Happy', 'Anxious', 'Confused', 'Peaceful', 'Excited',
    'Fearful', 'Sad', 'Curious', 'Nostalgic', 'Frustrated'
  ];

  const analyzeDream = async () => {
    if (!dreamDescription.trim()) {
      alert('❌ Please describe your dream first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 4000));

      const analysis = await generateDreamInterpretation(dreamDescription, dreamMood, recentLife);
      setInterpretation(analysis);
      
      // Add to history
      const dreamEntry = {
        id: Date.now(),
        date: dreamDate || new Date().toISOString().split('T')[0],
        description: dreamDescription,
        mood: dreamMood,
        interpretation: analysis,
        timestamp: new Date().toLocaleString()
      };
      setDreamHistory(prev => [dreamEntry, ...prev.slice(0, 9)]); // Keep last 10 dreams

      alert('🌙 Dream interpretation complete! Discover the hidden meanings below.');
    } catch (error) {
      console.error('Error analyzing dream:', error);
      alert('❌ Failed to interpret dream. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateDreamInterpretation = async (description: string, mood: string, lifeContext: string): Promise<DreamInterpretation> => {
    // Analyze dream content for themes and symbols
    const words = description.toLowerCase().split(/\s+/);
    const themes = extractThemes(words);
    const symbols = extractSymbols(words);
    const dreamType = determineDreamType(words, mood);
    
    return {
      mainThemes: themes,
      psychologicalMeaning: generatePsychologicalAnalysis(themes, mood, lifeContext),
      emotionalState: analyzeEmotionalState(mood, words),
      symbolAnalysis: symbols,
      lifeReflections: generateLifeReflections(themes, lifeContext),
      actionableInsights: generateActionableInsights(themes, mood),
      dreamType,
      lucidityLevel: calculateLucidityLevel(words),
      emotionalIntensity: calculateEmotionalIntensity(words, mood),
      spiritualMeaning: generateSpiritualMeaning(themes, symbols),
      recommendations: generateRecommendations(themes, mood)
    };
  };

  const extractThemes = (words: string[]): string[] => {
    const themeKeywords = {
      'transformation': ['change', 'transform', 'metamorphosis', 'evolve', 'grow'],
      'relationships': ['family', 'friend', 'lover', 'partner', 'relationship', 'love'],
      'career': ['work', 'job', 'career', 'boss', 'office', 'meeting'],
      'fear': ['afraid', 'scared', 'fear', 'terrified', 'anxious', 'worried'],
      'freedom': ['fly', 'flying', 'free', 'escape', 'liberate', 'soar'],
      'loss': ['death', 'die', 'lost', 'missing', 'gone', 'disappeared'],
      'power': ['control', 'power', 'strength', 'authority', 'dominate'],
      'creativity': ['create', 'art', 'music', 'paint', 'write', 'imagine'],
      'healing': ['heal', 'cure', 'medicine', 'doctor', 'recovery'],
      'spirituality': ['god', 'angel', 'spirit', 'soul', 'divine', 'sacred']
    };

    const foundThemes: string[] = [];
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => words.includes(keyword))) {
        foundThemes.push(theme);
      }
    });

    return foundThemes.length > 0 ? foundThemes : ['self-discovery'];
  };

  const extractSymbols = (words: string[]) => {
    const symbolMeanings = {
      'water': {
        meaning: 'Emotions, subconscious, purification',
        significance: 'Represents your emotional state and spiritual cleansing'
      },
      'fire': {
        meaning: 'Passion, transformation, destruction',
        significance: 'Indicates intense emotions or major life changes'
      },
      'animal': {
        meaning: 'Instincts, natural wisdom, primal nature',
        significance: 'Connects you to your intuitive and instinctual self'
      },
      'house': {
        meaning: 'Self, psyche, personal foundation',
        significance: 'Represents your mental and emotional state'
      },
      'car': {
        meaning: 'Life direction, control, personal drive',
        significance: 'Shows how you navigate through life situations'
      },
      'death': {
        meaning: 'Endings, transformation, new beginnings',
        significance: 'Symbolizes the end of one phase and start of another'
      },
      'baby': {
        meaning: 'New beginnings, innocence, potential',
        significance: 'Represents new projects, ideas, or aspects of yourself'
      },
      'flying': {
        meaning: 'Freedom, transcendence, escape',
        significance: 'Indicates desire for liberation or spiritual growth'
      }
    };

    const foundSymbols: any[] = [];
    Object.entries(symbolMeanings).forEach(([symbol, data]) => {
      if (words.some(word => word.includes(symbol))) {
        foundSymbols.push({ symbol, ...data });
      }
    });

    return foundSymbols.length > 0 ? foundSymbols : [
      {
        symbol: 'journey',
        meaning: 'Personal growth, life path, discovery',
        significance: 'Represents your ongoing personal development'
      }
    ];
  };

  const determineDreamType = (words: string[], mood: string): string => {
    if (words.includes('flying') || words.includes('fly')) return 'Flying Dream';
    if (words.includes('chase') || words.includes('running')) return 'Chase Dream';
    if (words.includes('water') || words.includes('ocean')) return 'Water Dream';
    if (words.includes('death') || words.includes('die')) return 'Death Dream';
    if (mood === 'Fearful' || words.includes('scared')) return 'Nightmare';
    if (words.includes('love') || words.includes('romance')) return 'Love Dream';
    return 'Symbolic Dream';
  };

  const generatePsychologicalAnalysis = (themes: string[], mood: string, lifeContext: string): string => {
    const analyses = {
      'transformation': 'Your subconscious is processing significant changes in your life. This dream suggests you are in a period of personal growth and evolution.',
      'relationships': 'Your dream reflects your current emotional connections and interpersonal dynamics. It may indicate a need for deeper intimacy or resolution of relationship issues.',
      'fear': 'This dream is your mind\'s way of processing anxieties and concerns. It\'s helping you confront and work through your fears in a safe space.',
      'freedom': 'Your psyche is expressing a desire for liberation and independence. You may feel constrained in some area of your life and seek more autonomy.',
      'power': 'The dream reflects themes of control and authority in your life. It may indicate your relationship with power, either seeking it or feeling overwhelmed by it.'
    };

    const primaryTheme = themes[0] || 'self-discovery';
    return analyses[primaryTheme as keyof typeof analyses] || 
           'Your dream represents your subconscious mind processing daily experiences and emotions, seeking balance and understanding in your life journey.';
  };

  const analyzeEmotionalState = (mood: string, words: string[]): string => {
    const emotionalMappings = {
      'Happy': 'You are in a positive emotional state, open to joy and new experiences.',
      'Anxious': 'Your subconscious is processing worry and uncertainty, seeking resolution.',
      'Peaceful': 'You are in emotional harmony, feeling balanced and centered.',
      'Fearful': 'Your mind is working through anxieties and seeking emotional safety.',
      'Confused': 'You are processing complex emotions and seeking clarity in your life.'
    };

    return emotionalMappings[mood as keyof typeof emotionalMappings] || 
           'Your emotional state reflects a mixture of feelings as you navigate life\'s complexities.';
  };

  const generateLifeReflections = (themes: string[], lifeContext: string): string[] => {
    const reflections = [
      'Consider how the dream\'s themes relate to your current life situations',
      'Reflect on any unresolved emotions or situations the dream might be highlighting',
      'Think about what changes or growth the dream might be encouraging',
      'Examine any relationships or connections that appeared in your dream'
    ];

    if (lifeContext) {
      reflections.unshift(`Given your recent life context: "${lifeContext}", this dream may be helping you process these experiences`);
    }

    return reflections;
  };

  const generateActionableInsights = (themes: string[], mood: string): string[] => {
    const insights = [
      'Keep a dream journal to track recurring patterns and themes',
      'Practice mindfulness and meditation to enhance dream recall',
      'Address any anxieties or fears highlighted in your dream',
      'Embrace the positive messages and guidance from your subconscious'
    ];

    if (themes.includes('fear')) {
      insights.push('Consider therapy or counseling if fears are overwhelming');
    }
    if (themes.includes('relationships')) {
      insights.push('Initiate important conversations with loved ones');
    }
    if (themes.includes('career')) {
      insights.push('Evaluate your professional goals and satisfaction');
    }

    return insights;
  };

  const calculateLucidityLevel = (words: string[]): number => {
    const lucidKeywords = ['realize', 'aware', 'conscious', 'control', 'lucid'];
    const lucidCount = lucidKeywords.filter(keyword => 
      words.some(word => word.includes(keyword))
    ).length;
    return Math.min(lucidCount * 20, 100);
  };

  const calculateEmotionalIntensity = (words: string[], mood: string): number => {
    const intensityWords = ['very', 'extremely', 'intensely', 'overwhelming', 'powerful'];
    const intensityCount = intensityWords.filter(word => words.includes(word)).length;
    const moodIntensity = mood === 'Fearful' || mood === 'Excited' ? 30 : 15;
    return Math.min((intensityCount * 20) + moodIntensity, 100);
  };

  const generateSpiritualMeaning = (themes: string[], symbols: any[]): string => {
    if (themes.includes('spirituality')) {
      return 'Your dream carries strong spiritual significance, suggesting a deep connection with your higher self and divine guidance.';
    }
    if (symbols.some(s => s.symbol === 'flying')) {
      return 'The spiritual essence of your dream points to transcendence and elevation of consciousness.';
    }
    if (themes.includes('transformation')) {
      return 'Spiritually, this dream represents a metamorphosis of your soul and spiritual awakening.';
    }
    return 'Your dream reflects your spiritual journey and the universe\'s way of communicating wisdom through symbols.';
  };

  const generateRecommendations = (themes: string[], mood: string): string[] => {
    const recommendations = [
      'Practice gratitude before sleep to invite positive dreams',
      'Create a peaceful sleep environment for better dream experiences',
      'Set intentions before sleeping for guidance dreams'
    ];

    if (mood === 'Fearful') {
      recommendations.push('Try relaxation techniques before bed to reduce nightmares');
    }
    if (themes.includes('creativity')) {
      recommendations.push('Keep art supplies by your bed to capture dream inspiration');
    }

    return recommendations;
  };

  const downloadDreamReport = () => {
    if (!interpretation) return;

    const report = `
AI DREAM INTERPRETATION REPORT
Date: ${dreamDate || new Date().toLocaleDateString()}
Dream Mood: ${dreamMood}
Generated on: ${new Date().toLocaleString()}

DREAM DESCRIPTION:
${dreamDescription}

DREAM TYPE: ${interpretation.dreamType}

MAIN THEMES:
${interpretation.mainThemes.map(t => `• ${t.charAt(0).toUpperCase() + t.slice(1)}`).join('\n')}

PSYCHOLOGICAL MEANING:
${interpretation.psychologicalMeaning}

EMOTIONAL STATE:
${interpretation.emotionalState}

SYMBOL ANALYSIS:
${interpretation.symbolAnalysis.map(s => `• ${s.symbol.toUpperCase()}: ${s.meaning}\n  Significance: ${s.significance}`).join('\n\n')}

SPIRITUAL MEANING:
${interpretation.spiritualMeaning}

LIFE REFLECTIONS:
${interpretation.lifeReflections.map(r => `• ${r}`).join('\n')}

ACTIONABLE INSIGHTS:
${interpretation.actionableInsights.map(i => `• ${i}`).join('\n')}

RECOMMENDATIONS:
${interpretation.recommendations.map(r => `• ${r}`).join('\n')}

DREAM METRICS:
• Lucidity Level: ${interpretation.lucidityLevel}%
• Emotional Intensity: ${interpretation.emotionalIntensity}%

---
Report generated by AI Dream Interpreter
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dream-interpretation-${dreamDate || 'report'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    alert('🌙 Dream interpretation report downloaded successfully!');
  };

  const clearForm = () => {
    setDreamDescription('');
    setDreamDate('');
    setDreamMood('');
    setRecentLife('');
    setInterpretation(null);
  };

  return (
    <ToolWrapper
      toolId="ai-dream-interpreter"
      toolName="AI Dream Interpreter"
      toolDescription="Unlock the hidden meanings in your dreams with AI-powered analysis and psychological insights."
      toolCategory="AI"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">🌙 AI Dream Interpreter</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Discover the hidden meanings, symbols, and messages in your dreams
          </p>
        </div>

        {/* Dream Input Form */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">📝 Describe Your Dream</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dream Date</label>
                <Input
                  type="date"
                  value={dreamDate}
                  onChange={(e) => setDreamDate(e.target.value)}
                  placeholder="When did you have this dream?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Mood in the Dream</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={dreamMood}
                  onChange={(e) => setDreamMood(e.target.value)}
                >
                  <option value="">Select mood...</option>
                  {moodOptions.map(mood => (
                    <option key={mood} value={mood}>{mood}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Dream Description</label>
              <Textarea
                placeholder="Describe your dream in detail... Include people, places, objects, actions, emotions, and anything that stood out to you."
                value={dreamDescription}
                onChange={(e) => setDreamDescription(e.target.value)}
                rows={6}
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Recent Life Context (Optional)</label>
              <Textarea
                placeholder="Briefly describe what's been happening in your life recently that might be relevant to this dream..."
                value={recentLife}
                onChange={(e) => setRecentLife(e.target.value)}
                rows={3}
                className="w-full"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={analyzeDream}
                disabled={isAnalyzing || !dreamDescription.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? '🔮 Interpreting...' : '🔮 Interpret Dream'}
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

        {/* Loading State */}
        {isAnalyzing && (
          <Card className="bg-indigo-50 border-indigo-200">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">🤖 Analyzing Your Dream...</h3>
              <p className="text-gray-600">Unlocking hidden meanings and symbols</p>
            </CardContent>
          </Card>
        )}

        {/* Dream Interpretation Results */}
        {interpretation && (
          <div className="space-y-6">
            {/* Dream Type & Overview */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Dream Type: {interpretation.dreamType}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold">Lucidity Level</h4>
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                        <div 
                          className="bg-indigo-600 h-3 rounded-full"
                          style={{ width: `${interpretation.lucidityLevel}%` }}
                        />
                      </div>
                      <span className="text-sm">{interpretation.lucidityLevel}%</span>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold">Emotional Intensity</h4>
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                        <div 
                          className="bg-purple-600 h-3 rounded-full"
                          style={{ width: `${interpretation.emotionalIntensity}%` }}
                        />
                      </div>
                      <span className="text-sm">{interpretation.emotionalIntensity}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Themes */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-blue-800">🎯 Main Themes</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {interpretation.mainThemes.map((theme, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-blue-200">
                      <span className="text-sm font-medium capitalize">{theme}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Psychological & Spiritual Meaning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-green-800">🧠 Psychological Meaning</h3>
                  <p className="text-sm leading-relaxed">{interpretation.psychologicalMeaning}</p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-purple-800">✨ Spiritual Meaning</h3>
                  <p className="text-sm leading-relaxed">{interpretation.spiritualMeaning}</p>
                </CardContent>
              </Card>
            </div>

            {/* Symbol Analysis */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-yellow-800">🔮 Symbol Analysis</h3>
                <div className="space-y-4">
                  {interpretation.symbolAnalysis.map((symbol, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold capitalize text-lg">{symbol.symbol}</h4>
                      <p className="text-sm text-gray-600 mt-1">{symbol.meaning}</p>
                      <p className="text-sm text-gray-700 mt-2 font-medium">Significance: {symbol.significance}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Life Reflections & Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-orange-800">💭 Life Reflections</h3>
                  <ul className="space-y-2">
                    {interpretation.lifeReflections.map((reflection, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span className="text-sm">{reflection}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-teal-50 border-teal-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-teal-800">💡 Actionable Insights</h3>
                  <ul className="space-y-2">
                    {interpretation.actionableInsights.map((insight, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-teal-600 mt-1">•</span>
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="bg-pink-50 border-pink-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-pink-800">🌟 Recommendations</h3>
                <ul className="space-y-2">
                  {interpretation.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-pink-600 mt-1">•</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={downloadDreamReport}
                className="bg-green-600 hover:bg-green-700"
              >
                📊 Download Report
              </Button>
              <Button
                onClick={() => setInterpretation(null)}
                variant="outline"
              >
                🔄 New Dream Analysis
              </Button>
            </div>
          </div>
        )}

        {/* Dream History */}
        {dreamHistory.length > 0 && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">📚 Recent Dream History</h3>
              <div className="space-y-3">
                {dreamHistory.slice(0, 3).map((dream, index) => (
                  <div key={dream.id} className="bg-white p-3 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{dream.interpretation.dreamType}</h4>
                        <p className="text-sm text-gray-600">{dream.date}</p>
                      </div>
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                        {dream.interpretation.mainThemes[0]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AIDreamInterpreter;

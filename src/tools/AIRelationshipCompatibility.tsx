import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ToolWrapper } from '../components/common/ToolWrapper';

interface CompatibilityResult {
  overallScore: number;
  compatibility: {
    emotional: number;
    intellectual: number;
    physical: number;
    spiritual: number;
    lifestyle: number;
    communication: number;
  };
  strengths: string[];
  challenges: string[];
  relationshipTips: string[];
  zodiacCompatibility: string;
  personalityMatch: string;
  longTermPotential: string;
  improvementAreas: string[];
  dateIdeas: string[];
  communicationStyle: string;
  conflictResolution: string[];
}

interface PersonProfile {
  name: string;
  age: string;
  zodiacSign: string;
  interests: string;
  values: string;
  personalityType: string;
  loveLanguage: string;
  lifestyle: string;
  goals: string;
  communicationStyle: string;
}

const AIRelationshipCompatibility = () => {
  const [person1, setPerson1] = useState<PersonProfile>({
    name: '', age: '', zodiacSign: '', interests: '', values: '',
    personalityType: '', loveLanguage: '', lifestyle: '', goals: '', communicationStyle: ''
  });
  
  const [person2, setPerson2] = useState<PersonProfile>({
    name: '', age: '', zodiacSign: '', interests: '', values: '',
    personalityType: '', loveLanguage: '', lifestyle: '', goals: '', communicationStyle: ''
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);

  const zodiacSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const personalityTypes = [
    'Extrovert', 'Introvert', 'Ambivert', 'Analytical', 'Creative',
    'Practical', 'Emotional', 'Logical', 'Adventurous', 'Stable'
  ];

  const loveLanguages = [
    'Words of Affirmation', 'Quality Time', 'Physical Touch',
    'Acts of Service', 'Receiving Gifts'
  ];

  const communicationStyles = [
    'Direct', 'Indirect', 'Emotional', 'Logical', 'Assertive',
    'Passive', 'Diplomatic', 'Spontaneous'
  ];

  const lifestyleOptions = [
    'Active & Outdoorsy', 'Homebody', 'Social Butterfly', 'Career Focused',
    'Family Oriented', 'Adventurous', 'Minimalist', 'Luxury Loving'
  ];

  const analyzeCompatibility = async () => {
    if (!person1.name || !person2.name) {
      alert('❌ Please enter names for both people.');
      return;
    }

    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result = calculateCompatibility(person1, person2);
      setCompatibility(result);
      alert('💖 Compatibility analysis complete! Check your detailed results below.');
    } catch (error) {
      console.error('Error analyzing compatibility:', error);
      alert('❌ Failed to analyze compatibility. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateCompatibility = (p1: PersonProfile, p2: PersonProfile): CompatibilityResult => {
    const zodiacScore = calculateZodiacCompatibility(p1.zodiacSign, p2.zodiacSign);
    const personalityScore = calculatePersonalityCompatibility(p1.personalityType, p2.personalityType);
    const loveLanguageScore = calculateLoveLanguageCompatibility(p1.loveLanguage, p2.loveLanguage);
    const lifestyleScore = calculateLifestyleCompatibility(p1.lifestyle, p2.lifestyle);
    const communicationScore = calculateCommunicationCompatibility(p1.communicationStyle, p2.communicationStyle);
    const interestsScore = calculateInterestsCompatibility(p1.interests, p2.interests);
    const valuesScore = calculateValuesCompatibility(p1.values, p2.values);
    const goalsScore = calculateGoalsCompatibility(p1.goals, p2.goals);

    const overallScore = Math.round(
      (zodiacScore + personalityScore + loveLanguageScore + lifestyleScore + 
       communicationScore + interestsScore + valuesScore + goalsScore) / 8
    );

    return {
      overallScore,
      compatibility: {
        emotional: Math.round((loveLanguageScore + personalityScore) / 2),
        intellectual: Math.round((interestsScore + communicationScore) / 2),
        physical: zodiacScore,
        spiritual: valuesScore,
        lifestyle: lifestyleScore,
        communication: communicationScore
      },
      strengths: generateStrengths(p1, p2, overallScore),
      challenges: generateChallenges(p1, p2, overallScore),
      relationshipTips: generateRelationshipTips(p1, p2),
      zodiacCompatibility: getZodiacCompatibilityDescription(p1.zodiacSign, p2.zodiacSign),
      personalityMatch: getPersonalityMatchDescription(p1.personalityType, p2.personalityType),
      longTermPotential: getLongTermPotential(overallScore),
      improvementAreas: generateImprovementAreas(p1, p2),
      dateIdeas: generateDateIdeas(p1, p2),
      communicationStyle: getCommunicationStyleAdvice(p1.communicationStyle, p2.communicationStyle),
      conflictResolution: generateConflictResolution(p1, p2)
    };
  };

  const calculateZodiacCompatibility = (sign1: string, sign2: string): number => {
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      'Aries': { 'Leo': 95, 'Sagittarius': 90, 'Gemini': 85, 'Aquarius': 80, 'Libra': 70, 'Cancer': 60, 'Capricorn': 55, 'Pisces': 50, 'Taurus': 45, 'Virgo': 40, 'Scorpio': 35 },
      'Taurus': { 'Virgo': 95, 'Capricorn': 90, 'Cancer': 85, 'Pisces': 80, 'Scorpio': 70, 'Leo': 60, 'Aquarius': 55, 'Aries': 50, 'Gemini': 45, 'Libra': 40, 'Sagittarius': 35 },
      // Add more combinations as needed
    };

    return compatibilityMatrix[sign1]?.[sign2] || 
           compatibilityMatrix[sign2]?.[sign1] || 
           Math.floor(Math.random() * 30) + 50; // Random between 50-80 if not defined
  };

  const calculatePersonalityCompatibility = (type1: string, type2: string): number => {
    if (type1 === type2) return 85;
    if ((type1 === 'Extrovert' && type2 === 'Introvert') || 
        (type1 === 'Introvert' && type2 === 'Extrovert')) return 80;
    if ((type1 === 'Analytical' && type2 === 'Creative') ||
        (type1 === 'Creative' && type2 === 'Analytical')) return 75;
    return 70;
  };

  const calculateLoveLanguageCompatibility = (lang1: string, lang2: string): number => {
    if (lang1 === lang2) return 95;
    if ((lang1 === 'Physical Touch' && lang2 === 'Quality Time') ||
        (lang1 === 'Quality Time' && lang2 === 'Physical Touch')) return 85;
    return 70;
  };

  const calculateLifestyleCompatibility = (lifestyle1: string, lifestyle2: string): number => {
    if (lifestyle1 === lifestyle2) return 90;
    const compatible = [
      ['Active & Outdoorsy', 'Adventurous'],
      ['Homebody', 'Family Oriented'],
      ['Social Butterfly', 'Luxury Loving']
    ];
    
    for (const pair of compatible) {
      if ((pair.includes(lifestyle1) && pair.includes(lifestyle2))) return 80;
    }
    return 65;
  };

  const calculateCommunicationCompatibility = (style1: string, style2: string): number => {
    if (style1 === style2) return 85;
    if ((style1 === 'Direct' && style2 === 'Assertive') ||
        (style1 === 'Assertive' && style2 === 'Direct')) return 80;
    return 70;
  };

  const calculateInterestsCompatibility = (interests1: string, interests2: string): number => {
    const i1 = interests1.toLowerCase().split(',').map(i => i.trim());
    const i2 = interests2.toLowerCase().split(',').map(i => i.trim());
    
    const common = i1.filter(interest => i2.some(i => i.includes(interest) || interest.includes(i)));
    const compatibilityRatio = common.length / Math.max(i1.length, i2.length, 1);
    
    return Math.min(Math.round(compatibilityRatio * 100) + 50, 95);
  };

  const calculateValuesCompatibility = (values1: string, values2: string): number => {
    const v1 = values1.toLowerCase().split(',').map(v => v.trim());
    const v2 = values2.toLowerCase().split(',').map(v => v.trim());
    
    const common = v1.filter(value => v2.some(v => v.includes(value) || value.includes(v)));
    const compatibilityRatio = common.length / Math.max(v1.length, v2.length, 1);
    
    return Math.min(Math.round(compatibilityRatio * 100) + 60, 95);
  };

  const calculateGoalsCompatibility = (goals1: string, goals2: string): number => {
    const g1 = goals1.toLowerCase();
    const g2 = goals2.toLowerCase();
    
    const keywords = ['family', 'career', 'travel', 'money', 'health', 'education', 'creativity'];
    const matches = keywords.filter(keyword => g1.includes(keyword) && g2.includes(keyword));
    
    return Math.min(matches.length * 15 + 55, 95);
  };

  const generateStrengths = (p1: PersonProfile, p2: PersonProfile, score: number): string[] => {
    const strengths = [];
    
    if (p1.loveLanguage === p2.loveLanguage) {
      strengths.push(`Both share the same love language: ${p1.loveLanguage}`);
    }
    if (p1.zodiacSign && p2.zodiacSign) {
      strengths.push(`Strong zodiac compatibility between ${p1.zodiacSign} and ${p2.zodiacSign}`);
    }
    if (score > 80) {
      strengths.push('Excellent overall compatibility and natural understanding');
    }
    if (p1.lifestyle === p2.lifestyle) {
      strengths.push('Similar lifestyle preferences create harmony');
    }
    
    strengths.push('Potential for deep emotional connection');
    strengths.push('Complementary personality traits');
    
    return strengths;
  };

  const generateChallenges = (p1: PersonProfile, p2: PersonProfile, score: number): string[] => {
    const challenges = [];
    
    if (p1.communicationStyle !== p2.communicationStyle) {
      challenges.push('Different communication styles may require understanding');
    }
    if (score < 70) {
      challenges.push('May need extra effort to understand each other');
    }
    if (p1.personalityType === 'Extrovert' && p2.personalityType === 'Introvert') {
      challenges.push('Balancing social energy levels');
    }
    
    challenges.push('Working through individual differences');
    challenges.push('Maintaining independence while building connection');
    
    return challenges;
  };

  const generateRelationshipTips = (p1: PersonProfile, p2: PersonProfile): string[] => {
    return [
      `Focus on ${p1.loveLanguage === p2.loveLanguage ? 'your shared' : 'learning each other\'s'} love language`,
      'Practice active listening and empathy',
      'Plan activities that align with both your interests',
      'Respect each other\'s communication styles',
      'Create shared goals and dreams together',
      'Maintain individual identities while growing together'
    ];
  };

  const getZodiacCompatibilityDescription = (sign1: string, sign2: string): string => {
    const descriptions = {
      high: `${sign1} and ${sign2} have excellent cosmic compatibility with natural understanding and harmony.`,
      medium: `${sign1} and ${sign2} can create a beautiful relationship with mutual effort and understanding.`,
      low: `${sign1} and ${sign2} may face challenges but can build a strong bond through patience and compromise.`
    };
    
    const score = calculateZodiacCompatibility(sign1, sign2);
    if (score > 80) return descriptions.high;
    if (score > 60) return descriptions.medium;
    return descriptions.low;
  };

  const getPersonalityMatchDescription = (type1: string, type2: string): string => {
    if (type1 === type2) return `Both being ${type1} personalities creates natural understanding and shared perspectives.`;
    return `The ${type1} and ${type2} combination can create a balanced and complementary partnership.`;
  };

  const getLongTermPotential = (score: number): string => {
    if (score >= 85) return 'Excellent long-term potential with natural compatibility and shared values.';
    if (score >= 70) return 'Good long-term potential with effort and commitment from both partners.';
    if (score >= 60) return 'Moderate potential requiring work on understanding and compromise.';
    return 'Challenging but possible with significant effort and professional guidance.';
  };

  const generateImprovementAreas = (p1: PersonProfile, p2: PersonProfile): string[] => {
    return [
      'Develop better communication techniques',
      'Learn to appreciate differences',
      'Build shared interests and activities',
      'Practice conflict resolution skills',
      'Create more quality time together'
    ];
  };

  const generateDateIdeas = (p1: PersonProfile, p2: PersonProfile): string[] => {
    const ideas = [];
    
    if (p1.lifestyle?.includes('Active') || p2.lifestyle?.includes('Active')) {
      ideas.push('Hiking or outdoor adventure dates');
    }
    if (p1.interests?.includes('art') || p2.interests?.includes('art')) {
      ideas.push('Art gallery or museum visits');
    }
    
    ideas.push('Cooking together at home');
    ideas.push('Taking a dance class');
    ideas.push('Stargazing and deep conversations');
    ideas.push('Exploring new neighborhoods');
    
    return ideas;
  };

  const getCommunicationStyleAdvice = (style1: string, style2: string): string => {
    if (style1 === style2) {
      return `Both having ${style1} communication styles creates understanding but watch for blind spots.`;
    }
    return `The ${style1} and ${style2} styles can complement each other with patience and practice.`;
  };

  const generateConflictResolution = (p1: PersonProfile, p2: PersonProfile): string[] => {
    return [
      'Take breaks during heated discussions',
      'Use "I" statements instead of "you" accusations',
      'Listen to understand, not to respond',
      'Find compromise solutions that honor both perspectives',
      'Seek to understand the root cause of disagreements'
    ];
  };

  const downloadCompatibilityReport = () => {
    if (!compatibility) return;

    const report = `
RELATIONSHIP COMPATIBILITY ANALYSIS
${person1.name} & ${person2.name}
Generated on: ${new Date().toLocaleString()}

OVERALL COMPATIBILITY SCORE: ${compatibility.overallScore}%

COMPATIBILITY BREAKDOWN:
• Emotional: ${compatibility.compatibility.emotional}%
• Intellectual: ${compatibility.compatibility.intellectual}%
• Physical: ${compatibility.compatibility.physical}%
• Spiritual: ${compatibility.compatibility.spiritual}%
• Lifestyle: ${compatibility.compatibility.lifestyle}%
• Communication: ${compatibility.compatibility.communication}%

ZODIAC COMPATIBILITY:
${compatibility.zodiacCompatibility}

PERSONALITY MATCH:
${compatibility.personalityMatch}

LONG-TERM POTENTIAL:
${compatibility.longTermPotential}

RELATIONSHIP STRENGTHS:
${compatibility.strengths.map(s => `• ${s}`).join('\n')}

CHALLENGES TO WORK ON:
${compatibility.challenges.map(c => `• ${c}`).join('\n')}

RELATIONSHIP TIPS:
${compatibility.relationshipTips.map(t => `• ${t}`).join('\n')}

DATE IDEAS:
${compatibility.dateIdeas.map(d => `• ${d}`).join('\n')}

COMMUNICATION ADVICE:
${compatibility.communicationStyle}

CONFLICT RESOLUTION STRATEGIES:
${compatibility.conflictResolution.map(c => `• ${c}`).join('\n')}

IMPROVEMENT AREAS:
${compatibility.improvementAreas.map(i => `• ${i}`).join('\n')}

---
Report generated by AI Relationship Compatibility Analyzer
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compatibility-analysis-${person1.name}-${person2.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    alert('💖 Compatibility report downloaded successfully!');
  };

  const resetForm = () => {
    setPerson1({
      name: '', age: '', zodiacSign: '', interests: '', values: '',
      personalityType: '', loveLanguage: '', lifestyle: '', goals: '', communicationStyle: ''
    });
    setPerson2({
      name: '', age: '', zodiacSign: '', interests: '', values: '',
      personalityType: '', loveLanguage: '', lifestyle: '', goals: '', communicationStyle: ''
    });
    setCompatibility(null);
  };

  const renderPersonForm = (person: PersonProfile, setPerson: React.Dispatch<React.SetStateAction<PersonProfile>>, title: string) => (
    <Card className="bg-gradient-to-r from-pink-50 to-red-50 border-pink-200">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-pink-800">{title}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input
              placeholder="Name"
              value={person.name}
              onChange={(e) => setPerson(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Age</label>
            <Input
              placeholder="Age"
              value={person.age}
              onChange={(e) => setPerson(prev => ({ ...prev, age: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Zodiac Sign</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={person.zodiacSign}
              onChange={(e) => setPerson(prev => ({ ...prev, zodiacSign: e.target.value }))}
            >
              <option value="">Select zodiac sign...</option>
              {zodiacSigns.map(sign => (
                <option key={sign} value={sign}>{sign}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Personality Type</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={person.personalityType}
              onChange={(e) => setPerson(prev => ({ ...prev, personalityType: e.target.value }))}
            >
              <option value="">Select personality...</option>
              {personalityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Love Language</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={person.loveLanguage}
              onChange={(e) => setPerson(prev => ({ ...prev, loveLanguage: e.target.value }))}
            >
              <option value="">Select love language...</option>
              {loveLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Communication Style</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={person.communicationStyle}
              onChange={(e) => setPerson(prev => ({ ...prev, communicationStyle: e.target.value }))}
            >
              <option value="">Select style...</option>
              {communicationStyles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Lifestyle</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-lg"
            value={person.lifestyle}
            onChange={(e) => setPerson(prev => ({ ...prev, lifestyle: e.target.value }))}
          >
            <option value="">Select lifestyle...</option>
            {lifestyleOptions.map(lifestyle => (
              <option key={lifestyle} value={lifestyle}>{lifestyle}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Interests & Hobbies</label>
            <Input
              placeholder="e.g., reading, hiking, cooking, music..."
              value={person.interests}
              onChange={(e) => setPerson(prev => ({ ...prev, interests: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Core Values</label>
            <Input
              placeholder="e.g., family, honesty, adventure, security..."
              value={person.values}
              onChange={(e) => setPerson(prev => ({ ...prev, values: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Life Goals</label>
            <Input
              placeholder="e.g., travel the world, start a family, build a business..."
              value={person.goals}
              onChange={(e) => setPerson(prev => ({ ...prev, goals: e.target.value }))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ToolWrapper
      toolId="ai-relationship-compatibility"
      toolName="AI Relationship Compatibility"
      toolDescription="Analyze relationship compatibility with AI-powered insights into personality, zodiac, and lifestyle matches."
      toolCategory="AI"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">💖 AI Relationship Compatibility</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Discover your relationship compatibility with comprehensive AI analysis
          </p>
        </div>

        {!compatibility ? (
          <div className="space-y-6">
            {/* Person 1 */}
            {renderPersonForm(person1, setPerson1, "👤 Person 1")}

            {/* Person 2 */}
            {renderPersonForm(person2, setPerson2, "👤 Person 2")}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={analyzeCompatibility}
                disabled={isAnalyzing || !person1.name || !person2.name}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {isAnalyzing ? '💖 Analyzing...' : '💖 Analyze Compatibility'}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
              >
                🧹 Clear Form
              </Button>
            </div>
          </div>
        ) : (
          /* Results */
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Overall Compatibility</h3>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e5e5"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="3"
                      strokeDasharray={`${compatibility.overallScore}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{compatibility.overallScore}%</span>
                  </div>
                </div>
                <p className="text-lg font-medium">
                  {compatibility.overallScore >= 85 ? '💕 Excellent Match!' :
                   compatibility.overallScore >= 70 ? '💖 Good Compatibility' :
                   compatibility.overallScore >= 60 ? '💛 Moderate Match' : '💙 Needs Work'}
                </p>
              </CardContent>
            </Card>

            {/* Compatibility Breakdown */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">📊 Compatibility Breakdown</h3>
                <div className="space-y-4">
                  {Object.entries(compatibility.compatibility).map(([category, score]) => (
                    <div key={category} className="flex items-center space-x-4">
                      <div className="w-24 text-sm font-medium capitalize">{category}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-pink-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm font-medium">{score}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths and Challenges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-green-800">💪 Relationship Strengths</h3>
                  <ul className="space-y-2">
                    {compatibility.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-orange-800">⚠️ Potential Challenges</h3>
                  <ul className="space-y-2">
                    {compatibility.challenges.map((challenge, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span className="text-sm">{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-blue-800">🌟 Zodiac Compatibility</h3>
                  <p className="text-sm leading-relaxed">{compatibility.zodiacCompatibility}</p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-purple-800">🧠 Personality Match</h3>
                  <p className="text-sm leading-relaxed">{compatibility.personalityMatch}</p>
                </CardContent>
              </Card>
            </div>

            {/* Long-term Potential */}
            <Card className="bg-pink-50 border-pink-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-pink-800">🔮 Long-term Potential</h3>
                <p className="text-sm leading-relaxed">{compatibility.longTermPotential}</p>
              </CardContent>
            </Card>

            {/* Relationship Tips */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-yellow-800">💡 Relationship Tips</h3>
                <ul className="space-y-2">
                  {compatibility.relationshipTips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-yellow-600 mt-1">•</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Date Ideas */}
            <Card className="bg-teal-50 border-teal-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-teal-800">🎯 Perfect Date Ideas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {compatibility.dateIdeas.map((idea, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-teal-200">
                      <span className="text-sm font-medium">{idea}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={downloadCompatibilityReport}
                className="bg-green-600 hover:bg-green-700"
              >
                📊 Download Report
              </Button>
              <Button
                onClick={() => setCompatibility(null)}
                variant="outline"
              >
                🔄 New Analysis
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <Card className="bg-pink-50 border-pink-200">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">💖 Analyzing Compatibility...</h3>
              <p className="text-gray-600">Calculating cosmic connections and personality matches</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AIRelationshipCompatibility;

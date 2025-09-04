import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ToolWrapper } from '../components/common/ToolWrapper';

interface PersonalityProfile {
  type: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  careerSuggestions: string[];
  relationshipCompatibility: string[];
  personalityTraits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  developmentAreas: string[];
  lifeAdvice: string[];
}

interface Question {
  id: number;
  question: string;
  options: string[];
}

const AIPersonalityAnalyzer = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState('');
  const [userOccupation, setUserOccupation] = useState('');

  const questions: Question[] = [
    {
      id: 1,
      question: "You're really drawn to the counter-culture scene.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 2,
      question: "You have a vivid imagination.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 3,
      question: "You have frequent mood swings.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 4,
      question: "You don't talk a lot.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 5,
      question: "You are interested in people.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 6,
      question: "You leave your belongings around.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 7,
      question: "You are relaxed most of the time.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 8,
      question: "You take time out for others.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 9,
      question: "You are always busy.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 10,
      question: "You have excellent ideas.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 11,
      question: "You have little to say.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 12,
      question: "You have a soft heart.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 13,
      question: "You often forget to put things back in their proper place.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 14,
      question: "You get upset easily.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 15,
      question: "You do not have a good imagination.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 16,
      question: "You talk to a lot of different people at parties.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 17,
      question: "You are not really interested in others.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 18,
      question: "You like order.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 19,
      question: "You change your mood a lot.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    },
    {
      id: 20,
      question: "You are quick to understand things.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    }
  ];

  const handleAnswer = (answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: answerIndex }));
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      analyzePersonality();
    }
  };

  const analyzePersonality = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Calculate personality scores based on answers
      const scores = calculatePersonalityScores(answers);
      const personalityType = determinePersonalityType(scores);
      
      const profile: PersonalityProfile = {
        type: personalityType.type,
        description: personalityType.description,
        strengths: personalityType.strengths,
        weaknesses: personalityType.weaknesses,
        careerSuggestions: personalityType.careerSuggestions,
        relationshipCompatibility: personalityType.relationshipCompatibility,
        personalityTraits: scores,
        developmentAreas: personalityType.developmentAreas,
        lifeAdvice: personalityType.lifeAdvice
      };

      setPersonalityProfile(profile);
      setShowResults(true);
      alert('🎯 Personality analysis complete! Check your detailed profile below.');
    } catch (error) {
      console.error('Error analyzing personality:', error);
      alert('❌ Failed to analyze personality. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculatePersonalityScores = (answers: Record<number, number>) => {
    // Big Five personality traits calculation
    const openness = (answers[1] + answers[9] + (4 - answers[14]) + answers[19]) / 4;
    const conscientiousness = (answers[8] + (4 - answers[5]) + (4 - answers[12]) + answers[17]) / 4;
    const extraversion = ((4 - answers[3]) + (4 - answers[10]) + answers[15]) / 3;
    const agreeableness = (answers[4] + (4 - answers[16]) + answers[7] + answers[11]) / 4;
    const neuroticism = (answers[2] + answers[6] + answers[13] + answers[18]) / 4;

    return {
      openness: Math.round(openness * 25),
      conscientiousness: Math.round(conscientiousness * 25),
      extraversion: Math.round(extraversion * 25),
      agreeableness: Math.round(agreeableness * 25),
      neuroticism: Math.round(neuroticism * 25)
    };
  };

  const determinePersonalityType = (scores: any) => {
    const { openness, conscientiousness, extraversion, agreeableness } = scores;
    
    // Generate personality type based on traits
    if (extraversion > 70 && agreeableness > 70) {
      return {
        type: "The Enthusiastic Leader",
        description: "You are a natural leader who thrives on social interaction and helping others. You're optimistic, energetic, and have a talent for motivating people around you.",
        strengths: ["Natural leadership", "Excellent communication", "Team motivation", "Positive attitude", "Networking abilities"],
        weaknesses: ["May overcommit", "Sometimes impatient", "Difficulty with routine tasks", "Can be too trusting"],
        careerSuggestions: ["Sales Manager", "Marketing Director", "HR Manager", "Event Coordinator", "Public Relations", "Team Leader"],
        relationshipCompatibility: ["The Analyst", "The Supporter", "The Creator"],
        developmentAreas: ["Time management", "Detail orientation", "Setting boundaries", "Conflict resolution"],
        lifeAdvice: ["Focus on one goal at a time", "Develop patience", "Listen more than you speak", "Create structured routines"]
      };
    } else if (conscientiousness > 70 && openness > 70) {
      return {
        type: "The Innovative Organizer",
        description: "You combine creativity with structure, making you excellent at bringing innovative ideas to life. You're reliable, creative, and have a strong work ethic.",
        strengths: ["Creative problem-solving", "Strong work ethic", "Reliable execution", "Strategic thinking", "Quality focus"],
        weaknesses: ["Perfectionism", "Overthinking", "Difficulty delegating", "Stress from high standards"],
        careerSuggestions: ["Product Manager", "Creative Director", "Architect", "UX Designer", "Project Manager", "Entrepreneur"],
        relationshipCompatibility: ["The Enthusiastic Leader", "The Loyal Supporter", "The Analytical Thinker"],
        developmentAreas: ["Stress management", "Flexibility", "Delegation skills", "Work-life balance"],
        lifeAdvice: ["Accept 'good enough' sometimes", "Take breaks regularly", "Share responsibilities", "Practice mindfulness"]
      };
    } else if (agreeableness > 70 && conscientiousness > 70) {
      return {
        type: "The Loyal Supporter",
        description: "You are dependable, caring, and always ready to help others. You value harmony and work well in team environments where you can support others' success.",
        strengths: ["Teamwork", "Reliability", "Empathy", "Conflict resolution", "Attention to detail"],
        weaknesses: ["Difficulty saying no", "Avoiding conflict", "Putting others first", "Undervaluing own needs"],
        careerSuggestions: ["Teacher", "Counselor", "Nurse", "Social Worker", "Customer Service", "Human Resources"],
        relationshipCompatibility: ["The Enthusiastic Leader", "The Innovative Organizer", "The Analytical Thinker"],
        developmentAreas: ["Assertiveness", "Self-advocacy", "Boundary setting", "Leadership skills"],
        lifeAdvice: ["Learn to say no", "Prioritize self-care", "Speak up for your ideas", "Take credit for your work"]
      };
    } else if (openness > 70 && extraversion < 50) {
      return {
        type: "The Creative Thinker",
        description: "You are imaginative, intellectual, and prefer depth over breadth. You're drawn to creative pursuits and enjoy exploring new ideas and concepts.",
        strengths: ["Creative thinking", "Deep analysis", "Independent work", "Intellectual curiosity", "Original ideas"],
        weaknesses: ["Social anxiety", "Procrastination", "Difficulty with routine", "Overthinking"],
        careerSuggestions: ["Writer", "Artist", "Researcher", "Software Developer", "Psychologist", "Designer"],
        relationshipCompatibility: ["The Analytical Thinker", "The Loyal Supporter", "The Innovative Organizer"],
        developmentAreas: ["Social skills", "Time management", "Networking", "Practical application"],
        lifeAdvice: ["Push yourself to network", "Set deadlines", "Share your ideas", "Balance creativity with practicality"]
      };
    } else {
      return {
        type: "The Balanced Achiever",
        description: "You have a well-rounded personality with balanced traits. You're adaptable, practical, and can work well in various situations and with different people.",
        strengths: ["Adaptability", "Balanced perspective", "Practical approach", "Steady performance", "Versatility"],
        weaknesses: ["May lack specialization", "Difficulty standing out", "Indecisiveness", "Average performance"],
        careerSuggestions: ["Business Analyst", "Operations Manager", "Consultant", "General Manager", "Coordinator"],
        relationshipCompatibility: ["Most personality types", "Flexible with different styles"],
        developmentAreas: ["Specialization", "Unique value proposition", "Decision-making", "Leadership"],
        lifeAdvice: ["Identify your unique strengths", "Develop expertise in one area", "Make decisions faster", "Take on leadership roles"]
      };
    }
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setPersonalityProfile(null);
    setShowResults(false);
    setUserName('');
    setUserAge('');
    setUserOccupation('');
  };

  const downloadReport = () => {
    if (!personalityProfile) return;

    const report = `
AI PERSONALITY ANALYSIS REPORT
${userName ? `Name: ${userName}` : ''}
${userAge ? `Age: ${userAge}` : ''}
${userOccupation ? `Occupation: ${userOccupation}` : ''}
Generated on: ${new Date().toLocaleDateString()}

PERSONALITY TYPE: ${personalityProfile.type}

DESCRIPTION:
${personalityProfile.description}

PERSONALITY TRAITS:
• Openness: ${personalityProfile.personalityTraits.openness}%
• Conscientiousness: ${personalityProfile.personalityTraits.conscientiousness}%
• Extraversion: ${personalityProfile.personalityTraits.extraversion}%
• Agreeableness: ${personalityProfile.personalityTraits.agreeableness}%
• Neuroticism: ${personalityProfile.personalityTraits.neuroticism}%

STRENGTHS:
${personalityProfile.strengths.map(s => `• ${s}`).join('\n')}

AREAS FOR DEVELOPMENT:
${personalityProfile.developmentAreas.map(a => `• ${a}`).join('\n')}

CAREER SUGGESTIONS:
${personalityProfile.careerSuggestions.map(c => `• ${c}`).join('\n')}

RELATIONSHIP COMPATIBILITY:
${personalityProfile.relationshipCompatibility.map(r => `• ${r}`).join('\n')}

LIFE ADVICE:
${personalityProfile.lifeAdvice.map(a => `• ${a}`).join('\n')}

---
Report generated by AI Personality Analyzer
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personality-analysis-${userName || 'report'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    alert('📊 Personality report downloaded successfully!');
  };

  return (
    <ToolWrapper
      toolId="ai-personality-analyzer"
      toolName="AI Personality Analyzer"
      toolDescription="Discover your personality type with AI-powered analysis. Get insights into your strengths, career suggestions, and relationship compatibility."
      toolCategory="AI"
    >
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">🧠 AI Personality Analyzer</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Discover your unique personality type and get personalized insights
          </p>
        </div>

        {!showResults ? (
          <div className="space-y-6">
            {/* User Information */}
            {currentQuestion === 0 && (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">👤 Personal Information (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Name</label>
                      <Input
                        placeholder="Your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Age</label>
                      <Input
                        placeholder="Your age"
                        value={userAge}
                        onChange={(e) => setUserAge(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Occupation</label>
                      <Input
                        placeholder="Your occupation"
                        value={userOccupation}
                        onChange={(e) => setUserOccupation(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Bar */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Progress</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{currentQuestion + 1}/{questions.length}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Question */}
            <Card className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                    {questions[currentQuestion].question}
                  </h3>
                  <div className="space-y-3">
                    {questions[currentQuestion].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        className="w-full p-4 text-left bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 rounded-lg transition-colors text-gray-900 dark:text-white"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Results */
          <div className="space-y-6">
            {/* Personality Type */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">{personalityProfile?.type}</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {personalityProfile?.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Personality Traits */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">📊 Personality Traits</h3>
                <div className="space-y-4">
                  {Object.entries(personalityProfile?.personalityTraits || {}).map(([trait, value]) => (
                    <div key={trait} className="flex items-center space-x-4">
                      <div className="w-32 text-sm font-medium capitalize">{trait}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm font-medium">{value}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths and Development Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-green-800">💪 Strengths</h3>
                  <ul className="space-y-2">
                    {personalityProfile?.strengths.map((strength, index) => (
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
                  <h3 className="text-xl font-semibold mb-4 text-orange-800">🎯 Development Areas</h3>
                  <ul className="space-y-2">
                    {personalityProfile?.developmentAreas.map((area, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span className="text-sm">{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Career Suggestions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-blue-800">🚀 Career Suggestions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {personalityProfile?.careerSuggestions.map((career, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-blue-200">
                      <span className="text-sm font-medium">{career}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Life Advice */}
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-purple-800">✨ Life Advice</h3>
                <ul className="space-y-2">
                  {personalityProfile?.lifeAdvice.map((advice, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span className="text-sm">{advice}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={downloadReport}
                className="bg-green-600 hover:bg-green-700"
              >
                📊 Download Report
              </Button>
              <Button
                onClick={resetTest}
                variant="outline"
              >
                🔄 Take Test Again
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">🤖 Analyzing Your Personality...</h3>
              <p className="text-gray-600">This may take a few moments</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AIPersonalityAnalyzer;

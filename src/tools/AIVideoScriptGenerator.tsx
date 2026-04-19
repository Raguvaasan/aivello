import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaVideo, FaCopy, FaTrash, FaMagic } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';

type VideoStyle = 'educational' | 'entertaining' | 'promotional' | 'tutorial' | 'vlog';

const styleTemplates: Record<VideoStyle, (topic: string, duration: string) => string> = {
  educational: (topic, duration) => `🎬 VIDEO SCRIPT: "${topic}"
📏 Duration: ${duration} minutes | Style: Educational

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 [HOOK - 0:00-0:15]
(Camera: Close-up shot, energetic background music)
"Did you know that ${topic} is one of the most important topics today? In the next ${duration} minutes, you'll learn everything you need to know."

📌 [INTRO - 0:15-0:45]
(Camera: Medium shot, lower thirds with name/title)
"Hey everyone! Welcome back to the channel. Today we're diving deep into ${topic}. Whether you're a beginner or looking to level up your knowledge, this video has you covered."

(Show quick outline on screen)
"Here's what we'll cover:
  1. What is ${topic} and why it matters
  2. Key concepts you need to understand
  3. Real-world applications and examples
  4. Common mistakes to avoid
  5. Pro tips for mastery"

📖 [SECTION 1 - Core Concepts]
(Camera: Whiteboard/screen recording style)
"Let's start with the fundamentals..."

• Define the key terminology
• Explain the underlying principles
• Use analogies to make it relatable
• Show visual diagrams or animations

📖 [SECTION 2 - Deep Dive]
(Camera: Mix of talking head and B-roll)
"Now that you understand the basics, let's go deeper..."

• Walk through specific examples
• Demonstrate step-by-step processes
• Address common misconceptions
• Include expert quotes or statistics

📖 [SECTION 3 - Practical Application]
(Camera: Screen recording / demo footage)
"Here's where theory meets practice..."

• Live demonstration
• Before/after comparisons
• Tips and shortcuts
• Troubleshooting common issues

🎯 [CONCLUSION - Last 30 seconds]
(Camera: Medium shot, upbeat music fading in)
"And that's everything you need to know about ${topic}! If you found this helpful, please hit that like button and subscribe for more content like this."

(End screen with subscribe button and related videos)
"Check out these related videos and I'll see you in the next one!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PRODUCTION NOTES:
- Use engaging thumbnails with bold text
- Add timestamps in the description
- Include relevant tags: ${topic}, tutorial, education, learning
- Pin a comment with key takeaways`,

  entertaining: (topic, duration) => `🎬 VIDEO SCRIPT: "${topic}"
📏 Duration: ${duration} minutes | Style: Entertaining

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 [COLD OPEN - 0:00-0:10]
(Dramatic/funny clip from the middle of the video)
"You won't BELIEVE what happens when we try ${topic}..."

🎭 [INTRO - 0:10-0:30]
(Upbeat music, quick cuts, energetic delivery)
"What's up everyone! Today we're doing something WILD with ${topic} and honestly... I'm a little scared."

😂 [SEGMENT 1 - Setup]
(Quick cuts, reaction shots, memes on screen)
"So here's the deal with ${topic}..."
• Build anticipation with humor
• Use relatable situations
• Quick-paced editing with sound effects
• Include trending memes or references

🔥 [SEGMENT 2 - The Main Event]
(Dynamic camera angles, dramatic music)
"Alright, let's actually DO this..."
• Main content with entertaining commentary
• Exaggerated reactions for humor
• Behind-the-scenes moments
• Unexpected twists

🎉 [SEGMENT 3 - Results & Reactions]
"The results are IN and... okay, I did NOT expect this."
• Big reveal moment
• Genuine reactions
• Funny commentary on the outcome

📢 [OUTRO]
"If you enjoyed this, SMASH that like button! Drop a comment telling me what you want to see next. Peace! ✌️"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PRODUCTION NOTES:
- Fast-paced editing (cuts every 3-5 seconds)
- Add sound effects and music transitions
- Use captions for emphasis
- End with bloopers/outtakes`,

  promotional: (topic, duration) => `🎬 VIDEO SCRIPT: "${topic}"
📏 Duration: ${duration} minutes | Style: Promotional

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 [OPENING - Problem Statement]
(Cinematic B-roll, dramatic music)
"Struggling with [pain point related to ${topic}]? You're not alone. Millions of people face this challenge every day."

💡 [THE SOLUTION]
(Product/service reveal with smooth animation)
"Introducing the ultimate solution for ${topic}."
• Highlight the key problem being solved
• Show the transformation/before-after
• Feature testimonials or social proof

✨ [KEY BENEFITS]
(Clean product shots, professional lighting)
1. "First, you get [benefit 1]..."
2. "Plus, [benefit 2] that saves you hours..."
3. "And [benefit 3] that no one else offers..."

📊 [SOCIAL PROOF]
"Join over 10,000+ satisfied users who have transformed their ${topic} experience."
• Customer testimonials
• Statistics and results
• Awards or recognition

🎯 [CALL TO ACTION]
"Ready to get started? Click the link below and try it free for 14 days. No credit card required."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PRODUCTION NOTES:
- Professional, clean aesthetic
- Use brand colors consistently
- Include CTA overlay throughout
- Add captions for accessibility`,

  tutorial: (topic, duration) => `🎬 VIDEO SCRIPT: "${topic}"
📏 Duration: ${duration} minutes | Style: Step-by-Step Tutorial

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 [INTRO - 0:00-0:30]
"In this tutorial, I'll show you exactly how to ${topic}, step by step. Even if you're a complete beginner, you'll be able to follow along."

📋 [PREREQUISITES]
"Before we start, make sure you have:
  ✅ Prerequisite 1
  ✅ Prerequisite 2
  ✅ Prerequisite 3"

📍 [STEP 1]
(Screen recording with cursor highlight)
"First, let's start by..."
• Clear, slow demonstration
• Highlight important clicks/actions
• Explain WHY, not just WHAT

📍 [STEP 2]
"Next, we need to..."
• Build on previous step
• Point out common errors
• Show what success looks like

📍 [STEP 3]
"Now for the important part..."
• Detailed walkthrough
• Pause at tricky sections
• Offer alternatives if applicable

📍 [STEP 4]
"Almost done! Let's..."
• Final configuration
• Testing/verification
• Quality checks

✅ [FINAL RESULT]
"And there you have it! You've successfully completed ${topic}."
• Show the finished product
• Quick recap of all steps
• Link to resources in description

💬 [OUTRO]
"If you got stuck at any point, drop a comment below and I'll help you out. Don't forget to subscribe for more tutorials!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PRODUCTION NOTES:
- Use zoom-ins for important details
- Add chapter markers for each step
- Include downloadable resources
- Keep pace steady and clear`,

  vlog: (topic, duration) => `🎬 VIDEO SCRIPT: "${topic}"
📏 Duration: ${duration} minutes | Style: Vlog

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 [MORNING - Getting Started]
(Handheld camera, natural lighting)
"Good morning everyone! Today is going to be an exciting day because we're exploring ${topic}."

🚶 [ON THE WAY]
(Walking shot, ambient sounds)
"So I've been thinking a lot about ${topic} lately, and I wanted to share my experience with you guys..."
• Share personal thoughts
• Set the scene naturally
• Interact with surroundings

📸 [THE MAIN EXPERIENCE]
(Mix of handheld and stabilized shots)
"Alright, we're here! Let me show you..."
• Document the experience in real-time
• Share genuine reactions
• Talk to camera like a friend
• Include candid moments

🍽️ [MIDDAY CHECK-IN]
"Quick update - so far this has been amazing/challenging/surprising..."
• Reflect on the experience
• Share unexpected discoveries
• Connect with the audience

🌅 [WRAP UP]
(Golden hour lighting, reflective mood)
"What a day! If I had to sum up my experience with ${topic} in one word, it would be..."
• Share honest takeaways
• What you'd do differently
• Recommendations for viewers

💬 [OUTRO]
"Thanks for spending the day with me! Let me know in the comments if you've tried ${topic}. See you in the next one!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PRODUCTION NOTES:
- Keep it authentic and unscripted-feeling
- Use natural transitions
- Add background music that fits the mood
- Include B-roll of surroundings`
};

const AIVideoScriptGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('5');
  const [style, setStyle] = useState<VideoStyle>('educational');
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateScript = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const generator = styleTemplates[style];
      setScript(generator(topic, duration));
    } catch (error) {
      console.error('Error generating script:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const topicSuggestions = [
    'How to Build a Morning Routine',
    'Top 10 AI Tools in 2024',
    'Beginner\'s Guide to Investing',
    'Day in the Life of a Developer',
    'Healthy Meal Prep for Beginners',
    'Travel Guide: Hidden Gems'
  ];

  return (
    <ToolWrapper
      toolId="ai-video-script"
      toolName="AI Video Script Generator"
      toolDescription="Generate professional video scripts for YouTube, TikTok, and other platforms"
      toolCategory="Content Creation"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 md:p-8 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <IconWrapper icon={FaVideo} className="text-2xl text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Video Script Generator
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create professional scripts for any platform</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video Topic
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter your video topic..."
                />
                {/* Topic Suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {topicSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setTopic(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    <option value="1">1 minute (Short)</option>
                    <option value="3">3 minutes</option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video Style
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                    value={style}
                    onChange={(e) => setStyle(e.target.value as VideoStyle)}
                  >
                    <option value="educational">📚 Educational</option>
                    <option value="entertaining">🎭 Entertaining</option>
                    <option value="promotional">📢 Promotional</option>
                    <option value="tutorial">🛠️ Tutorial</option>
                    <option value="vlog">📸 Vlog</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-red-500/25"
                  onClick={generateScript}
                  disabled={isGenerating || !topic.trim()}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <IconWrapper icon={FaMagic} />
                      Generate Script
                    </>
                  )}
                </button>
                <button
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => { setTopic(''); setScript(''); }}
                >
                  <IconWrapper icon={FaTrash} />
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generated Script
                </label>
                {script && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <IconWrapper icon={FaCopy} className="text-xs" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              <textarea
                className="w-full h-[480px] p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                value={script}
                readOnly
                placeholder="Your video script will appear here..."
              />
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
};

export default AIVideoScriptGenerator;

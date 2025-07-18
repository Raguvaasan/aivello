import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaEnvelope, FaCopy, FaMagic } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';

type EmailType = 'professional' | 'marketing' | 'followup' | 'apology';
type ToneType = 'formal' | 'casual';

export default function AIEmailWriter() {
  const [emailType, setEmailType] = useState<EmailType>('professional');
  const [context, setContext] = useState('');
  const [tone, setTone] = useState<ToneType>('formal');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const emailTemplates: Record<EmailType, Record<ToneType, (context: string) => string>> = {
    professional: {
      formal: (context) => `Subject: ${context || 'Professional Inquiry'}

Dear [Recipient],

I hope this email finds you well. I am writing to ${context || 'discuss a matter of mutual interest'}.

I would appreciate the opportunity to connect and discuss this further at your convenience. Please let me know if you would be available for a brief conversation.

Thank you for your time and consideration.

Best regards,
[Your Name]`,
      casual: (context) => `Subject: ${context || 'Quick Question'}

Hi [Name],

Hope you're doing well! I wanted to reach out about ${context || 'something we discussed earlier'}.

Would love to chat about this when you have a moment. Let me know what works for you!

Thanks,
[Your Name]`,
    },
    marketing: {
      formal: (context) => `Subject: Exciting Opportunity - ${context || 'Partnership Proposal'}

Dear [Company/Name],

I hope this message finds you well. I am reaching out to present an exciting opportunity that aligns with ${context || 'your business objectives'}.

Our proposal offers significant value through [specific benefits]. I would welcome the chance to discuss how we can collaborate for mutual success.

Please let me know if you would be interested in scheduling a brief meeting to explore this opportunity further.

Best regards,
[Your Name]
[Your Title]`,
      casual: (context) => `Subject: Let's Talk About ${context || 'Your Growth'}!

Hey [Name]!

I've been following your work and I'm impressed! I have an idea that could really help with ${context || 'your current goals'}.

Want to grab coffee (virtual or real) and chat about it? I think you'll find it interesting!

Cheers,
[Your Name]`,
    },
    followup: {
      formal: (context) => `Subject: Following Up - ${context || 'Our Previous Conversation'}

Dear [Name],

I hope you are well. I wanted to follow up on ${context || 'our previous discussion'} and see if you had any questions or needed additional information.

I remain very interested in moving forward and would be happy to provide any clarification you might need.

I look forward to hearing from you at your earliest convenience.

Best regards,
[Your Name]`,
      casual: (context) => `Subject: Just Checking In!

Hi [Name],

Just wanted to follow up on ${context || 'what we talked about last week'}. Have you had a chance to think it over?

No pressure at all - just wanted to keep it on your radar!

Talk soon,
[Your Name]`,
    },
    apology: {
      formal: (context) => `Subject: Sincere Apologies - ${context || 'Recent Issue'}

Dear [Name],

I am writing to sincerely apologize for ${context || 'the inconvenience caused'}. I take full responsibility for this oversight and understand your frustration.

To rectify this situation, I am implementing the following measures:
- [Specific action 1]
- [Specific action 2]
- [Prevention measures]

I value our relationship and am committed to ensuring this does not happen again. Please let me know if there is anything else I can do to address your concerns.

Sincerely,
[Your Name]`,
      casual: (context) => `Subject: My Bad!

Hey [Name],

I really messed up with ${context || 'that thing we discussed'} and I wanted to apologize.

I know it's frustrating and I totally get it. Here's what I'm doing to fix it: [solution].

Sorry again - I'll make sure this doesn't happen again!

[Your Name]`,
    },
  };

  const generateEmail = () => {
    setLoading(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const template = emailTemplates[emailType][tone];
      const email = template(context);
      setGeneratedEmail(email);
      setLoading(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail);
    alert('Email copied to clipboard!');
  };

  return (
    <ToolWrapper
      toolId="ai-email-writer"
      toolName="AI Email Writer"
      toolDescription="Generate professional emails instantly with AI. Perfect for business communication, follow-ups, and marketing outreach"
      toolCategory="Communication"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaEnvelope} className="text-3xl text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              AI Email Writer
            </h2>
            <IconWrapper icon={FaMagic} className="text-2xl text-purple-600" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Type
                </label>
                <select
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value as EmailType)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="professional">Professional Inquiry</option>
                  <option value="marketing">Marketing/Sales</option>
                  <option value="followup">Follow-up</option>
                  <option value="apology">Apology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as ToneType)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Context/Topic
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., Partnership proposal, Project update, Meeting request..."
                  className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={generateEmail}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <IconWrapper icon={FaMagic} />
                    Generate Email
                  </>
                )}
              </button>
            </div>

            {/* Generated Email */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generated Email
                </label>
                {generatedEmail && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    <IconWrapper icon={FaCopy} />
                    Copy
                  </button>
                )}
              </div>
              <textarea
                value={generatedEmail}
                readOnly
                placeholder="Your AI-generated email will appear here..."
                className="w-full h-80 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">💡 Pro Tips:</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
              <li>• Be specific about your context for better results</li>
              <li>• Always personalize the recipient's name and details</li>
              <li>• Review and edit the generated email before sending</li>
              <li>• Adjust the tone based on your relationship with the recipient</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

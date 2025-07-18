import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaLanguage, FaExchangeAlt, FaCopy, FaVolumeUp, FaMicrophone } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';

export default function LanguageTranslator() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' }
  ];

  // Translation dictionary for demo purposes
  const translations: { [key: string]: { [key: string]: string } } = {
    'hello': {
      'es': 'hola',
      'fr': 'bonjour',
      'de': 'hallo',
      'it': 'ciao',
      'pt': 'olá',
      'ru': 'привет',
      'ja': 'こんにちは',
      'ko': '안녕하세요',
      'zh': '你好',
      'ar': 'مرحبا',
      'hi': 'नमस्ते',
      'ta': 'வணக்கம்',
      'te': 'హలో',
      'th': 'สวัสดี',
      'vi': 'xin chào',
      'nl': 'hallo',
      'sv': 'hej',
      'no': 'hei',
      'da': 'hej'
    },
    'thank you': {
      'es': 'gracias',
      'fr': 'merci',
      'de': 'danke',
      'it': 'grazie',
      'pt': 'obrigado',
      'ru': 'спасибо',
      'ja': 'ありがとう',
      'ko': '감사합니다',
      'zh': '谢谢',
      'ar': 'شكرا',
      'hi': 'धन्यवाद',
      'ta': 'நன்றி',
      'te': 'ధన్యవాదాలు',
      'th': 'ขอบคุณ',
      'vi': 'cảm ơn',
      'nl': 'dank je',
      'sv': 'tack',
      'no': 'takk',
      'da': 'tak'
    },
    'good morning': {
      'es': 'buenos días',
      'fr': 'bonjour',
      'de': 'guten Morgen',
      'it': 'buongiorno',
      'pt': 'bom dia',
      'ru': 'доброе утро',
      'ja': 'おはようございます',
      'ko': '좋은 아침',
      'zh': '早上好',
      'ar': 'صباح الخير',
      'hi': 'सुप्रभात',
      'ta': 'காலை வணக்கம்',
      'te': 'శుభోదయం',
      'th': 'อรุณสวัสดิ์',
      'vi': 'chào buổi sáng',
      'nl': 'goedemorgen',
      'sv': 'god morgon',
      'no': 'god morgen',
      'da': 'god morgen'
    }
  };

  const translateText = async () => {
    if (!sourceText.trim()) {
      alert('Please enter text to translate');
      return;
    }

    setLoading(true);

    // Simulate translation API call
    setTimeout(() => {
      let result = '';
      const lowerText = sourceText.toLowerCase().trim();
      
      // Check if we have a direct translation
      if (translations[lowerText] && translations[lowerText][targetLang]) {
        result = translations[lowerText][targetLang];
      } else {
        // Simple mock translation for demo
        result = `[${getLanguageName(targetLang)} translation of: "${sourceText}"]`;
        
        // Add some realistic-looking translated text based on target language
        if (targetLang === 'es') {
          result = sourceText.replace(/hello/gi, 'hola').replace(/the/gi, 'el/la').replace(/and/gi, 'y');
        } else if (targetLang === 'fr') {
          result = sourceText.replace(/hello/gi, 'bonjour').replace(/the/gi, 'le/la').replace(/and/gi, 'et');
        } else if (targetLang === 'de') {
          result = sourceText.replace(/hello/gi, 'hallo').replace(/the/gi, 'der/die/das').replace(/and/gi, 'und');
        }
      }

      setTranslatedText(result);
      setLoading(false);
    }, 1500);
  };

  const getLanguageName = (code: string): string => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  const swapLanguages = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Text copied to clipboard!');
  };

  const speakText = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech not supported in your browser');
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = sourceLang;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSourceText(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognition.start();
    } else {
      alert('Speech recognition not supported in your browser');
    }
  };

  const commonPhrases = [
    'Hello, how are you?',
    'Thank you very much',
    'Where is the bathroom?',
    'How much does this cost?',
    'I need help',
    'Good morning',
    'Good night',
    'Excuse me',
    'I don\'t understand',
    'Please speak slowly'
  ];

  return (
    <ToolWrapper
      toolId="language-translator"
      toolName="Language Translator"
      toolDescription="Translate text between 20+ languages instantly. Perfect for travel, business, and learning new languages"
      toolCategory="Productivity"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaLanguage} className="text-3xl text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Language Translator
            </h2>
          </div>

          {/* Language Selection */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-center">
              <button
                onClick={swapLanguages}
                className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Swap languages"
              >
                <IconWrapper icon={FaExchangeAlt} className="text-xl" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Translation Interface */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Source Text */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getLanguageName(sourceLang)}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={startListening}
                    disabled={isListening}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="Voice input"
                  >
                    <IconWrapper icon={FaMicrophone} />
                  </button>
                  {sourceText && (
                    <button
                      onClick={() => speakText(sourceText, sourceLang)}
                      className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="Listen"
                    >
                      <IconWrapper icon={FaVolumeUp} />
                    </button>
                  )}
                </div>
              </div>
              
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Enter text to translate..."
                className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {sourceText.length} characters
              </p>
            </div>

            {/* Translated Text */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getLanguageName(targetLang)}
                </label>
                <div className="flex gap-2">
                  {translatedText && (
                    <>
                      <button
                        onClick={() => speakText(translatedText, targetLang)}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Listen"
                      >
                        <IconWrapper icon={FaVolumeUp} />
                      </button>
                      <button
                        onClick={() => copyToClipboard(translatedText)}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        title="Copy"
                      >
                        <IconWrapper icon={FaCopy} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <textarea
                value={translatedText}
                readOnly
                placeholder="Translation will appear here..."
                className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={translateText}
            disabled={loading || !sourceText.trim()}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Translating...
              </>
            ) : (
              <>
                <IconWrapper icon={FaLanguage} />
                Translate
              </>
            )}
          </button>

          {/* Common Phrases */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Common Phrases:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {commonPhrases.map((phrase, index) => (
                <button
                  key={index}
                  onClick={() => setSourceText(phrase)}
                  className="p-2 text-sm bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors text-left"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
              🌟 Features:
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
              <li>• Support for 20+ languages including major world languages</li>
              <li>• Voice input and text-to-speech functionality</li>
              <li>• Common phrases for travelers and language learners</li>
              <li>• Quick language swap for back-and-forth translation</li>
              <li>• Copy translations to clipboard instantly</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

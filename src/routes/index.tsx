import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { LandingPage } from '../components/landing/LandingPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { ErrorPage } from '../components/error/ErrorPage';
import { RootLayout } from '../components/layout/RootLayout';

// Only the landing page and the app shell are eager. Everything else is split so a
// first visit to "/" downloads nothing it does not render.
// The app shell (header, sidebar, framer-motion) and dashboard are their own chunks:
// a first visit to the landing page should not pay for them.
const AppLayout = lazy(() => import('../pages/app/AppLayout').then((m) => ({ default: m.AppLayout })));
const AppHome = lazy(() => import('../pages/app/home').then((m) => ({ default: m.AppHome })));
const Login = lazy(() => import('../components/auth/Login').then((m) => ({ default: m.Login })));
const Profile = lazy(() => import('../pages/app/Profile').then((m) => ({ default: m.Profile })));
const History = lazy(() => import('../pages/app/History'));
const Terms = lazy(() => import('../pages/legal/Terms'));
const PrivacyPolicy = lazy(() => import('../pages/legal/PrivacyPolicy'));
const PricingPage = lazy(() => import('../pages/PricingPage'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Lazy load tool components for better performance
const GrammarChecker = lazy(() => import('../tools/GrammarChecker'));
const PdfToWord = lazy(() => import('../tools/PdfToWord'));
const QrCodeGenerator = lazy(() => import('../tools/QrCodeGenerator'));
const TextToSpeech = lazy(() => import('../tools/TextToSpeech'));
const ImageCompressor = lazy(() => import('../tools/ImageCompressor'));
const ReadTimeEstimator = lazy(() => import('../tools/ReadTimeEstimator'));
const WordCounter = lazy(() => import('../tools/WordCounter'));
const BgRemover = lazy(() => import('../tools/BgRemover'));
const ResumeBuilder = lazy(() => import('../tools/ResumeBuilder'));
const YoutubeThumbnail = lazy(() => import('../tools/YoutubeThumbnail'));
const AIEmailWriter = lazy(() => import('../tools/AIEmailWriter'));
const PasswordGenerator = lazy(() => import('../tools/PasswordGenerator'));
const ColorPaletteGenerator = lazy(() => import('../tools/ColorPaletteGenerator'));
const URLShortener = lazy(() => import('../tools/URLShortener'));
const InvoiceGenerator = lazy(() => import('../tools/InvoiceGenerator'));
const AITextSummarizer = lazy(() => import('../tools/AITextSummarizer'));
const AIImageGenerator = lazy(() => import('../tools/AIImageGenerator'));
const LanguageTranslator = lazy(() => import('../tools/LanguageTranslator'));
const QRCodeScanner = lazy(() => import('../tools/QRCodeScanner'));
const UnitConverter = lazy(() => import('../tools/UnitConverter'));
const AICodeAssistant = lazy(() => import('../tools/AICodeAssistant'));
const AIBusinessPlanGenerator = lazy(() => import('../tools/AIBusinessPlanGenerator'));
const AIPersonalityAnalyzer = lazy(() => import('../tools/AIPersonalityAnalyzer'));
const AIDreamInterpreter = lazy(() => import('../tools/AIDreamInterpreter'));
const AIRelationshipCompatibility = lazy(() => import('../tools/AIRelationshipCompatibility'));
const AICreativeStoryGenerator = lazy(() => import('../tools/AICreativeStoryGenerator'));
const AIResumeScanner = lazy(() => import('../tools/AIResumeScanner'));
const AISpeechToText = lazy(() => import('../tools/AISpeechToText'));
const AIVideoScriptGenerator = lazy(() => import('../tools/AIVideoScriptGenerator'));
const AIStudyNotesGenerator = lazy(() => import('../tools/AIStudyNotesGenerator'));
const AIInterviewPrep = lazy(() => import('../tools/AIInterviewPrep'));
const JsonFormatter = lazy(() => import('../tools/JsonFormatter'));
const Base64Converter = lazy(() => import('../tools/Base64Converter'));
const HashGenerator = lazy(() => import('../tools/HashGenerator'));
const UuidGenerator = lazy(() => import('../tools/UuidGenerator'));
const TextDiffChecker = lazy(() => import('../tools/TextDiffChecker'));
const RegexTester = lazy(() => import('../tools/RegexTester'));
const TimestampConverter = lazy(() => import('../tools/TimestampConverter'));
const PdfMergeSplit = lazy(() => import('../tools/PdfMergeSplit'));
const ImageConverter = lazy(() => import('../tools/ImageConverter'));
const ColorContrastChecker = lazy(() => import('../tools/ColorContrastChecker'));
const AgeCalculator = lazy(() => import('../tools/AgeCalculator'));
const LoremIpsumGenerator = lazy(() => import('../tools/LoremIpsumGenerator'));
const CaseConverter = lazy(() => import('../tools/CaseConverter'));

const Lazy: React.FC<{ children: React.ReactNode; fullScreen?: boolean }> = ({ children, fullScreen }) => (
  <Suspense fallback={<LoadingScreen fullScreen={fullScreen} />}>
    {children}
  </Suspense>
);

/**
 * Tool routes, keyed by the path segment under /app. Every entry must have a matching
 * registry entry in src/data/tools.ts (enforced by src/__tests__/toolRegistry.test.ts).
 */
export const toolRoutes: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'ai-code-assistant': AICodeAssistant,
  'ai-business-plan-generator': AIBusinessPlanGenerator,
  'ai-personality-analyzer': AIPersonalityAnalyzer,
  'ai-dream-interpreter': AIDreamInterpreter,
  'ai-relationship-compatibility': AIRelationshipCompatibility,
  'ai-resume-scanner': AIResumeScanner,
  'ai-speech-to-text': AISpeechToText,
  'ai-video-script': AIVideoScriptGenerator,
  'ai-study-notes': AIStudyNotesGenerator,
  'ai-interview-prep': AIInterviewPrep,
  'ai-creative-story-generator': AICreativeStoryGenerator,
  'grammar-checker': GrammarChecker,
  'pdf-to-word': PdfToWord,
  'qr-generator': QrCodeGenerator,
  'text-to-speech': TextToSpeech,
  'image-compressor': ImageCompressor,
  'read-time': ReadTimeEstimator,
  'word-counter': WordCounter,
  'bg-remover': BgRemover,
  'resume-builder': ResumeBuilder,
  'youtube-thumbnail': YoutubeThumbnail,
  'ai-email-writer': AIEmailWriter,
  'password-generator': PasswordGenerator,
  'color-palette-generator': ColorPaletteGenerator,
  'url-shortener': URLShortener,
  'invoice-generator': InvoiceGenerator,
  'ai-text-summarizer': AITextSummarizer,
  'ai-image-generator': AIImageGenerator,
  'language-translator': LanguageTranslator,
  'qr-code-scanner': QRCodeScanner,
  'unit-converter': UnitConverter,
  // NEW-TOOLS: new tool routes are appended below this line.
  'json-formatter': JsonFormatter,
  'base64-converter': Base64Converter,
  'hash-generator': HashGenerator,
  'uuid-generator': UuidGenerator,
  'text-diff-checker': TextDiffChecker,
  'regex-tester': RegexTester,
  'timestamp-converter': TimestampConverter,
  'pdf-merge-split': PdfMergeSplit,
  'image-converter': ImageConverter,
  'color-contrast-checker': ColorContrastChecker,
  'age-calculator': AgeCalculator,
  'lorem-ipsum-generator': LoremIpsumGenerator,
  'case-converter': CaseConverter,
};

const pages: RouteObject[] = [
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/login',
    element: <Lazy><Login /></Lazy>,
  },
  {
    path: '/pricing',
    element: <Lazy><PricingPage /></Lazy>,
  },
  {
    path: '/terms',
    element: <Lazy><Terms /></Lazy>,
  },
  {
    path: '/privacy',
    element: <Lazy><PrivacyPolicy /></Lazy>,
  },
  {
    // Tools are public: the product promise is "free, no signup needed". Only pages
    // that show a user's own data are gated. Paid server-side work (api/remove-bg)
    // enforces sign-in itself by verifying a Firebase ID token.
    path: '/app',
    element: <Lazy fullScreen><AppLayout /></Lazy>,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Lazy><AppHome /></Lazy>,
      },
      {
        path: 'history',
        element: <ProtectedRoute><Lazy><History /></Lazy></ProtectedRoute>,
      },
      {
        path: 'profile',
        element: <ProtectedRoute><Lazy><Profile /></Lazy></ProtectedRoute>,
      },
      ...Object.entries(toolRoutes).map(([path, Tool]) => ({
        path,
        element: <Lazy><Tool /></Lazy>,
      })),
    ],
  },
  {
    path: '*',
    element: <Lazy><NotFound /></Lazy>,
  },
];

const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: pages,
  },
];

export const router = createBrowserRouter(routes);

import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { LandingPage } from '../components/landing/LandingPage';
import { AppLayout } from '../pages/app/AppLayout';
import { Login } from '../components/auth/Login';
import { Profile } from '../pages/app/Profile';
import History from '../pages/app/History';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { ErrorBoundary } from '../components/error/ErrorBoundary';
import Terms from '../pages/legal/Terms';
import PrivacyPolicy from '../pages/legal/PrivacyPolicy';

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

// Wrapper component for lazy-loaded tools
const LazyToolWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingScreen />}>
    {children}
  </Suspense>
);

const routes: RouteObject[] = [
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/terms',
    element: <Terms />
  },
  {
    path: '/privacy',
    element: <PrivacyPolicy />
  },
  {
    path: '/app',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    errorElement: <ErrorBoundary><div>Something went wrong.</div></ErrorBoundary>,
    children: [
      {
        path: '',
        element: <div className="p-6 text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Aivello</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Choose a tool from the sidebar to get started</p>
        </div>
      },
      {
        path: 'history',
        element: <History />
      },
      {
        path: 'ai-code-assistant',
        element: <LazyToolWrapper><AICodeAssistant /></LazyToolWrapper>
      },
      {
        path: 'ai-business-plan-generator',
        element: <LazyToolWrapper><AIBusinessPlanGenerator /></LazyToolWrapper>
      },
      {
        path: 'ai-personality-analyzer',
        element: <LazyToolWrapper><AIPersonalityAnalyzer /></LazyToolWrapper>
      },
      {
        path: 'ai-dream-interpreter',
        element: <LazyToolWrapper><AIDreamInterpreter /></LazyToolWrapper>
      },
      {
        path: 'ai-relationship-compatibility',
        element: <LazyToolWrapper><AIRelationshipCompatibility /></LazyToolWrapper>
      },
      {
        path: 'ai-creative-story-generator',
        element: <LazyToolWrapper><AICreativeStoryGenerator /></LazyToolWrapper>
      },
      {
        path: 'grammar-checker',
        element: <LazyToolWrapper><GrammarChecker /></LazyToolWrapper>
      },
      {
        path: 'pdf-to-word',
        element: <LazyToolWrapper><PdfToWord /></LazyToolWrapper>
      },
      {
        path: 'qr-generator',
        element: <LazyToolWrapper><QrCodeGenerator /></LazyToolWrapper>
      },
      {
        path: 'text-to-speech',
        element: <LazyToolWrapper><TextToSpeech /></LazyToolWrapper>
      },
      {
        path: 'image-compressor',
        element: <LazyToolWrapper><ImageCompressor /></LazyToolWrapper>
      },
      {
        path: 'read-time',
        element: <LazyToolWrapper><ReadTimeEstimator /></LazyToolWrapper>
      },
      {
        path: 'word-counter',
        element: <LazyToolWrapper><WordCounter /></LazyToolWrapper>
      },
      {
        path: 'bg-remover',
        element: <LazyToolWrapper><BgRemover /></LazyToolWrapper>
      },
      {
        path: 'resume-builder',
        element: <LazyToolWrapper><ResumeBuilder /></LazyToolWrapper>
      },
      {
        path: 'youtube-thumbnail',
        element: <LazyToolWrapper><YoutubeThumbnail /></LazyToolWrapper>
      },
      {
        path: 'ai-email-writer',
        element: <LazyToolWrapper><AIEmailWriter /></LazyToolWrapper>
      },
      {
        path: 'password-generator',
        element: <LazyToolWrapper><PasswordGenerator /></LazyToolWrapper>
      },
      {
        path: 'color-palette-generator',
        element: <LazyToolWrapper><ColorPaletteGenerator /></LazyToolWrapper>
      },
      {
        path: 'url-shortener',
        element: <LazyToolWrapper><URLShortener /></LazyToolWrapper>
      },
      {
        path: 'invoice-generator',
        element: <LazyToolWrapper><InvoiceGenerator /></LazyToolWrapper>
      },
      {
        path: 'ai-text-summarizer',
        element: <LazyToolWrapper><AITextSummarizer /></LazyToolWrapper>
      },
      {
        path: 'ai-image-generator',
        element: <LazyToolWrapper><AIImageGenerator /></LazyToolWrapper>
      },
      {
        path: 'language-translator',
        element: <LazyToolWrapper><LanguageTranslator /></LazyToolWrapper>
      },
      {
        path: 'qr-code-scanner',
        element: <LazyToolWrapper><QRCodeScanner /></LazyToolWrapper>
      },
      {
        path: 'unit-converter',
        element: <LazyToolWrapper><UnitConverter /></LazyToolWrapper>
      },
      {
        path: 'profile',
        element: <Profile />
      },
      {
        path: 'history',
        element: <History />
      }
    ]
  }
];

export const router = createBrowserRouter(routes);

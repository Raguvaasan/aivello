import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '../components/landing/LandingPage';
import { AppLayout } from '../pages/app/AppLayout';
import { Login } from '../components/auth/Login';
import { Profile } from '../pages/app/Profile';
import History from '../pages/app/History';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import GrammarChecker from '../tools/GrammarChecker';
import PdfToWord from '../tools/PdfToWord';
import QrCodeGenerator from '../tools/QrCodeGenerator';
import TextToSpeech from '../tools/TextToSpeech';
import ImageCompressor from '../tools/ImageCompressor';
import ReadTimeEstimator from '../tools/ReadTimeEstimator';
import WordCounter from '../tools/WordCounter';
import BgRemover from '../tools/BgRemover';
import ResumeBuilder from '../tools/ResumeBuilder';
import YoutubeThumbnail from '../tools/YoutubeThumbnail';
import Terms from '../pages/legal/Terms';
import PrivacyPolicy from '../pages/legal/PrivacyPolicy';

export const router = createBrowserRouter([
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
        path: 'grammar-checker',
        element: <GrammarChecker />
      },
      {
        path: 'pdf-to-word',
        element: <PdfToWord />
      },
      {
        path: 'qr-generator',
        element: <QrCodeGenerator />
      },
      {
        path: 'text-to-speech',
        element: <TextToSpeech />
      },
      {
        path: 'image-compressor',
        element: <ImageCompressor />
      },
      {
        path: 'read-time',
        element: <ReadTimeEstimator />
      },
      {
        path: 'word-counter',
        element: <WordCounter />
      },
      {
        path: 'bg-remover',
        element: <BgRemover />
      },
      {
        path: 'resume-builder',
        element: <ResumeBuilder />
      },
      {
        path: 'youtube-thumbnail',
        element: <YoutubeThumbnail />
      },
      {
        path: 'profile',
        element: <Profile />
      }
    ]
  }
]);

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Features } from './Features';
import { Hero } from './Hero';
import { Navbar } from './Navbar';
import { SEOHelmet } from '../common/SEOHelmet';
import { seoData } from '../../data/seoData';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleNavigate = () => {
    navigate('/app', { replace: true });
  };

  return (
    <>
      <SEOHelmet
        title={seoData.homepage.title}
        description={seoData.homepage.description}
        keywords={seoData.homepage.keywords}
        url="https://aivello.vercel.app/"
        structuredData={seoData.homepage.structuredData}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 dark:from-gray-950 dark:via-blue-950 dark:to-gray-950 transition-colors duration-300">
        <Navbar onEnterApp={handleNavigate} />
        <Hero onEnterApp={handleNavigate} />
        <Features />
        
        <footer className="container mx-auto px-6 py-8 text-center text-gray-400 dark:text-gray-500">
          <p>© 2025 Aivello. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
};
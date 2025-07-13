import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Features } from './Features';
import { Hero } from './Hero';
import { Navbar } from './Navbar';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleNavigate = () => {
    navigate('/app', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Navbar onEnterApp={handleNavigate} />
      <Hero onEnterApp={handleNavigate} />
      <Features />
      
      <footer className="container mx-auto px-6 py-8 text-center text-gray-400">
        <p>© 2025 Aivello. All rights reserved.</p>
      </footer>
    </div>
  );
};
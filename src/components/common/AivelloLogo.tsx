import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export const AivelloLogo: React.FC<LogoProps> = ({ 
  width = 200, 
  height = 60, 
  className = "" 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 200 60" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: '#3B82F6', stopOpacity: 1}} />
          <stop offset="50%" style={{stopColor: '#1D4ED8', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#8B5CF6', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      
      {/* Main Text */}
      <text 
        x="100" 
        y="40" 
        textAnchor="middle" 
        fill="url(#textGradient)" 
        fontFamily="Inter, system-ui, sans-serif" 
        fontSize="32" 
        fontWeight="800" 
        letterSpacing="-1px"
      >
        AiVello
      </text>
      
      {/* Subtitle */}
      <text 
        x="100" 
        y="55" 
        textAnchor="middle" 
        fill="#64748B" 
        fontFamily="Inter, system-ui, sans-serif" 
        fontSize="10" 
        fontWeight="500" 
        letterSpacing="2px"
      >
        AI TOOLS
      </text>
      
      {/* Decorative AI Icon */}
      <circle cx="25" cy="30" r="12" fill="url(#textGradient)" opacity="0.1"/>
      <text 
        x="25" 
        y="35" 
        textAnchor="middle" 
        fill="url(#textGradient)" 
        fontFamily="Inter, system-ui, sans-serif" 
        fontSize="10" 
        fontWeight="700"
      >
        AI
      </text>
    </svg>
  );
};

export const AivelloIcon: React.FC<LogoProps> = ({ 
  width = 32, 
  height = 32, 
  className = "" 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 64 64" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: '#3B82F6', stopOpacity: 1}} />
          <stop offset="50%" style={{stopColor: '#1D4ED8', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#1E3A8A', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      
      {/* Background Circle */}
      <circle cx="32" cy="32" r="28" fill="url(#iconGradient)" />
      
      {/* AI Core */}
      <g transform="translate(32, 32)">
        {/* Central Core */}
        <circle cx="0" cy="0" r="6" fill="white" opacity="0.9"/>
        
        {/* Simplified Neural Network */}
        <g stroke="white" strokeWidth="1.5" opacity="0.7" fill="none">
          <line x1="0" y1="-6" x2="-12" y2="-18"/>
          <line x1="0" y1="-6" x2="0" y2="-20"/>
          <line x1="0" y1="-6" x2="12" y2="-18"/>
          
          <line x1="6" y1="0" x2="18" y2="-12"/>
          <line x1="6" y1="0" x2="20" y2="0"/>
          <line x1="6" y1="0" x2="18" y2="12"/>
          
          <line x1="0" y1="6" x2="-12" y2="18"/>
          <line x1="0" y1="6" x2="0" y2="20"/>
          <line x1="0" y1="6" x2="12" y2="18"/>
          
          <line x1="-6" y1="0" x2="-18" y2="-12"/>
          <line x1="-6" y1="0" x2="-20" y2="0"/>
          <line x1="-6" y1="0" x2="-18" y2="12"/>
        </g>
        
        {/* Neural Nodes */}
        <g fill="white" opacity="0.8">
          <circle cx="-12" cy="-18" r="2"/>
          <circle cx="0" cy="-20" r="2"/>
          <circle cx="12" cy="-18" r="2"/>
          <circle cx="18" cy="-12" r="2"/>
          <circle cx="20" cy="0" r="2"/>
          <circle cx="18" cy="12" r="2"/>
          <circle cx="12" cy="18" r="2"/>
          <circle cx="0" cy="20" r="2"/>
          <circle cx="-12" cy="18" r="2"/>
          <circle cx="-18" cy="12" r="2"/>
          <circle cx="-20" cy="0" r="2"/>
          <circle cx="-18" cy="-12" r="2"/>
        </g>
        
        {/* AI Text */}
        <text 
          x="0" 
          y="2" 
          textAnchor="middle" 
          fill="white" 
          fontFamily="Inter, Arial, sans-serif" 
          fontSize="8" 
          fontWeight="bold" 
          opacity="0.9"
        >
          AI
        </text>
      </g>
    </svg>
  );
};

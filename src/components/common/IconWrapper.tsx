import React from 'react';
import { IconType } from 'react-icons';

interface IconWrapperProps {
  icon: IconType;
  className?: string;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, className }) => {
  const IconComponent = Icon as React.ComponentType<{ className?: string }>;
  return <IconComponent className={className} />;
};

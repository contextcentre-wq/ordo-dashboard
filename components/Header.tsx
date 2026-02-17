import React from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

interface HeaderProps {
  projectName: string;
}

const Header: React.FC<HeaderProps> = ({ projectName }) => {
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
    <header className="flex items-center h-10 mb-6">
      <h1 className="text-gray-900 text-lg md:text-xl font-semibold truncate">{projectName}</h1>
    </header>
  );
};

export default Header;

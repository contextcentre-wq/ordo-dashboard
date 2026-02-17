import React from 'react';

interface HeaderProps {
  projectName: string;
}

const Header: React.FC<HeaderProps> = ({ projectName }) => {
  return (
    <header className="flex items-center h-10 mb-6">
      <h1 className="text-gray-900 text-xl font-semibold">{projectName}</h1>
    </header>
  );
};

export default Header;

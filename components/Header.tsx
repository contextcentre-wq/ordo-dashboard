import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-end mb-6">
      <div className="hidden md:block">
        {/* Decorative Dots Pattern */}
        <svg width="100" height="24" viewBox="0 0 100 24" fill="none">
          <defs>
            <pattern id="dot-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" className="text-gray-300" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100" height="24" fill="url(#dot-pattern)" />
        </svg>
      </div>
    </header>
  );
};

export default Header;
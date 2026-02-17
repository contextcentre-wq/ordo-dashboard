import React from 'react';
import { Globe } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between mb-6">
      {/* Left: ORDO logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          <span className="text-ordo-green">&#x1F701;</span> ORDO
        </span>
      </div>

      {/* Center: Workspace code badge */}
      <div className="bg-ordo-lightGreen text-ordo-green text-sm font-semibold px-4 py-1.5 rounded-lg">
        CL128
      </div>

      {/* Right: Language selector */}
      <div className="flex items-center gap-1.5 text-gray-400 text-sm cursor-default">
        <Globe className="w-4 h-4" />
        <span>RU</span>
      </div>
    </header>
  );
};

export default Header;

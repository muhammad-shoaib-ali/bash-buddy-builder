
import React from 'react';
import { Code } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-devops-800 text-white py-4 px-6 flex items-center justify-between border-b border-devops-700">
      <div className="flex items-center">
        <Code className="h-8 w-8 mr-2 text-devops-400" />
        <h1 className="text-2xl font-bold">Bash Buddy Builder</h1>
      </div>
      <div className="text-sm text-devops-300">
        Generate powerful bash scripts with ease
      </div>
    </header>
  );
};

export default Header;

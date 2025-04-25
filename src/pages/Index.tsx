
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ScriptForm from '@/components/ScriptForm';
import ScriptPreview from '@/components/ScriptPreview';
import ScriptHistory from '@/components/ScriptHistory';
import { Toaster } from '@/components/ui/sonner';

type Script = {
  id: number;
  content: string;
  timestamp: string;
};

const Index = () => {
  const [generatedScript, setGeneratedScript] = useState('');
  const [savedScripts, setSavedScripts] = useState<Script[]>([]);

  // Load saved scripts from localStorage on initial render
  useEffect(() => {
    const storedScripts = localStorage.getItem('savedScripts');
    if (storedScripts) {
      setSavedScripts(JSON.parse(storedScripts));
    }
  }, []);

  // Save scripts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedScripts', JSON.stringify(savedScripts));
  }, [savedScripts]);

  const handleScriptGenerated = (script: string) => {
    setGeneratedScript(script);
  };

  const handleSaveScript = (script: string) => {
    if (!script.trim()) return;
    
    const newScript: Script = {
      id: Date.now(),
      content: script,
      timestamp: new Date().toISOString(),
    };
    
    setSavedScripts((prev) => [newScript, ...prev]);
  };

  const handleLoadScript = (script: string) => {
    setGeneratedScript(script);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster />
      <Header />
      
      <main className="flex-1 container py-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Bash Buddy Builder</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="text-xl font-semibold mb-4">1. Define Your Script</h3>
            <ScriptForm onScriptGenerated={handleScriptGenerated} />
          </div>
          
          <div className="lg:col-span-2">
            <h3 className="text-xl font-semibold mb-4">2. Preview & Save</h3>
            <ScriptPreview 
              script={generatedScript} 
              onSaveScript={handleSaveScript}
            />
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Saved Scripts</h3>
          <ScriptHistory 
            scripts={savedScripts}
            onLoadScript={handleLoadScript}
          />
        </div>
      </main>
      
      <footer className="bg-devops-800 text-white py-4 text-center">
        <p>Bash Buddy Builder © 2025 - Your DevOps Automation Companion</p>
      </footer>
    </div>
  );
};

export default Index;

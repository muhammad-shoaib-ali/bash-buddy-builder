
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FolderOpen } from 'lucide-react';
import { ScriptCategory, BoilerplateScript } from '@/types/scripts';
import { SCRIPT_CATEGORIES } from '@/data/scriptData';

interface ScriptLibraryProps {
  onSelectScript: (script: BoilerplateScript) => void;
}

const ScriptLibrary: React.FC<ScriptLibraryProps> = ({ onSelectScript }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['System & Network Administration']);
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  const filteredCategories = searchQuery.trim() === '' 
    ? SCRIPT_CATEGORIES 
    : SCRIPT_CATEGORIES.map(category => ({
        ...category,
        scripts: category.scripts.filter(script => 
          script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          script.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.scripts.length > 0);

  const handleDragStart = (e: React.DragEvent, script: BoilerplateScript) => {
    e.dataTransfer.setData('application/json', JSON.stringify(script));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Card className="p-4 h-full">
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search scripts..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full flex justify-between items-center py-2"
                onClick={() => toggleCategory(category.id)}
              >
                <span className="font-medium text-left">{category.name}</span>
                <FolderOpen size={16} className={expandedCategories.includes(category.id) ? "rotate-0" : "rotate-90"} />
              </Button>
              
              {expandedCategories.includes(category.id) && (
                <div className="pl-2 space-y-1">
                  {category.scripts.map((script) => (
                    <div 
                      key={script.id}
                      className="p-2 cursor-move hover:bg-accent rounded-md text-sm flex items-center"
                      draggable
                      onDragStart={(e) => handleDragStart(e, script)}
                      onClick={() => onSelectScript(script)}
                    >
                      <div>
                        <div className="font-medium">{script.name}</div>
                        <div className="text-xs text-muted-foreground">{script.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ScriptLibrary;


import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { History } from 'lucide-react';

type Script = {
  id: number;
  content: string;
  timestamp: string;
};

type ScriptHistoryProps = {
  scripts: Script[];
  onLoadScript: (script: string) => void;
};

const ScriptHistory = ({ scripts, onLoadScript }: ScriptHistoryProps) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getScriptPreview = (content: string) => {
    // Get the first non-empty, non-comment line from the script
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        return trimmedLine.length > 30 
          ? trimmedLine.substring(0, 30) + '...' 
          : trimmedLine;
      }
    }
    return 'Empty script';
  };

  const handleLoadScript = (script: Script) => {
    onLoadScript(script.content);
    toast({
      title: "Script Loaded",
      description: "The selected script has been loaded into the editor",
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <History className="h-5 w-5 text-devops-600 mr-2" />
        <h3 className="text-lg font-medium">Script History</h3>
      </div>

      {scripts.length > 0 ? (
        <div className="space-y-3">
          {scripts.map((script) => (
            <div 
              key={script.id}
              className="flex justify-between items-center p-3 bg-muted/50 rounded-md hover:bg-muted/80 transition-colors"
            >
              <div className="overflow-hidden">
                <div className="font-mono text-sm truncate w-48 sm:w-auto">
                  {getScriptPreview(script.content)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(script.timestamp)}
                </div>
              </div>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => handleLoadScript(script)}
              >
                Load
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No saved scripts yet</p>
          <p className="text-sm mt-2">Generate and save scripts to see them here</p>
        </div>
      )}
    </Card>
  );
};

export default ScriptHistory;

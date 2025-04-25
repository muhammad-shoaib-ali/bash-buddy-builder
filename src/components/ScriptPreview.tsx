
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Copy } from 'lucide-react';

type ScriptPreviewProps = {
  script: string;
  onSaveScript: (script: string) => void;
};

const ScriptPreview = ({ script, onSaveScript }: ScriptPreviewProps) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Reset copy success state after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopySuccess(true);
      toast({
        title: "Script Copied",
        description: "Script copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const saveScript = () => {
    onSaveScript(script);
    toast({
      title: "Script Saved",
      description: "Script saved to history",
    });
  };

  const downloadScript = () => {
    const element = document.createElement("a");
    const file = new Blob([script], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "script.sh";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({
      title: "Script Downloaded",
      description: "Script has been downloaded",
    });
  };

  const formatScriptForDisplay = (scriptText: string) => {
    return scriptText
      .split("\n")
      .map((line, index) => {
        // Add syntax highlighting classes based on content
        let lineClass = "";
        if (line.startsWith("#")) {
          lineClass = "text-green-600"; // Comments
        } else if (line.match(/^(if|for|while|function|case|echo|exit)\b/)) {
          lineClass = "text-devops-600 font-medium"; // Keywords
        } else if (line.match(/\$[a-zA-Z0-9_]+/)) {
          lineClass = ""; // Variables will be handled inline
        }

        // Handle inline syntax highlighting
        const highlightedLine = line
          .replace(/(".*?")/g, '<span class="text-yellow-600">$1</span>') // Strings
          .replace(/(\$[a-zA-Z0-9_]+)/g, '<span class="text-purple-600">$1</span>'); // Variables

        return (
          <div key={index} className={`${lineClass} font-mono`}>
            <span className="text-gray-400 inline-block w-8 select-none">{index + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
          </div>
        );
      });
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Generated Script</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className={copySuccess ? "bg-green-100 text-green-800" : ""}
          >
            <Copy className="h-4 w-4 mr-1" />
            {copySuccess ? "Copied!" : "Copy"}
          </Button>
          <Button size="sm" variant="outline" onClick={downloadScript}>
            Download
          </Button>
          <Button 
            size="sm" 
            onClick={saveScript}
            className="bg-devops-600 hover:bg-devops-700"
          >
            Save
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto max-h-[500px]">
          {script ? (
            formatScriptForDisplay(script)
          ) : (
            <div className="text-gray-400 font-mono">No script generated yet</div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ScriptPreview;

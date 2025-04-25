
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import ScriptLibrary from './ScriptLibrary';
import { BoilerplateScript } from '@/types/scripts';
import { SCRIPT_CATEGORIES } from '@/data/scriptData';

type ScriptFormProps = {
  onScriptGenerated: (script: string) => void;
};

const ScriptForm = ({ onScriptGenerated }: ScriptFormProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const SCRIPT_TEMPLATES = [
    {
      id: "blank",
      name: "Blank Script",
      description: "Start from scratch",
      template: "#!/bin/bash\n\n# Your script here\n\necho \"Hello World\"",
    },
    {
      id: "user-mgmt",
      name: "User Management",
      description: "Create users and set permissions",
      template: `#!/bin/bash

# User Management Script
# Usage: ./user_mgmt.sh [add|remove] [username]

ACTION=\${1:-"add"}
USERNAME=\${2:-"newuser"}

if [ "$ACTION" = "add" ]; then
  echo "Adding user $USERNAME"
  useradd -m $USERNAME
  echo "User $USERNAME created successfully"
elif [ "$ACTION" = "remove" ]; then
  echo "Removing user $USERNAME"
  userdel -r $USERNAME
  echo "User $USERNAME removed successfully"
else
  echo "Invalid action. Use 'add' or 'remove'"
  exit 1
fi
`,
    },
    {
      id: "backup",
      name: "Backup Script",
      description: "Backup files or directories",
      template: `#!/bin/bash

# Backup Script
# Usage: ./backup.sh [source_directory] [destination_directory]

SOURCE_DIR=\${1:-"/path/to/source"}
DEST_DIR=\${2:-"/path/to/backup"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_\${TIMESTAMP}.tar.gz"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Source directory does not exist!"
  exit 1
fi

# Create destination directory if it doesn't exist
mkdir -p $DEST_DIR

# Perform backup
echo "Creating backup of $SOURCE_DIR..."
tar -czf "$DEST_DIR/$BACKUP_FILE" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")"

echo "Backup completed: $DEST_DIR/$BACKUP_FILE"
`,
    },
  ];

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
  };

  const generateScript = () => {
    setIsGenerating(true);
    
    // Find the selected template
    const template = SCRIPT_TEMPLATES.find(t => t.id === selectedTemplate);
    
    if (!template) {
      toast("Error", {
        description: "Template not found",
        duration: 3000,
      });
      setIsGenerating(false);
      return;
    }
    
    // In a real app, we would send the description to an API for AI processing
    setTimeout(() => {
      let generatedScript = template.template;
      
      // Add a simple comment with the description if provided
      if (description.trim()) {
        generatedScript = `#!/bin/bash\n\n# ${description.trim()}\n\n${generatedScript.replace('#!/bin/bash\n\n', '')}`;
      }
      
      onScriptGenerated(generatedScript);
      setIsGenerating(false);
      
      toast("Script Generated", {
        description: "Your bash script has been created",
        duration: 3000,
      });
    }, 1000);
  };

  const handleScriptDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('application/json');
    try {
      const scriptData: BoilerplateScript = JSON.parse(data);
      onScriptGenerated(scriptData.template);
      
      toast("Script Selected", {
        description: `${scriptData.name} script loaded successfully`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error parsing dragged script data:', error);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };
  
  const handleSelectScript = (script: BoilerplateScript) => {
    onScriptGenerated(script.template);
    
    toast("Script Selected", {
      description: `${script.name} script loaded successfully`,
      duration: 3000,
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="template">Choose a Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {SCRIPT_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Describe what your script should do</Label>
            <Textarea
              id="description"
              className="mt-2 h-32"
              placeholder="E.g., Create a script that creates a new user, sets their password, and adds them to the sudo group"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onDragOver={handleDragOver}
              onDrop={handleScriptDrop}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Provide details about your script's purpose or drag a script from the library below.
            </p>
          </div>

          <Button 
            onClick={generateScript} 
            disabled={isGenerating} 
            className="w-full bg-devops-600 hover:bg-devops-700"
          >
            {isGenerating ? "Generating..." : "Generate Script"}
          </Button>
        </div>
      </Card>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Script Library</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop a script from the library or click to select.
        </p>
        <ScriptLibrary onSelectScript={handleSelectScript} />
      </div>
    </div>
  );
};

export default ScriptForm;


export interface BoilerplateScript {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
}

export interface ScriptCategory {
  id: string;
  name: string;
  scripts: BoilerplateScript[];
}

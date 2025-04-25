
import { ScriptCategory } from '@/types/scripts';
import { systemManagementScripts } from './scripts/systemManagement';
import { userManagementScripts } from './scripts/userManagement';

export const SCRIPT_CATEGORIES: ScriptCategory[] = [
  {
    id: "system-management",
    name: "System Management",
    scripts: systemManagementScripts
  },
  {
    id: "user-management",
    name: "User Management",
    scripts: userManagementScripts
  }
  // Add more categories here
];

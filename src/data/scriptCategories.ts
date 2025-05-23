
import { ScriptCategory } from '@/types/scripts';
import { systemManagementScripts } from './scripts/systemManagement';
import { userManagementScripts } from './scripts/userManagement';
import { diskManagementScripts } from './scripts/diskManagement';
import { networkConfigurationScripts } from './scripts/networkConfiguration';
import { dockerManagementScripts } from './scripts/dockerManagement';
import { backupRestoreScripts } from './scripts/backupRestore';
import { securityManagementScripts } from './scripts/securityManagement';
import { cronJobsScripts } from './scripts/cronJobs';
import { logManagementScripts } from './scripts/logManagement';
import { cicdScripts } from './scripts/cicdScripts';
import { kubernetesScripts } from './scripts/kubernetesScripts';
import { devopsScripts } from './scripts/devopsScripts';
import { jenkinsScripts } from './scripts/jenkinsScripts';
import { serverOpsScripts } from './scripts/serverOpsScripts';

export const SCRIPT_CATEGORIES: ScriptCategory[] = [
  {
    id: "cicd",
    name: "CI/CD Pipeline",
    scripts: cicdScripts
  },
  {
    id: "kubernetes",
    name: "Kubernetes Operations",
    scripts: kubernetesScripts
  },
  {
    id: "jenkins",
    name: "Jenkins Automation",
    scripts: jenkinsScripts
  },
  {
    id: "docker-management",
    name: "Docker Automation",
    scripts: dockerManagementScripts
  },
  {
    id: "devops",
    name: "DevOps Tools",
    scripts: devopsScripts
  },
  {
    id: "server-ops",
    name: "Server Operations",
    scripts: serverOpsScripts
  },
  {
    id: "system-management",
    name: "System Management",
    scripts: systemManagementScripts
  },
  {
    id: "user-management",
    name: "User Management",
    scripts: userManagementScripts
  },
  {
    id: "disk-management",
    name: "Disk & Memory Monitoring",
    scripts: diskManagementScripts
  },
  {
    id: "network-configuration",
    name: "Network Configuration",
    scripts: networkConfigurationScripts
  },
  {
    id: "backup-restore",
    name: "Backup & Restore",
    scripts: backupRestoreScripts
  },
  {
    id: "security-management",
    name: "Security & Access",
    scripts: securityManagementScripts
  },
  {
    id: "cron-jobs",
    name: "Cron Jobs & Scheduling",
    scripts: cronJobsScripts
  },
  {
    id: "log-management",
    name: "Log Management",
    scripts: logManagementScripts
  }
];

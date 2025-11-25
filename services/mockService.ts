import { BondType, Project, ProjectStatus, Report, OperationLog, User, ReportData } from '../types';

// Mock User
export const MOCK_USER: User = {
  id: 'u1',
  username: 'manager_zhang',
  name: '张经理',
  role: '客户经理',
  email: 'zhang@guarantee.com',
  avatar: 'https://picsum.photos/200/200'
};

// Initialize Projects from LocalStorage or Empty
const STORAGE_KEY = 'baohantong_projects';

let localProjects: Project[] = [];

try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    localProjects = JSON.parse(stored);
  } else {
    // Start with EMPTY list as requested
    localProjects = []; 
  }
} catch (e) {
  localProjects = [];
}

// Helper to save
const saveProjects = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localProjects));
};

// Mock Logs
export const MOCK_LOGS: OperationLog[] = [
  { id: 'l1', action: '登录', details: '用户登录系统', timestamp: '2023-10-26T08:55:00Z', user: '张经理' },
];

// API Methods

export const getProjects = async (): Promise<Project[]> => {
  // Return copy to avoid reference issues
  return new Promise((resolve) => setTimeout(() => resolve([...localProjects]), 300));
};

export const createProjectFromReport = async (reportData: ReportData, bondType: string): Promise<Project> => {
  const newProject: Project = {
    id: `p-${Date.now()}`,
    name: reportData.guaranteeInfo.projectName || '未命名项目',
    bondType: bondType as BondType || BondType.BID,
    status: ProjectStatus.REVIEWING, // Default to Reviewing when created from report
    customerName: reportData.clientInfo.name || '未知客户',
    amount: parseFloat(reportData.guaranteeInfo.amount?.replace(/[^0-9.]/g, '') || '0'),
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  };

  localProjects.unshift(newProject); // Add to top
  saveProjects();
  return newProject;
};

export const updateProjectStatus = async (projectId: string, newStatus: ProjectStatus): Promise<void> => {
  const index = localProjects.findIndex(p => p.id === projectId);
  if (index !== -1) {
    localProjects[index] = {
      ...localProjects[index],
      status: newStatus,
      updateTime: new Date().toISOString()
    };
    saveProjects();
  }
};

export const getReports = async (): Promise<Report[]> => {
  return new Promise((resolve) => setTimeout(() => resolve([]), 500));
};

export const getLogs = async (): Promise<OperationLog[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_LOGS), 500));
};
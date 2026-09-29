import axios from 'axios';

export type ProjectStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface ProjectDto {
  id: number;
  title: string;
  slug: string;
  industry: string;
  category: string;
  description: string;
  difficulty: string;
  duration: string;
  skillsCount: number;
  learnersCount: number;
  imageUrl?: string;
  prerequisites?: string;
  techStack: string[];
  whatYouWillBuild: string[];
  learningOutcomes: string[];
  skillsLearned: string[];
  active: boolean;
  published: boolean;
  displayOrder: number;
}

export interface LearnerTaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface LearnerProjectProgress {
  projectId: number | string;
  projectSlug: string;
  status: ProjectStatus;
  progressPercentage: number;
  completedTasks: number;
  totalTasks: number;
  tasks: LearnerTaskItem[];
  startedAt?: string;
  lastUpdated?: string;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ingage_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fetch public/learner active projects from Spring Boot GET /projects
 */
export async function getProjectsApi(industry?: string): Promise<ProjectDto[]> {
  const params: Record<string, string> = {};
  if (industry && industry !== 'All') {
    params.industry = industry;
  }
  const res = await api.get<ProjectDto[]>('/projects', { params });
  return res.data;
}

/**
 * Fetch project details by slug from Spring Boot GET /projects/{slug}
 */
export async function getProjectBySlugApi(slug: string): Promise<ProjectDto> {
  const res = await api.get<ProjectDto>(`/projects/${slug}`);
  return res.data;
}

// Key helper for learner project progress persistence
function getStorageKey(userId?: string | number): string {
  const effectiveId = userId ? String(userId) : 'guest';
  return `ingage_learner_project_progress_${effectiveId}`;
}

export function getLearnerProjectsProgress(userId?: string | number): Record<string, LearnerProjectProgress> {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLearnerProjectProgress(
  userId: string | number | undefined,
  progress: LearnerProjectProgress
): Record<string, LearnerProjectProgress> {
  try {
    const current = getLearnerProjectsProgress(userId);
    const updated = {
      ...current,
      [String(progress.projectId)]: progress,
    };
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    return updated;
  } catch {
    return {};
  }
}

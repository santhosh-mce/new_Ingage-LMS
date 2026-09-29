import axios from 'axios';

export type OpportunityType = 'Job' | 'Internship' | 'Freelance' | 'Apprenticeship';
export type WorkMode = 'Remote' | 'Hybrid' | 'On-site';
export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Rejected'
  | 'Accepted';

export interface OpportunityItem {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: OpportunityType;
  workMode: WorkMode;
  salary: string;
  experienceLevel: string;
  category: string;
  matchScore: number;
  requiredSkills: { name: string; matched?: boolean }[];
  description: string;
  aboutCompany: string;
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  deadline?: string;
  postedDate?: string;
  roleTrackId?: string;
  active?: boolean;
  published?: boolean;
  displayOrder?: number;
}

export interface ApplicationItem {
  id: string;
  opportunityId: string;
  appliedAt: string;
  appliedAtFormatted?: string;
  status: ApplicationStatus;
  opportunityTitle: string;
  companyName: string;
  companyLogo?: string;
  type: OpportunityType;
  location: string;
  salary: string;
  notes?: string;
}

export interface OpportunityStats {
  availableCount: number;
  appliedCount: number;
  savedCount: number;
  partnersCount: number;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ingage_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fetch public opportunities from Spring Boot GET /opportunities
 */
export async function getOpportunitiesApi(params?: {
  type?: string;
  workMode?: string;
  search?: string;
}): Promise<OpportunityItem[]> {
  const queryParams: Record<string, string> = {};
  if (params?.type && params.type !== 'all') queryParams.type = params.type;
  if (params?.workMode && params.workMode !== 'all') queryParams.workMode = params.workMode;
  if (params?.search && params.search.trim()) queryParams.search = params.search.trim();

  const response = await apiClient.get<any[]>('/opportunities', { params: queryParams });
  if (response.data && Array.isArray(response.data)) {
    return response.data.map((item: any) => ({
      id: String(item.id),
      title: item.title || 'Career Opportunity',
      company: item.company || 'Partner Company',
      companyLogo: item.companyLogo || '',
      location: item.location || 'Remote',
      type: (item.type as OpportunityType) || 'Job',
      workMode: (item.workMode as WorkMode) || 'Remote',
      salary: item.salary || 'Competitive',
      experienceLevel: item.experienceLevel || 'Entry Level',
      category: item.category || 'General',
      matchScore: item.matchScore || 85,
      requiredSkills: Array.isArray(item.requiredSkills)
        ? item.requiredSkills.map((s: any) =>
            typeof s === 'string' ? { name: s, matched: true } : { name: s.name || '', matched: s.matched !== false }
          )
        : [],
      description: item.description || '',
      aboutCompany: item.aboutCompany || '',
      responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities : [],
      qualifications: Array.isArray(item.qualifications) ? item.qualifications : [],
      benefits: Array.isArray(item.benefits) ? item.benefits : [],
      deadline: item.deadline || 'Open until filled',
      postedDate: item.postedDate || 'Recent',
      roleTrackId: item.roleTrackId || '',
      active: item.active !== false,
      published: item.published !== false,
      displayOrder: item.displayOrder || 0,
    }));
  }
  return [];
}

/**
 * Fetch single opportunity by ID from Spring Boot GET /opportunities/{id}
 */
export async function getOpportunityByIdApi(id: string | number): Promise<OpportunityItem> {
  const response = await apiClient.get(`/opportunities/${id}`);
  const item = response.data;
  return {
    id: String(item.id),
    title: item.title || '',
    company: item.company || '',
    companyLogo: item.companyLogo || '',
    location: item.location || '',
    type: item.type as OpportunityType,
    workMode: item.workMode as WorkMode,
    salary: item.salary || '',
    experienceLevel: item.experienceLevel || '',
    category: item.category || '',
    matchScore: item.matchScore || 85,
    requiredSkills: Array.isArray(item.requiredSkills)
      ? item.requiredSkills.map((s: any) =>
          typeof s === 'string' ? { name: s, matched: true } : { name: s.name || '', matched: s.matched !== false }
        )
      : [],
    description: item.description || '',
    aboutCompany: item.aboutCompany || '',
    responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities : [],
    qualifications: Array.isArray(item.qualifications) ? item.qualifications : [],
    benefits: Array.isArray(item.benefits) ? item.benefits : [],
    deadline: item.deadline || '',
    postedDate: item.postedDate || '',
    roleTrackId: item.roleTrackId || '',
    active: item.active !== false,
    published: item.published !== false,
  };
}

/**
 * Fetch Opportunity Stats from Spring Boot GET /opportunities/stats
 */
export async function getOpportunityStatsApi(): Promise<OpportunityStats> {
  const response = await apiClient.get<OpportunityStats>('/opportunities/stats');
  return response.data;
}

/**
 * Fetch authenticated user's submitted applications from Spring Boot GET /opportunities/my-applications
 */
export async function getMyApplicationsApi(): Promise<ApplicationItem[]> {
  const response = await apiClient.get<any[]>('/opportunities/my-applications');
  if (response.data && Array.isArray(response.data)) {
    return response.data.map((app: any) => ({
      id: String(app.id),
      opportunityId: String(app.opportunityId),
      appliedAt: app.appliedAtFormatted || (app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : ''),
      status: (app.status as ApplicationStatus) || 'Under Review',
      opportunityTitle: app.opportunityTitle || '',
      companyName: app.companyName || '',
      companyLogo: app.companyLogo || '',
      type: (app.type as OpportunityType) || 'Job',
      location: app.location || '',
      salary: app.salary || '',
      notes: app.notes || '',
    }));
  }
  return [];
}

/**
 * Fetch authenticated user's saved opportunity IDs from Spring Boot GET /opportunities/saved
 */
export async function getSavedOpportunityIdsApi(): Promise<string[]> {
  const response = await apiClient.get<string[]>('/opportunities/saved');
  return Array.isArray(response.data) ? response.data.map(String) : [];
}

/**
 * Apply to an opportunity in PostgreSQL via POST /opportunities/{id}/apply
 */
export async function applyToOpportunityApi(
  opportunityId: string | number,
  notes?: string
): Promise<ApplicationItem> {
  const response = await apiClient.post<any>(`/opportunities/${opportunityId}/apply`, {
    notes: notes || '',
  });
  const app = response.data;
  return {
    id: String(app.id),
    opportunityId: String(app.opportunityId),
    appliedAt: app.appliedAtFormatted || (app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Just now'),
    status: (app.status as ApplicationStatus) || 'Under Review',
    opportunityTitle: app.opportunityTitle || '',
    companyName: app.companyName || '',
    companyLogo: app.companyLogo || '',
    type: (app.type as OpportunityType) || 'Job',
    location: app.location || '',
    salary: app.salary || '',
    notes: app.notes || '',
  };
}

/**
 * Save / Bookmark opportunity in PostgreSQL via POST /opportunities/{id}/save
 */
export async function saveOpportunityApi(opportunityId: string | number): Promise<boolean> {
  const response = await apiClient.post<{ saved: boolean }>(`/opportunities/${opportunityId}/save`);
  return response.data.saved;
}

/**
 * Unsave opportunity in PostgreSQL via DELETE /opportunities/{id}/save
 */
export async function unsaveOpportunityApi(opportunityId: string | number): Promise<boolean> {
  const response = await apiClient.delete<{ saved: boolean }>(`/opportunities/${opportunityId}/save`);
  return response.data.saved;
}

// ---------------- Admin Opportunity APIs ----------------

export async function getAdminOpportunities(): Promise<OpportunityItem[]> {
  const response = await apiClient.get<any[]>('/admin/opportunities');
  return Array.isArray(response.data) ? response.data.map((item: any) => ({
    id: String(item.id),
    title: item.title || '',
    company: item.company || '',
    companyLogo: item.companyLogo || '',
    location: item.location || '',
    type: item.type as OpportunityType,
    workMode: item.workMode as WorkMode,
    salary: item.salary || '',
    experienceLevel: item.experienceLevel || '',
    category: item.category || '',
    matchScore: item.matchScore || 85,
    requiredSkills: Array.isArray(item.requiredSkills)
      ? item.requiredSkills.map((s: any) =>
          typeof s === 'string' ? { name: s, matched: true } : { name: s.name || '', matched: s.matched !== false }
        )
      : [],
    description: item.description || '',
    aboutCompany: item.aboutCompany || '',
    responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities : [],
    qualifications: Array.isArray(item.qualifications) ? item.qualifications : [],
    benefits: Array.isArray(item.benefits) ? item.benefits : [],
    deadline: item.deadline || '',
    postedDate: item.postedDate || '',
    roleTrackId: item.roleTrackId || '',
    active: item.active !== false,
    published: item.published !== false,
    displayOrder: item.displayOrder || 0,
  })) : [];
}

export async function createAdminOpportunity(payload: Record<string, any>): Promise<any> {
  const response = await apiClient.post('/admin/opportunities', payload);
  return response.data;
}

export async function updateAdminOpportunity(id: string | number, payload: Record<string, any>): Promise<any> {
  const response = await apiClient.put(`/admin/opportunities/${id}`, payload);
  return response.data;
}

export async function toggleOpportunityPublish(id: string | number, published: boolean): Promise<any> {
  const response = await apiClient.put(`/admin/opportunities/${id}/publish`, { published });
  return response.data;
}

export async function toggleOpportunityStatus(id: string | number, active: boolean): Promise<any> {
  const response = await apiClient.put(`/admin/opportunities/${id}/status`, { active });
  return response.data;
}

export async function deleteAdminOpportunity(id: string | number): Promise<any> {
  const response = await apiClient.delete(`/admin/opportunities/${id}`);
  return response.data;
}

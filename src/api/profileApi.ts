import axios from 'axios';

export interface PersonalInfoDto {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  emailVerified?: boolean;
}

export interface CareerGoalDto {
  targetJobRole?: string;
  preferredIndustry?: string;
  experienceLevel?: string;
  preferredLocation?: string;
  careerGoal?: string;
  openToWork?: boolean;
}

export interface ProfessionalLinksDto {
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  otherWebsiteUrl?: string;
}

export interface UserEducationDto {
  id?: number;
  qualification?: string;
  degree: string;
  institution: string;
  department?: string;
  graduationYear?: string;
  cgpa?: string;
}

export interface UserSkillDto {
  id?: number;
  name: string;
  category: 'PROGRAMMING_LANGUAGES' | 'TECHNOLOGIES' | 'DATABASES' | 'TOOLS' | 'SOFT_SKILLS' | string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | string;
}

export interface UserProjectDto {
  id?: number;
  title: string;
  description?: string;
  category?: string;
  technologies?: string;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  status?: string;
}

export interface ResumeDto {
  filename?: string;
  url?: string;
  fileSize?: number;
  formattedFileSize?: string;
  uploadedAt?: string;
  status?: string;
}

export interface DashboardSummaryDto {
  coursesEnrolled: number;
  coursesCompleted: number;
  projectsCompleted: number;
  credentialsEarned: number;
  careerReadinessPercentage: number;
}

export interface CareerCompassReadinessDto {
  targetJobRole?: string;
  careerTitle?: string;
  careerSlug?: string;
  careerCategory?: string;
  careerLevel?: string;
  readinessPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  allRequiredSkills: string[];
  recommendedCourses: Array<{
    id: number;
    title: string;
    slug: string;
    thumbnail?: string;
    category?: string;
    level?: string;
  }>;
  recommendedProjects: Array<{
    id: number;
    title: string;
    description?: string;
    difficulty?: string;
    technologies?: string;
  }>;
  recommendedCredentials: Array<{
    id: number;
    title: string;
    slug: string;
    credentialName?: string;
    provider?: string;
    thumbnail?: string;
  }>;
}

export interface ProfileDto {
  personalInfo: PersonalInfoDto;
  careerGoal: CareerGoalDto;
  links: ProfessionalLinksDto;
  resume: ResumeDto;
  education: UserEducationDto[];
  skills: UserSkillDto[];
  projects: UserProjectDto[];
  summary: DashboardSummaryDto;
  careerCompass: CareerCompassReadinessDto;
  profileCompletionPercentage: number;
  completedSections: string[];
  missingSections: string[];
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
 * Fetch authenticated user's full career profile
 */
export async function getMyProfile(): Promise<ProfileDto> {
  const response = await apiClient.get<ProfileDto>('/profile/me');
  return response.data;
}

export interface FullProfileUpdateRequest {
  personalInfo?: Partial<PersonalInfoDto>;
  careerGoal?: Partial<CareerGoalDto>;
  links?: Partial<ProfessionalLinksDto>;
  education?: UserEducationDto[];
  skills?: UserSkillDto[];
}

/**
 * Batch update complete profile in a single atomic call
 */
export async function updateFullProfile(data: FullProfileUpdateRequest): Promise<ProfileDto> {
  const response = await apiClient.put<ProfileDto>('/profile/me/full', data);
  return response.data;
}

/**
 * Update personal information
 */
export async function updatePersonalInfo(data: Partial<PersonalInfoDto>): Promise<ProfileDto> {
  const response = await apiClient.put<ProfileDto>('/profile/me', data);
  return response.data;
}

/**
 * Update career goal
 */
export async function updateCareerGoal(data: Partial<CareerGoalDto>): Promise<ProfileDto> {
  const response = await apiClient.put<ProfileDto>('/profile/me/career', data);
  return response.data;
}

/**
 * Update professional links
 */
export async function updateProfessionalLinks(data: Partial<ProfessionalLinksDto>): Promise<ProfileDto> {
  const response = await apiClient.put<ProfileDto>('/profile/me/links', data);
  return response.data;
}

/**
 * Education CRUD
 */
export async function addEducation(data: UserEducationDto): Promise<UserEducationDto> {
  const response = await apiClient.post<UserEducationDto>('/profile/me/education', data);
  return response.data;
}

export async function updateEducation(id: number, data: UserEducationDto): Promise<UserEducationDto> {
  const response = await apiClient.put<UserEducationDto>(`/profile/me/education/${id}`, data);
  return response.data;
}

export async function deleteEducation(id: number): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/profile/me/education/${id}`);
  return response.data;
}

/**
 * Skills CRUD
 */
export async function addSkill(data: { name: string; category?: string; level?: string }): Promise<UserSkillDto> {
  const response = await apiClient.post<UserSkillDto>('/profile/me/skills', data);
  return response.data;
}

export async function deleteSkill(id: number): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/profile/me/skills/${id}`);
  return response.data;
}

/**
 * Projects CRUD
 */
export async function addProject(data: UserProjectDto): Promise<UserProjectDto> {
  const response = await apiClient.post<UserProjectDto>('/profile/me/projects', data);
  return response.data;
}

export async function updateProject(id: number, data: UserProjectDto): Promise<UserProjectDto> {
  const response = await apiClient.put<UserProjectDto>(`/profile/me/projects/${id}`, data);
  return response.data;
}

export async function deleteProject(id: number): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/profile/me/projects/${id}`);
  return response.data;
}

/**
 * Resume upload & delete
 */
export async function uploadResume(file: File): Promise<{ success: boolean; message: string; resume: ResumeDto }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<{ success: boolean; message: string; resume: ResumeDto }>(
    '/profile/me/resume',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

export async function deleteResume(): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<{ success: boolean; message: string }>('/profile/me/resume');
  return response.data;
}

/**
 * Career Compass readiness
 */
export async function getCareerCompass(): Promise<CareerCompassReadinessDto> {
  const response = await apiClient.get<CareerCompassReadinessDto>('/profile/me/career-compass');
  return response.data;
}

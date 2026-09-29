import axios from 'axios';

export interface CareerSalaryInfo {
  min: number;
  max: number;
  currency: string;
  formatted: string;
}

export interface CareerDto {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string;
  shortDescription?: string;
  level: string;
  duration: string;
  salary: CareerSalaryInfo;
  imageUrl: string;
  icon?: string;
  featured: boolean;
  popular: boolean;
  active: boolean;
  displayOrder: number;
  jobOpenings: string;
  modulesCount: number;
  certificationName?: string;
  skills: string[];
}

export interface CareerSkillDto {
  id: number;
  skillName: string;
  skillType: string;
  displayOrder: number;
}

export interface CareerResponsibilityDto {
  id: number;
  responsibility: string;
  displayOrder: number;
}

export interface CareerRoadmapDto {
  id: number;
  title: string;
  description: string;
  duration: string;
  displayOrder: number;
}

export interface CareerProjectDto {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  technologies: string;
  displayOrder: number;
}

export interface CareerCourseDto {
  id: number;
  courseId: number;
  courseTitle: string;
  courseThumbnail: string;
  courseCategory: string;
  courseLevel?: string;
  coursePrice?: number;
  displayOrder: number;
  enrollmentStatus?: 'NOT_LOGGED_IN' | 'NOT_ENROLLED' | 'ENROLLED' | 'COMPLETED';
  paymentStatus?: 'PAID' | 'PENDING' | 'FAILED' | null;
  progress?: number;
  courseAccess?: boolean;
  completed?: boolean;
  title?: string;
  imageUrl?: string;
  category?: string;
  level?: string;
  price?: number;
  included?: boolean;
  requiredForCompletion?: boolean;
}

export interface CourseEnrollmentStatusDto {
  courseId: number;
  enrolled: boolean;
  enrollmentStatus: 'NOT_LOGGED_IN' | 'NOT_ENROLLED' | 'ENROLLED' | 'COMPLETED';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | null;
  progress: number;
  courseAccess: boolean;
  completed: boolean;
}

export interface CareerOpportunityDto {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  displayOrder: number;
}

export interface CareerStatsDto {
  courseCount: number;
  projectCount: number;
  jobOpportunityCount: number;
  skillCount: number;
}

export interface CareerDetailDto {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string;
  shortDescription?: string;
  level: string;
  duration: string;
  salary: CareerSalaryInfo;
  imageUrl: string;
  icon?: string;
  price?: number;
  originalPrice?: number;
  discountPercent?: number;
  featured: boolean;
  popular: boolean;
  active: boolean;
  displayOrder: number;
  jobOpenings: string;
  modulesCount: number;
  certificationName?: string;
  skills: CareerSkillDto[];
  responsibilities: CareerResponsibilityDto[];
  roadmap: CareerRoadmapDto[];
  projects: CareerProjectDto[];
  courses: CareerCourseDto[];
  jobOpportunities: CareerOpportunityDto[];
  stats: CareerStatsDto;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface GetCareersParams {
  search?: string;
  keyword?: string;
  category?: string;
  level?: string;
  featured?: boolean;
  popular?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// Backward compatibility DTO
export interface JobRoleDto {
  id: number;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  iconName?: string;
  difficultyLevel: string;
  durationMonths: number;
  minimumSalary: number;
  maximumSalary: number;
  jobOpenings: number;
  moduleCount: number;
  trending: boolean;
}

const careerClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

careerClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ingage_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fetch paginated & filtered careers from GET /api/careers
 */
export async function getCareers(params?: GetCareersParams): Promise<PageResponse<CareerDto>> {
  const response = await careerClient.get<PageResponse<CareerDto>>('/careers', { params });
  return response.data;
}

/**
 * Search careers with GET /api/careers/search?keyword=...
 */
export async function searchCareers(keyword: string, page = 0, size = 20): Promise<PageResponse<CareerDto>> {
  const response = await careerClient.get<PageResponse<CareerDto>>('/careers/search', {
    params: { keyword, page, size }
  });
  return response.data;
}

/**
 * Fetch complete career details by slug from GET /api/careers/slug/{slug}
 */
export async function getCareerBySlug(slug: string): Promise<CareerDetailDto> {
  const response = await careerClient.get<CareerDetailDto>(`/careers/slug/${slug}`);
  return response.data;
}

/**
 * Fetch career details by ID from GET /api/careers/{id}
 */
export async function getCareerById(id: number | string): Promise<CareerDetailDto> {
  const response = await careerClient.get<CareerDetailDto>(`/careers/${id}`);
  return response.data;
}

/**
 * Fetch distinct categories from GET /api/careers/categories
 */
export async function getCareerCategories(): Promise<string[]> {
  const response = await careerClient.get<string[]>('/careers/categories');
  return response.data;
}

/**
 * Fetch stats for a career from GET /api/careers/{id}/stats
 */
export async function getCareerStats(id: number | string): Promise<CareerStatsDto> {
  const response = await careerClient.get<CareerStatsDto>(`/careers/${id}/stats`);
  return response.data;
}

export async function getCourseEnrollmentStatus(courseId: number | string): Promise<CourseEnrollmentStatusDto> {
  const response = await careerClient.get<CourseEnrollmentStatusDto>(`/courses/${courseId}/enrollment-status`);
  return response.data;
}

/**
 * Securely downloads the career curriculum file from backend.
 * Protected by JWT authorization and backend database purchase/enrollment checks.
 */
export async function downloadCareerCurriculum(slugOrId: number | string): Promise<Blob> {
  const response = await careerClient.get(`/careers/${slugOrId}/curriculum/download`, {
    responseType: 'blob',
  });
  return response.data;
}

// Backward compatibility functions
export async function getJobRoles(): Promise<JobRoleDto[]> {
  const response = await careerClient.get<JobRoleDto[]>('/career/job-roles');
  return response.data;
}


import axios from 'axios';

export interface CourseDto {
  id: number;
  title: string;
  description: string;
  shortDescription?: string;
  thumbnail: string;
  category: string;
  level: string;
  duration: string;
  instructor: string;
  price: number;
  discountPrice?: number;
  status?: string;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const courseClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

courseClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ingage_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getCourses(search?: string): Promise<CourseDto[]> {
  const params: Record<string, string> = {};
  if (search && search.trim()) {
    params.search = search.trim();
  }
  const response = await courseClient.get<CourseDto[]>('/courses', { params });
  return response.data;
}

export async function getCourseById(id: number | string): Promise<CourseDto> {
  const response = await courseClient.get<CourseDto>(`/courses/${id}`);
  return response.data;
}

export async function searchCourses(keyword: string): Promise<CourseDto[]> {
  const response = await courseClient.get<CourseDto[]>('/courses/search', {
    params: { keyword: keyword?.trim() || '' },
  });
  return response.data;
}

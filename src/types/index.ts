export interface JobRole {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  avgSalary: string;
  jobOpenings: string;
  modulesCount: number;
  trending?: boolean;
  iconName: string;
  imageUrl: string;
  skills: string[];
  prerequisites: string[];
  certificationName: string;
  modules: CourseModule[];
}

export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  lessonsCount: number;
  description: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  lessons: LessonItem[];
}

export interface LessonItem {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz' | 'project';
  isCompleted: boolean;
  videoUrl?: string;
  passingScore?: number;
}

export interface ProjectTrack {
  id: string;
  title: string;
  industry: 'Healthcare' | 'Gaming' | 'Smart Cities' | 'FinTech' | 'EdTech' | 'Manufacturing' | string;
  category?: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  skillsCount: number;
  techStack: string[];
  learnersCount?: number;
  imageUrl?: string;
  whatYouWillBuild?: string[];
  learningOutcomes?: string[];
  skillsLearned?: string[];
  prerequisites?: string;
}

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Remote' | 'Hybrid';
  salary: string;
  roleMatch: string;
  postedDate: string;
  tags: string[];
}

export interface UserProfile {
  phone?: string;
  highestQualification?: string;
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  profileImage?: string;
  role?: string;
  enrolledPaths?: string[];
  completedLessons?: string[];
}

export type AuthMode =
  | 'signup'
  | 'login'
  | 'forgot-password'
  | 'reset-password';


import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ingage_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface QuizQuestion {
  id: number;
  lessonId: number;
  questionText: string;
  options: string[];
  displayOrder: number;
}

export interface QuizQuestionResult {
  questionId: number;
  questionText?: string;
  options?: string[];
  selectedOptionIndex?: number | null;
  selectedAnswerText?: string | null;
  correctOptionIndex?: number;
  correctAnswerText?: string;
  correct?: boolean;
  isCorrect?: boolean;
  explanation?: string;
  [key: string]: any;
}

export interface QuizMetadata {
  passingScore: number;
  timeLimit: number;
  maxAttempts: number;
  quizDescription: string;
  totalQuestions?: number;
  totalMarks?: number;
  status?: string;
  order?: string;
  weekNumber?: string;
  [key: string]: any;
}

export interface QuizDetailResponse {
  id: number;
  lessonId: number;
  title: string;
  description: string;
  quizDescription: string;
  timeLimit: number;
  totalMarks: number;
  passingScore: number;
  maxAttempts: number;
  attemptCount: number;
  attemptLimitReached?: boolean;
  completed?: boolean;
  lastScore?: number | null;
  status: string;
  questionsCount: number;
  questions: QuizQuestion[];
  networkIssue?: boolean;
  hasNetworkIssue?: boolean;
  completionReason?: string;
  [key: string]: any;
}

export function parseQuizMeta(desc?: string): QuizMetadata {
  const defaults: QuizMetadata = {
    passingScore: 70,
    timeLimit: 15,
    maxAttempts: 1,
    status: 'Active',
    totalMarks: 100,
    quizDescription: '',
  };
  if (!desc) return defaults;
  try {
    if (typeof desc === 'string' && desc.trim().startsWith('{')) {
      const parsed = JSON.parse(desc);
      const cleanDesc = typeof parsed.description === 'string' && !parsed.description.startsWith('{')
        ? parsed.description.trim()
        : (typeof parsed.quizDescription === 'string' && !parsed.quizDescription.startsWith('{')
            ? parsed.quizDescription.trim()
            : '');

      return {
        ...defaults,
        ...parsed,
        passingScore: typeof parsed.passingScore === 'number' && parsed.passingScore > 0 ? parsed.passingScore : defaults.passingScore,
        timeLimit: typeof parsed.timeLimit === 'number' && parsed.timeLimit > 0 ? parsed.timeLimit : defaults.timeLimit,
        maxAttempts: typeof parsed.maxAttempts === 'number' && parsed.maxAttempts > 0 ? parsed.maxAttempts : defaults.maxAttempts,
        status: parsed.status || defaults.status,
        totalMarks: typeof parsed.totalMarks === 'number' && parsed.totalMarks > 0 ? parsed.totalMarks : defaults.totalMarks,
        quizDescription: cleanDesc,
      };
    } else if (typeof desc === 'string') {
      return {
        ...defaults,
        quizDescription: desc.trim(),
      };
    }
    return defaults;
  } catch {
    return {
      ...defaults,
      quizDescription: typeof desc === 'string' && !desc.startsWith('{') ? desc.trim() : '',
    };
  }
}

export interface QuizSubmitRequest {
  questionId?: number;
  selectedOptionIndex?: number;
  answers?: Record<string | number, any> | any[];
  timeTakenSeconds?: number;
  [key: string]: any;
}

export interface QuizSubmitResponse {
  score?: number;
  scorePercentage?: number;
  percentage?: number;
  earnedMarks?: number;
  totalMarks?: number;
  passed?: boolean;
  passingScore?: number;
  totalQuestions?: number;
  correctCount?: number;
  correctAnswers?: number;
  wrongCount?: number;
  wrongAnswers?: number;
  unansweredCount?: number;
  unansweredQuestions?: number;
  attemptCount?: number;
  maxAttempts?: number;
  remainingAttempts?: number;
  message?: string;
  error?: string;
  questionResults?: QuizQuestionResult[];
  results?: QuizQuestionResult[];
  [key: string]: any;
}

export const getLessonQuiz = async (courseId: number | string, lessonId: number | string): Promise<QuizQuestion[]> => {
  try {
    const response = await api.get<any>(`/courses/${courseId}/quiz`, {
      params: { lessonId },
    });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data.questions)) {
      return response.data.questions;
    }
    return [];
  } catch {
    const fallbackRes = await api.get<any>(`/courses/${courseId}/lessons/${lessonId}/quiz`);
    if (Array.isArray(fallbackRes.data)) {
      return fallbackRes.data;
    }
    if (fallbackRes.data && Array.isArray(fallbackRes.data.questions)) {
      return fallbackRes.data.questions;
    }
    return [];
  }
};

export const getQuizDetail = async (
  courseId: number | string,
  lessonId: number | string
): Promise<QuizDetailResponse | null> => {
  try {
    const response = await api.get<any>(`/courses/${courseId}/quiz`, {
      params: { lessonId },
    });
    if (response.data && Array.isArray(response.data.questions)) {
      return response.data as QuizDetailResponse;
    }
    return null;
  } catch {
    try {
      const fallbackRes = await api.get<any>(`/courses/${courseId}/lessons/${lessonId}/quiz`);
      if (fallbackRes.data && Array.isArray(fallbackRes.data.questions)) {
        return fallbackRes.data as QuizDetailResponse;
      }
    } catch {}
    return null;
  }
};

export const submitQuizAnswer = async (
  courseId: number | string,
  lessonId: number | string,
  payload: QuizSubmitRequest
): Promise<QuizSubmitResponse> => {
  try {
    const response = await api.post<QuizSubmitResponse>(
      `/courses/${courseId}/quiz/submit?lessonId=${lessonId}`,
      payload
    );
    return response.data;
  } catch (err: any) {
    if (err?.response?.data) {
      throw err;
    }
    const fallbackRes = await api.post<QuizSubmitResponse>(
      `/courses/${courseId}/lessons/${lessonId}/quiz/submit`,
      payload
    );
    return fallbackRes.data;
  }
};

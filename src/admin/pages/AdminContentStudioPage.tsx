"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  HelpCircle,
  FolderArchive,
  FileBarChart,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  Split,
  Maximize2,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Loader2,
  Save,
  Search,
  Filter,
  RotateCcw,
  BookOpen,
  Layers,
  Award,
  GraduationCap,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { apiClient } from '@/api/paymentApi';
import { StudentQuizView } from '@/views/learn/StudentQuizView';
import { StudentProjectView } from '@/views/learn/StudentProjectView';
import { LearningAnalyticsReportView } from '@/components/LearningAnalyticsReportView';

export interface AdminContentStudioPageProps {
  onNavigate?: (path: string) => void;
  initialCourseId?: number | string;
}

export type StudioTab = 'QUIZZES' | 'PROJECTS' | 'REPORTS';

export interface QuizItem {
  id: number | string;
  title: string;
  timeLimit: number;
  numberOfQuestions: number;
  totalMarks: number;
  passingScore: number;
  maxAttempts: number | string;
  weekNumber: string;
  status: 'Active' | 'Draft' | 'Inactive';
  description?: string;
  sectionId?: number | string;
}

export interface ProjectItem {
  id: number | string;
  title: string;
  description: string;
  maxMarks: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lastDate: string;
  status: 'Active' | 'Draft';
  submissionType: 'GitHub URL' | 'File Upload' | 'External URL';
  code?: string;
  sectionId?: number | string;
}

export interface ReportItem {
  id: number | string;
  studentName: string;
  studentEmail: string;
  webinarCompleted: number;
  webinarTotal: number;
  webinarAvg: number;
  quizCompleted: number;
  quizTotal: number;
  quizAvg: number;
  projectCompleted: number;
  projectTotal: number;
  projectAvg: number;
  submissionAvg: number;
  overallScore: number;
}

const DEFAULT_QUIZZES: QuizItem[] = [
  {
    id: 101,
    title: 'Week-01, IoT Fundamentals Quiz',
    timeLimit: 60,
    numberOfQuestions: 25,
    totalMarks: 100,
    passingScore: 70,
    maxAttempts: 1,
    weekNumber: 'Week-01',
    status: 'Active',
    description: 'Test your understanding of IoT sensors, protocols, and architecture.',
  },
  {
    id: 102,
    title: 'Week-02, IoT Components & Architecture Quiz',
    timeLimit: 45,
    numberOfQuestions: 20,
    totalMarks: 50,
    passingScore: 65,
    maxAttempts: 2,
    weekNumber: 'Week-02',
    status: 'Active',
    description: 'Comprehensive review of ESP32 pins, Wi-Fi connectivity, and microcontrollers.',
  },
  {
    id: 103,
    title: 'Week-03, Cloud Connectivity & MQTT Protocol',
    timeLimit: 30,
    numberOfQuestions: 15,
    totalMarks: 50,
    passingScore: 75,
    maxAttempts: 'Unlimited',
    weekNumber: 'Week-03',
    status: 'Draft',
    description: 'Evaluate MQTT pub/sub topology, brokers, QoS levels, and cloud security.',
  },
];

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 201,
    title: 'Smart Home IoT Monitoring System',
    description: 'Build a smart home monitoring system that collects sensor data and displays real-time temperature, humidity, and device status through a web dashboard.',
    maxMarks: 100,
    difficulty: 'Intermediate',
    lastDate: '24-05-2026 11:59 PM',
    status: 'Active',
    submissionType: 'GitHub URL',
    code: 'week-06_dev',
  },
  {
    id: 202,
    title: 'IoT Smart Agriculture Monitoring System',
    description: 'Develop an automated agriculture management platform tracking soil moisture, automated irrigation triggers, and telemetry alerts.',
    maxMarks: 100,
    difficulty: 'Advanced',
    lastDate: '31-05-2026 11:59 PM',
    status: 'Active',
    submissionType: 'GitHub URL',
    code: 'week-07_dev',
  },
  {
    id: 203,
    title: 'PCB Design & Testing Capstone',
    description: 'Complete high-speed circuit schematic layout, power supply filtering, and signal routing using KiCad or Altium.',
    maxMarks: 100,
    difficulty: 'Beginner',
    lastDate: '07-06-2026 11:59 PM',
    status: 'Draft',
    submissionType: 'File Upload',
    code: 'week-08_dev',
  },
];

const DEFAULT_REPORTS: ReportItem[] = [
  {
    id: 301,
    studentName: 'Dilli Ganesh',
    studentEmail: 'dilliganesh.pro@gmail.com',
    webinarCompleted: 0,
    webinarTotal: 0,
    webinarAvg: 0.0,
    quizCompleted: 13,
    quizTotal: 13,
    quizAvg: 0.0,
    projectCompleted: 14,
    projectTotal: 14,
    projectAvg: 86.71,
    submissionAvg: 100.0,
    overallScore: 46.68,
  },
  {
    id: 302,
    studentName: 'Santhosh Kumar',
    studentEmail: 'santhosh.student@ingage.edu',
    webinarCompleted: 4,
    webinarTotal: 4,
    webinarAvg: 100.0,
    quizCompleted: 2,
    quizTotal: 2,
    quizAvg: 92.5,
    projectCompleted: 2,
    projectTotal: 2,
    projectAvg: 88.0,
    submissionAvg: 100.0,
    overallScore: 95.12,
  },
];

export const AdminContentStudioPage: React.FC<AdminContentStudioPageProps> = ({
  onNavigate,
  initialCourseId,
}) => {
  // Course State
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | string>(initialCourseId || '');
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Active Studio Tab
  const [activeTab, setActiveTab] = useState<StudioTab>('QUIZZES');

  // Items State (Stored per course)
  const [quizzes, setQuizzes] = useState<QuizItem[]>(DEFAULT_QUIZZES);
  const [projects, setProjects] = useState<ProjectItem[]>(DEFAULT_PROJECTS);
  const [reports, setReports] = useState<ReportItem[]>(DEFAULT_REPORTS);
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);

  // Cross-Check Student Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [previewTab, setPreviewTab] = useState<'quizzes' | 'projects' | 'reports'>('quizzes');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Active' | 'Draft'>('ALL');

  // Form Drawer / Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | string | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Form Fields - Quizzes
  const [quizForm, setQuizForm] = useState({
    title: '',
    timeLimit: 60,
    numberOfQuestions: 20,
    totalMarks: 100,
    passingScore: 70,
    maxAttempts: '1',
    weekNumber: 'Week-01',
    status: 'Active' as 'Active' | 'Draft' | 'Inactive',
    description: '',
  });

  // Form Fields - Projects
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    maxMarks: 100,
    difficulty: 'Intermediate' as 'Beginner' | 'Intermediate' | 'Advanced',
    lastDate: '24-05-2026 11:59 PM',
    status: 'Active' as 'Active' | 'Draft',
    submissionType: 'GitHub URL' as 'GitHub URL' | 'File Upload' | 'External URL',
    code: '',
  });

  // Form Fields - Reports / Progress
  const [reportForm, setReportForm] = useState({
    studentName: 'Dilli Ganesh',
    studentEmail: 'dilliganesh.pro@gmail.com',
    webinarCompleted: 4,
    webinarTotal: 4,
    webinarAvg: 100,
    quizCompleted: 13,
    quizTotal: 13,
    quizAvg: 90,
    projectCompleted: 14,
    projectTotal: 14,
    projectAvg: 86.71,
    submissionAvg: 100,
    overallScore: 88.5,
  });

  // 1. Fetch available courses
  useEffect(() => {
    let isMounted = true;
    setLoadingCourses(true);
    apiClient
      .get('/courses')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.courses || [];
        setCourses(list);
        if (list.length > 0 && !selectedCourseId) {
          setSelectedCourseId(list[0].id);
        }
      })
      .catch((err) => {
        console.warn('Courses fetch info:', err?.message);
      })
      .finally(() => {
        if (isMounted) setLoadingCourses(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Course Curriculum items when selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;

    // Check localStorage cache first
    try {
      const qKey = `ingage_studio_quizzes_${selectedCourseId}`;
      const pKey = `ingage_studio_projects_${selectedCourseId}`;
      const localQ = localStorage.getItem(qKey);
      const localP = localStorage.getItem(pKey);

      if (localQ) setQuizzes(JSON.parse(localQ));
      if (localP) setProjects(JSON.parse(localP));
    } catch {}

    // Fetch live course content from API
    apiClient
      .get(`/courses/${selectedCourseId}/content`)
      .then((res) => {
        const sections = res.data?.sections || [];
        const loadedQuizzes: QuizItem[] = [];
        const loadedProjects: ProjectItem[] = [];

        sections.forEach((sec: any) => {
          (sec.lessons || []).forEach((les: any, idx: number) => {
            const type = (les.lessonType || '').toUpperCase();
            let meta: any = {};
            if (les.description) {
              try {
                meta = JSON.parse(les.description);
              } catch {
                meta = { objective: les.description };
              }
            }

            if (type === 'QUIZ') {
              loadedQuizzes.push({
                id: les.id,
                title: les.title,
                timeLimit: Number(meta.timeLimit || 60),
                numberOfQuestions: Number(meta.totalQuestions || meta.numberOfQuestions || 20),
                totalMarks: Number(meta.totalMarks || 100),
                passingScore: Number(meta.passingScore || 70),
                maxAttempts: meta.maxAttempts || 1,
                weekNumber: meta.weekNumber || `Week-0${idx + 1}`,
                status: 'Active',
                description: meta.objective || meta.shortDescription || les.description,
                sectionId: sec.id,
              });
            } else if (type === 'PROJECT' || type === 'ASSIGNMENT') {
              loadedProjects.push({
                id: les.id,
                title: les.title,
                description: meta.objective || meta.shortDescription || les.description || 'Hands-on practical project.',
                maxMarks: Number(meta.maxMarks || 100),
                difficulty: meta.difficulty || 'Intermediate',
                lastDate: meta.lastDate || meta.dueDate || '24-05-2026 11:59 PM',
                status: 'Active',
                submissionType: meta.submissionType || 'GitHub URL',
                code: meta.code || `week-0${idx + 1}_${les.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 8)}`,
                sectionId: sec.id,
              });
            }
          });
        });

        if (loadedQuizzes.length > 0) setQuizzes(loadedQuizzes);
        if (loadedProjects.length > 0) setProjects(loadedProjects);
      })
      .catch(() => {});
  }, [selectedCourseId]);

  // Persist current state to localStorage
  const persistQuizzes = (newQuizzes: QuizItem[]) => {
    setQuizzes(newQuizzes);
    try {
      localStorage.setItem(`ingage_studio_quizzes_${selectedCourseId}`, JSON.stringify(newQuizzes));
    } catch {}
  };

  const persistProjects = (newProjects: ProjectItem[]) => {
    setProjects(newProjects);
    try {
      localStorage.setItem(`ingage_studio_projects_${selectedCourseId}`, JSON.stringify(newProjects));
    } catch {}
  };

  // Selected course object
  const currentCourse = courses.find((c) => String(c.id) === String(selectedCourseId)) || {
    id: selectedCourseId || 1,
    title: 'IoT Applications (ESP32) Masterclass',
    slug: 'iot-applications-esp32',
  };

  // ==============================================================
  // FORM HANDLERS (Add / Edit)
  // ==============================================================
  const openAddForm = () => {
    setEditingItemId(null);
    if (activeTab === 'QUIZZES') {
      setQuizForm({
        title: '',
        timeLimit: 60,
        numberOfQuestions: 20,
        totalMarks: 100,
        passingScore: 70,
        maxAttempts: '1',
        weekNumber: `Week-0${quizzes.length + 1}`,
        status: 'Active',
        description: '',
      });
    } else if (activeTab === 'PROJECTS') {
      setProjectForm({
        title: '',
        description: '',
        maxMarks: 100,
        difficulty: 'Intermediate',
        lastDate: '24-05-2026 11:59 PM',
        status: 'Active',
        submissionType: 'GitHub URL',
        code: `week-0${projects.length + 1}_dev`,
      });
    }
    setIsFormOpen(true);
  };

  const handleEditQuiz = (q: QuizItem) => {
    setEditingItemId(q.id);
    setQuizForm({
      title: q.title,
      timeLimit: q.timeLimit,
      numberOfQuestions: q.numberOfQuestions,
      totalMarks: q.totalMarks,
      passingScore: q.passingScore,
      maxAttempts: String(q.maxAttempts),
      weekNumber: q.weekNumber,
      status: q.status,
      description: q.description || '',
    });
    setIsFormOpen(true);
  };

  const handleEditProject = (p: ProjectItem) => {
    setEditingItemId(p.id);
    setProjectForm({
      title: p.title,
      description: p.description,
      maxMarks: p.maxMarks,
      difficulty: p.difficulty,
      lastDate: p.lastDate,
      status: p.status,
      submissionType: p.submissionType,
      code: p.code || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizForm.title.trim()) {
      showToast('Please enter a quiz title.', 'error');
      return;
    }

    if (editingItemId) {
      const updated = quizzes.map((q) =>
        q.id === editingItemId
          ? {
              ...q,
              ...quizForm,
            }
          : q
      );
      persistQuizzes(updated);
      showToast(`Quiz "${quizForm.title}" updated successfully!`);
    } else {
      const newItem: QuizItem = {
        id: Date.now(),
        ...quizForm,
      };
      persistQuizzes([...quizzes, newItem]);
      showToast(`Quiz "${quizForm.title}" created successfully!`);
    }

    setIsFormOpen(false);
    setEditingItemId(null);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) {
      showToast('Please enter a project title.', 'error');
      return;
    }

    if (editingItemId) {
      const updated = projects.map((p) =>
        p.id === editingItemId
          ? {
              ...p,
              ...projectForm,
            }
          : p
      );
      persistProjects(updated);
      showToast(`Project "${projectForm.title}" updated successfully!`);
    } else {
      const newItem: ProjectItem = {
        id: Date.now(),
        ...projectForm,
      };
      persistProjects([...projects, newItem]);
      showToast(`Project "${projectForm.title}" created successfully!`);
    }

    setIsFormOpen(false);
    setEditingItemId(null);
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    const current = reports[selectedReportIndex] || reports[0];
    const updated: ReportItem = {
      ...current,
      ...reportForm,
    };
    const newReports = [...reports];
    newReports[selectedReportIndex] = updated;
    setReports(newReports);
    showToast(`Progress metrics for ${reportForm.studentName} updated successfully!`);
  };

  const handleDeleteQuiz = (id: number | string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    const filtered = quizzes.filter((q) => q.id !== id);
    persistQuizzes(filtered);
    showToast('Quiz deleted successfully.');
  };

  const handleDeleteProject = (id: number | string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const filtered = projects.filter((p) => p.id !== id);
    persistProjects(filtered);
    showToast('Project deleted successfully.');
  };

  // Convert QuizItems to Student Lesson format for Live Preview
  const studentQuizzesData = useMemo(() => {
    return quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      lessonType: 'QUIZ',
      description: JSON.stringify({
        timeLimit: q.timeLimit,
        totalQuestions: q.numberOfQuestions,
        numberOfQuestions: q.numberOfQuestions,
        totalMarks: q.totalMarks,
        passingScore: q.passingScore,
        maxAttempts: q.maxAttempts,
        weekNumber: q.weekNumber,
        objective: q.description,
      }),
    }));
  }, [quizzes]);

  // Convert ProjectItems to Student Lesson format for Live Preview
  const studentProjectsData = useMemo(() => {
    return projects.map((p) => ({
      id: p.id,
      title: p.title,
      lessonType: 'PROJECT',
      description: JSON.stringify({
        objective: p.description,
        maxMarks: p.maxMarks,
        difficulty: p.difficulty,
        lastDate: p.lastDate,
        submissionType: p.submissionType,
        code: p.code,
      }),
    }));
  }, [projects]);

  // Convert Reports Data to Student Section format for Live Preview
  const currentReport = reports[selectedReportIndex] || reports[0];
  const studentSectionsData = useMemo(() => {
    return [
      {
        id: 1,
        title: 'Module 1: IoT Applications (ESP32)',
        lessons: [
          ...studentQuizzesData,
          ...studentProjectsData,
        ],
      },
    ];
  }, [studentQuizzesData, studentProjectsData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* 1. TOP HEADER & STUDIO CONTROLS */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-[#00A86B]/10 text-[#00A86B] flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Content Studio &amp; Student Cross-Check</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input course assessments, projects, and report metrics — then immediately verify live student views.
                </p>
              </div>
            </div>
          </div>

          {/* Course Selector & Primary Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Course Selector Dropdown */}
            <div className="relative min-w-[220px]">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00A86B] cursor-pointer appearance-none transition"
              >
                {courses.length === 0 ? (
                  <option value="1">IoT Applications (ESP32)</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Split Screen Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsSplitMode(!isSplitMode)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${
                isSplitMode
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Toggle Live Side-by-Side Preview"
            >
              <Split className="w-4 h-4" />
              <span>{isSplitMode ? 'Exit Split View' : 'Side-by-Side View'}</span>
            </button>

            {/* Open Fullscreen Student Preview Button (CORE REQUIREMENT) */}
            <button
              type="button"
              onClick={() => {
                setPreviewTab(activeTab === 'QUIZZES' ? 'quizzes' : activeTab === 'PROJECTS' ? 'projects' : 'reports');
                setIsPreviewOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#008f5b] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Student View</span>
            </button>

            {/* Direct Link to Student Course Page */}
            {currentCourse?.slug && (
              <a
                href={`/courses/${currentCourse.slug}/learn?tab=${activeTab.toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-2xs"
                title="Open live student page in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Studio Primary Navigation Tabs */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('QUIZZES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'QUIZZES'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quizzes Management</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'QUIZZES' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {quizzes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PROJECTS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'PROJECTS'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Projects &amp; Capstones</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'PROJECTS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {projects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REPORTS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'REPORTS'
                ? 'bg-[#00A86B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileBarChart className="w-4 h-4" />
            <span>Progress &amp; Reports Studio</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'REPORTS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {reports.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE CONTAINER (Split Screen or Single View) */}
      <div className={`grid gap-6 items-start ${isSplitMode ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* LEFT COLUMN: Admin Management (Data Entry Form + Tables) */}
        <div className={isSplitMode ? 'lg:col-span-6 space-y-6' : 'w-full space-y-6'}>
          {/* Action Sub-Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#00A86B] shadow-2xs"
                />
              </div>

              {activeTab !== 'REPORTS' && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none shadow-2xs"
                >
                  <option value="ALL">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              )}
            </div>

            {activeTab !== 'REPORTS' ? (
              <button
                type="button"
                onClick={openAddForm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add {activeTab === 'QUIZZES' ? 'New Quiz' : 'New Project'}</span>
              </button>
            ) : null}
          </div>

          {/* ============================================================== */}
          {/* TAB 1: QUIZZES ADMIN TABLE & FORM */}
          {/* ============================================================== */}
          {activeTab === 'QUIZZES' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Configured Quizzes ({quizzes.length})</h3>
                  <p className="text-xs text-slate-500">All assessments published for {currentCourse.title}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-600 font-bold text-xs">
                      <th className="px-5 py-3.5">Title &amp; Order</th>
                      <th className="px-5 py-3.5">Time Limit</th>
                      <th className="px-5 py-3.5">Questions</th>
                      <th className="px-5 py-3.5">Total Marks</th>
                      <th className="px-5 py-3.5">Pass %</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quizzes
                      .filter((q) => {
                        if (searchQuery.trim() && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                        if (filterStatus !== 'ALL' && q.status !== filterStatus) return false;
                        return true;
                      })
                      .map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-900 block">{q.title}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{q.weekNumber}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">{q.timeLimit} min</td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">{q.numberOfQuestions} Qs</td>
                          <td className="px-5 py-3.5 text-slate-800 font-semibold">{q.totalMarks} Pts</td>
                          <td className="px-5 py-3.5 text-emerald-600 font-bold">{q.passingScore}%</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                q.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {q.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditQuiz(q)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                title="Edit Quiz"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuiz(q.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                                title="Delete Quiz"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: PROJECTS ADMIN TABLE & FORM */}
          {/* ============================================================== */}
          {activeTab === 'PROJECTS' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Configured Capstone Projects ({projects.length})</h3>
                  <p className="text-xs text-slate-500">Hands-on evaluation tasks for {currentCourse.title}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-600 font-bold text-xs">
                      <th className="px-5 py-3.5">Code &amp; Title</th>
                      <th className="px-5 py-3.5">Difficulty</th>
                      <th className="px-5 py-3.5">Submission Type</th>
                      <th className="px-5 py-3.5">Max Marks</th>
                      <th className="px-5 py-3.5">Last Date</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projects
                      .filter((p) => {
                        if (searchQuery.trim() && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                        if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
                        return true;
                      })
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-purple-700 font-mono text-xs block">{p.code || 'project'}</span>
                            <span className="font-bold text-slate-900">{p.title}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                              {p.difficulty}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">{p.submissionType}</td>
                          <td className="px-5 py-3.5 text-slate-800 font-semibold">{p.maxMarks} Pts</td>
                          <td className="px-5 py-3.5 text-slate-600 text-xs font-medium">{p.lastDate}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                p.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditProject(p)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                title="Edit Project"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProject(p.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                                title="Delete Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: REPORTS & LEARNING ANALYTICS DATA ENTRY */}
          {/* ============================================================== */}
          {activeTab === 'REPORTS' && (
            <div className="space-y-6">
              {/* Reports Data Entry Form */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Student Progress &amp; Report Data Entry</h3>
                    <p className="text-xs text-slate-500">Configure progress percentage and milestone averages for verified audit reports.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Learner:</span>
                    <select
                      value={selectedReportIndex}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        setSelectedReportIndex(idx);
                        const r = reports[idx];
                        if (r) {
                          setReportForm({
                            studentName: r.studentName,
                            studentEmail: r.studentEmail,
                            webinarCompleted: r.webinarCompleted,
                            webinarTotal: r.webinarTotal,
                            webinarAvg: r.webinarAvg,
                            quizCompleted: r.quizCompleted,
                            quizTotal: r.quizTotal,
                            quizAvg: r.quizAvg,
                            projectCompleted: r.projectCompleted,
                            projectTotal: r.projectTotal,
                            projectAvg: r.projectAvg,
                            submissionAvg: r.submissionAvg,
                            overallScore: r.overallScore,
                          });
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      {reports.map((r, i) => (
                        <option key={r.id} value={i}>
                          {r.studentName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <form onSubmit={handleSaveReport} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Student Name</label>
                      <input
                        type="text"
                        value={reportForm.studentName}
                        onChange={(e) => setReportForm({ ...reportForm, studentName: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#00A86B] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Student Email</label>
                      <input
                        type="email"
                        value={reportForm.studentEmail}
                        onChange={(e) => setReportForm({ ...reportForm, studentEmail: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#00A86B] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 4 Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">Webinar / Videos</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={reportForm.webinarCompleted}
                          onChange={(e) => setReportForm({ ...reportForm, webinarCompleted: Number(e.target.value) })}
                          className="w-12 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                        />
                        <span className="text-xs text-slate-400">/</span>
                        <input
                          type="number"
                          value={reportForm.webinarTotal}
                          onChange={(e) => setReportForm({ ...reportForm, webinarTotal: Number(e.target.value) })}
                          className="w-12 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Avg: {reportForm.webinarAvg.toFixed(2)}%</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">Quizzes Done</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={reportForm.quizCompleted}
                          onChange={(e) => setReportForm({ ...reportForm, quizCompleted: Number(e.target.value) })}
                          className="w-12 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                        />
                        <span className="text-xs text-slate-400">/</span>
                        <input
                          type="number"
                          value={reportForm.quizTotal}
                          onChange={(e) => setReportForm({ ...reportForm, quizTotal: Number(e.target.value) })}
                          className="w-12 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Avg: {reportForm.quizAvg.toFixed(2)}%</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">Projects Done</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={reportForm.projectCompleted}
                          onChange={(e) => setReportForm({ ...reportForm, projectCompleted: Number(e.target.value) })}
                          className="w-12 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                        />
                        <span className="text-xs text-slate-400">/</span>
                        <input
                          type="number"
                          value={reportForm.projectTotal}
                          onChange={(e) => setReportForm({ ...reportForm, projectTotal: Number(e.target.value) })}
                          className="w-12 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Avg: {reportForm.projectAvg.toFixed(2)}%</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">Overall Score (%)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={reportForm.overallScore}
                        onChange={(e) => setReportForm({ ...reportForm, overallScore: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-amber-600 text-center"
                      />
                      <span className="text-[10px] text-slate-500 font-medium">Submissions: {reportForm.submissionAvg}%</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#008f5b] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Update Learner Progress</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (Split Screen Live Student Preview) */}
        {isSplitMode && (
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 bg-slate-900 rounded-3xl text-white flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Live Student Cross-Check Preview</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewTab('quizzes')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    previewTab === 'quizzes' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quizzes
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('projects')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    previewTab === 'projects' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Projects
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('reports')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    previewTab === 'reports' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Reports
                </button>
              </div>
            </div>

            {/* Split Screen Render */}
            <div className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200 max-h-[85vh] overflow-y-auto space-y-6">
              {previewTab === 'quizzes' && (
                <StudentQuizView
                  courseId={selectedCourseId}
                  quizzes={studentQuizzesData}
                  completedLessonIds={[Number(studentQuizzesData[0]?.id) || 101]}
                  onCompleteQuiz={() => {}}
                />
              )}
              {previewTab === 'projects' && (
                <StudentProjectView
                  courseId={selectedCourseId}
                  projects={studentProjectsData}
                  completedLessonIds={[Number(studentProjectsData[0]?.id) || 201]}
                  onCompleteProject={() => {}}
                />
              )}
              {previewTab === 'reports' && (
                <LearningAnalyticsReportView
                  courseTitle={currentCourse.title}
                  courseCategory={currentCourse.category || 'Development'}
                  courseId={selectedCourseId}
                  user={{
                    name: reportForm.studentName,
                    email: reportForm.studentEmail,
                  }}
                  sections={studentSectionsData}
                  completedLessonIds={[101, 201]}
                  progressPercent={reportForm.overallScore}
                  videoProgressPercent={reportForm.webinarAvg}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. MODAL: DATA ENTRY FORM FOR QUIZZES & PROJECTS */}
      {/* ============================================================== */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFormOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    activeTab === 'QUIZZES' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {activeTab === 'QUIZZES' ? <HelpCircle className="w-5 h-5" /> : <FolderArchive className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingItemId
                      ? `Edit ${activeTab === 'QUIZZES' ? 'Quiz Assessment' : 'Capstone Project'}`
                      : `Add ${activeTab === 'QUIZZES' ? 'New Quiz Assessment' : 'New Capstone Project'}`}
                  </h3>
                  <p className="text-xs text-slate-500">Course: {currentCourse.title}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
              {activeTab === 'QUIZZES' ? (
                /* QUIZ FORM */
                <form onSubmit={handleSaveQuiz} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Quiz Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Week-01, IoT Fundamentals Quiz"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Time Limit (min)</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={quizForm.timeLimit}
                        onChange={(e) => setQuizForm({ ...quizForm, timeLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">No. of Questions</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quizForm.numberOfQuestions}
                        onChange={(e) => setQuizForm({ ...quizForm, numberOfQuestions: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Total Marks</label>
                      <input
                        type="number"
                        min="10"
                        max="500"
                        value={quizForm.totalMarks}
                        onChange={(e) => setQuizForm({ ...quizForm, totalMarks: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Pass %</label>
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={quizForm.passingScore}
                        onChange={(e) => setQuizForm({ ...quizForm, passingScore: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-600 focus:bg-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Max Attempts</label>
                      <select
                        value={quizForm.maxAttempts}
                        onChange={(e) => setQuizForm({ ...quizForm, maxAttempts: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="1">1 Attempt</option>
                        <option value="2">2 Attempts</option>
                        <option value="3">3 Attempts</option>
                        <option value="Unlimited">Unlimited</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Order / Week</label>
                      <input
                        type="text"
                        value={quizForm.weekNumber}
                        onChange={(e) => setQuizForm({ ...quizForm, weekNumber: e.target.value })}
                        placeholder="e.g. Week-01"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Status</label>
                      <select
                        value={quizForm.status}
                        onChange={(e) => setQuizForm({ ...quizForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Description / Instructions</label>
                    <textarea
                      rows={3}
                      value={quizForm.description}
                      onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                      placeholder="Brief instructions for the student regarding this quiz..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingItemId ? 'Update Quiz' : 'Save Quiz'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* PROJECT FORM */
                <form onSubmit={handleSaveProject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Project Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smart Home IoT Monitoring System"
                      value={projectForm.title}
                      onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Description &amp; Objective</label>
                    <textarea
                      rows={3}
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      placeholder="Detailed practical objective of this capstone assignment..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Difficulty Level</label>
                      <select
                        value={projectForm.difficulty}
                        onChange={(e) => setProjectForm({ ...projectForm, difficulty: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Max Marks</label>
                      <input
                        type="number"
                        min="10"
                        max="500"
                        value={projectForm.maxMarks}
                        onChange={(e) => setProjectForm({ ...projectForm, maxMarks: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Submission Type</label>
                      <select
                        value={projectForm.submissionType}
                        onChange={(e) => setProjectForm({ ...projectForm, submissionType: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="GitHub URL">GitHub URL</option>
                        <option value="File Upload">File Upload</option>
                        <option value="External URL">External URL</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Last Date / Deadline</label>
                      <input
                        type="text"
                        value={projectForm.lastDate}
                        onChange={(e) => setProjectForm({ ...projectForm, lastDate: e.target.value })}
                        placeholder="24-05-2026 11:59 PM"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Project Identifier Code</label>
                      <input
                        type="text"
                        value={projectForm.code}
                        onChange={(e) => setProjectForm({ ...projectForm, code: e.target.value })}
                        placeholder="week-06_dev"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-purple-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingItemId ? 'Update Project' : 'Save Project'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODAL: LIVE STUDENT VIEW CROSS-CHECK PREVIEW (CORE REQUIREMENT) */}
      {/* ============================================================== */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPreviewOpen(false);
          }}
        >
          <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Browser-like Mockup Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="px-3 py-1 bg-slate-800/90 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">STUDENT VIEW</span>
                  <span className="text-slate-600">•</span>
                  <span>{currentCourse.title}</span>
                </div>
              </div>

              {/* Preview Navigation Tabs */}
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('quizzes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      previewTab === 'quizzes'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Quizzes View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('projects')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      previewTab === 'projects'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Projects View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('reports')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      previewTab === 'reports'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Reports View
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Student Content Canvas */}
            <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50/60 max-h-[calc(92vh-4.5rem)] space-y-6">
              {/* Notice bar */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-semibold shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    You are cross-checking live student rendering for <strong>{currentCourse.title}</strong>.
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  Interactive Preview
                </span>
              </div>

              {/* Tab 1 Render: Student Quizzes (3 Metric Cards + List of Quiz Table) */}
              {previewTab === 'quizzes' && (
                <StudentQuizView
                  courseId={selectedCourseId}
                  quizzes={studentQuizzesData}
                  completedLessonIds={[Number(studentQuizzesData[0]?.id) || 101]}
                  onCompleteQuiz={() => {}}
                />
              )}

              {/* Tab 2 Render: Student Projects (3 Metric Cards + List of Projects Table) */}
              {previewTab === 'projects' && (
                <StudentProjectView
                  courseId={selectedCourseId}
                  projects={studentProjectsData}
                  completedLessonIds={[Number(studentProjectsData[0]?.id) || 201]}
                  onCompleteProject={() => {}}
                />
              )}

              {/* Tab 3 Render: Student Reports (Profile Header + 4 Metric Cards + Quizz Table) */}
              {previewTab === 'reports' && (
                <LearningAnalyticsReportView
                  courseTitle={currentCourse.title}
                  courseCategory={currentCourse.category || 'Development'}
                  courseId={selectedCourseId}
                  user={{
                    name: reportForm.studentName,
                    email: reportForm.studentEmail,
                  }}
                  sections={studentSectionsData}
                  completedLessonIds={[101, 201]}
                  progressPercent={reportForm.overallScore}
                  videoProgressPercent={reportForm.webinarAvg}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

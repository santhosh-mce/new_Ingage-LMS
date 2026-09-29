"use client";
import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Lock,
  FastForward,
  BookOpen,
  Target,
  Code2,
  FileQuestion,
  Database,
  Briefcase,
  Check
} from 'lucide-react';

interface LearningPlayerPageProps {
  roleId?: string;
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (msg: string) => void;
}

type StepType = 'video' | 'quiz' | 'ide' | 'dataset' | 'project';

interface FlowStep {
  id: StepType;
  stepNumber: number;
  title: string;
  duration: string;
  isUnlocked: boolean;
  isCompleted: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export function LearningPlayerPage({ roleId = 'data-analyst', onNavigate, onShowToast }: LearningPlayerPageProps) {
  const [activeStep, setActiveStep] = useState<StepType>('video');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progressSeconds, setProgressSeconds] = useState<number>(0);
  const totalSeconds = 945; // 15:45

  // 10 Interactive Quiz Questions (Exact Match to Screenshot: "Question 1 of 10: What is Python?")
  const quizQuestions: QuizQuestion[] = [
    {
      question: 'What is Python?',
      options: [
        'A high-level programming language',
        'A type of snake',
        'A database system',
        'A web framework'
      ],
      correctIndex: 0
    },
    {
      question: 'Which function is used to output text to the console in Python?',
      options: ['print()', 'console.log()', 'echo()', 'System.out.println()'],
      correctIndex: 0
    },
    {
      question: 'Which character is used to indicate a single-line comment in Python?',
      options: ['#', '//', '/*', '<!--'],
      correctIndex: 0
    },
    {
      question: 'What is the correct file extension for Python script files?',
      options: ['.py', '.python', '.pt', '.pys'],
      correctIndex: 0
    },
    {
      question: 'Which keyword is used to define a function in Python?',
      options: ['def', 'function', 'func', 'define'],
      correctIndex: 0
    },
    {
      question: 'How do you insert an element at the end of a list in Python?',
      options: ['.append()', '.add()', '.push()', '.insert_last()'],
      correctIndex: 0
    },
    {
      question: 'What will len("Ingage") evaluate to in Python?',
      options: ['6', '5', '7', 'Undefined'],
      correctIndex: 0
    },
    {
      question: 'Which operator is used for exponentiation (power calculation) in Python?',
      options: ['**', '^', '^^', 'pow()'],
      correctIndex: 0
    },
    {
      question: 'Which data structure is ordered, mutable, and indexed by sequential integers?',
      options: ['List', 'Tuple', 'Set', 'Dictionary'],
      correctIndex: 0
    },
    {
      question: 'Which capitalization is correct for the boolean truth literal in Python?',
      options: ['True', 'true', 'TRUE', 'True()'],
      correctIndex: 0
    }
  ];

  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState<number>(0);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});

  // Steps Flow
  const [steps, setSteps] = useState<FlowStep[]>([
    {
      id: 'video',
      stepNumber: 1,
      title: 'Video Lesson',
      duration: '15 minutes',
      isUnlocked: true,
      isCompleted: false
    },
    {
      id: 'quiz',
      stepNumber: 2,
      title: 'Knowledge Quiz',
      duration: '10 minutes',
      isUnlocked: false,
      isCompleted: false
    },
    {
      id: 'ide',
      stepNumber: 3,
      title: 'IDE Practice',
      duration: '30 minutes',
      isUnlocked: false,
      isCompleted: false
    },
    {
      id: 'dataset',
      stepNumber: 4,
      title: 'Dataset Tasks',
      duration: '25 minutes',
      isUnlocked: false,
      isCompleted: false
    },
    {
      id: 'project',
      stepNumber: 5,
      title: 'Build Projects',
      duration: '60 minutes',
      isUnlocked: false,
      isCompleted: false
    }
  ]);

  // IDE State
  const [userCode, setUserCode] = useState<string>(
    '# Write your first Python program here\nprint("Hello, Ingage LMS!")\n\nname = "Data Scholar"\nprint(f"Welcome, {name}!")'
  );
  const [ideOutput, setIdeOutput] = useState<string>('');

  // Video Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgressSeconds((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const overallProgressPercentage = Math.round((completedCount / steps.length) * 100);

  // Complete & Continue to Next Step
  const handleCompleteAndContinue = () => {
    const currentIndex = steps.findIndex((s) => s.id === activeStep);
    
    setSteps((prev) =>
      prev.map((s, idx) => {
        if (idx === currentIndex) {
          return { ...s, isCompleted: true };
        }
        if (idx === currentIndex + 1) {
          return { ...s, isUnlocked: true };
        }
        return s;
      })
    );

    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1].id;
      setActiveStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (onShowToast) {
        onShowToast(`Completed ${steps[currentIndex].title}! Unlocked ${steps[currentIndex + 1].title}.`);
      }
    } else {
      if (onShowToast) {
        onShowToast('🎉 Congratulations! You completed all 5 steps in this lesson module.');
      }
    }
  };

  // Previous Step handler (Exact Match to Screenshot: "< Previous Step")
  const handlePreviousStep = () => {
    const currentIndex = steps.findIndex((s) => s.id === activeStep);
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigate('/my-projects');
    }
  };

  // Next Step top button
  const handleNextStepClick = () => {
    const currentIndex = steps.findIndex((s) => s.id === activeStep);
    if (currentIndex < steps.length - 1 && steps[currentIndex + 1].isUnlocked) {
      setActiveStep(steps[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleCompleteAndContinue();
    }
  };

  const runCode = () => {
    setIdeOutput('Executing Python 3.12 sandbox...\n> Hello, Ingage LMS!\n> Welcome, Data Scholar!\n[Process completed successfully with exit code 0]');
  };

  const currentStepData = steps.find((s) => s.id === activeStep) || steps[0];
  const currentStepIndex = steps.findIndex((s) => s.id === activeStep);
  const currentQ = quizQuestions[currentQuizQuestionIndex];
  const isStep1Initial = currentStepIndex === 0 && !steps[0].isCompleted && progressSeconds === 0;

  return (
    <div className="w-full bg-[#fafbfa] text-gray-900">
      {/* Scrollable Content Container */}
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-4 pb-4">
        
        {/* Top Subheader Breadcrumb & Step Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          {/* Left Breadcrumb */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <button
              id="player-back-to-dashboard-btn"
              onClick={() => onNavigate('/my-projects')}
              className="inline-flex items-center gap-1 font-bold text-gray-700 hover:text-[#8DB600] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <span className="text-gray-300 font-light">|</span>
            <span className="text-gray-500 font-medium truncate">
              Introduction to Python
            </span>
          </div>

          {/* Right Step Indicator & Next Step Button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap self-start sm:self-auto">
            <span className="text-xs text-gray-500 font-medium">
              Step {currentStepData.stepNumber} of {steps.length}
            </span>

            {/* Pill: Active Step Title */}
            <span className="px-3 py-1 rounded-full bg-[#2563eb] text-white text-[11px] sm:text-xs font-bold tracking-wide shadow-xs">
              {currentStepData.title}
            </span>

            {/* Next Step Button */}
            <button
              onClick={handleNextStepClick}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563eb] font-bold text-xs transition-colors cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5 fill-[#2563eb]" />
              <span>Next Step</span>
            </button>
          </div>
        </div>

        {/* Lesson Title */}
        <div className="mt-4 mb-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Your First Python Program
          </h1>
        </div>

        {/* Full-width Progress Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-2 bg-gray-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8DB600] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallProgressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-700 shrink-0">
            {overallProgressPercentage}%
          </span>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (8 cols): Primary Step Content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* STEP 1: Video Lesson (Exact Match to Screenshot 1) */}
            {activeStep === 'video' && (
              <div className="space-y-6">
                {/* 16:9 Video Box */}
                <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative shadow-md flex flex-col justify-between group">
                  <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                  {/* Center Play Button & Title */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
                    <button
                      id="video-play-center-btn"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/90 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg mb-3"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white" />
                      ) : (
                        <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white ml-1" />
                      )}
                    </button>
                    <p className="text-white text-sm sm:text-base font-semibold drop-shadow-md">
                      Python Programming Tutorial
                    </p>
                  </div>

                  {/* Bottom Video Controls Bar */}
                  <div className="bg-[#10141a]/95 backdrop-blur-xs border-t border-white/10 px-4 py-3 flex items-center justify-between text-xs text-white select-none">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="hover:text-[#8DB600] transition-colors cursor-pointer"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>

                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="hover:text-[#8DB600] transition-colors cursor-pointer"
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-white" />
                        )}
                      </button>

                      <span className="font-mono text-[11px] text-gray-300">
                        {formatTime(progressSeconds)} / {formatTime(totalSeconds)}
                      </span>
                    </div>

                    <div className="hidden sm:block flex-1 mx-6">
                      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden cursor-pointer">
                        <div
                          className="h-full bg-[#8DB600] rounded-full"
                          style={{ width: `${(progressSeconds / totalSeconds) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-300">
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono">1080p</span>
                      <button
                        onClick={() => {
                          if (onShowToast) onShowToast('Toggled fullscreen mode');
                        }}
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Knowledge Quiz (Exact Match to Screenshot 2 & Latest Screenshot) */}
            {activeStep === 'quiz' && (
              <div className="space-y-6">
                {/* Light Blue Question Container Card */}
                <div className="bg-[#f0f6ff] border border-blue-100/90 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
                  {/* Question Header: Question 1 of 10: What is Python? */}
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                    Question {currentQuizQuestionIndex + 1} of {quizQuestions.length}: {currentQ.question}
                  </h2>

                  {/* Options List (Clean white cards matching Screenshot) */}
                  <div className="space-y-3">
                    {currentQ.options.map((option, optIdx) => {
                      const isSelected = selectedQuizAnswers[currentQuizQuestionIndex] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => {
                            setSelectedQuizAnswers((prev) => ({
                              ...prev,
                              [currentQuizQuestionIndex]: optIdx
                            }));
                          }}
                          className={`w-full text-left p-4 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer border ${
                            isSelected
                              ? 'bg-white border-2 border-[#8DB600] text-gray-900 font-bold shadow-xs'
                              : 'bg-white border-gray-200/90 hover:border-blue-300 text-gray-800'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mini Question Scroller */}
                  <div className="flex items-center justify-between pt-3 border-t border-blue-200/50 text-xs text-gray-500">
                    <button
                      disabled={currentQuizQuestionIndex === 0}
                      onClick={() => setCurrentQuizQuestionIndex((prev) => Math.max(0, prev - 1))}
                      className="text-blue-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:underline cursor-pointer"
                    >
                      ← Previous Question
                    </button>
                    <span>
                      {Object.keys(selectedQuizAnswers).length} of {quizQuestions.length} answered
                    </span>
                    <button
                      disabled={currentQuizQuestionIndex === quizQuestions.length - 1}
                      onClick={() => setCurrentQuizQuestionIndex((prev) => Math.min(quizQuestions.length - 1, prev + 1))}
                      className="text-blue-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:underline cursor-pointer"
                    >
                      Next Question →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: IDE Practice */}
            {activeStep === 'ide' && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-[#8DB600]" />
                    <h2 className="text-base font-bold text-gray-900">Interactive IDE Practice</h2>
                  </div>
                  <button
                    onClick={runCode}
                    className="px-4 py-1.5 rounded-lg bg-[#8DB600] hover:bg-[#7ca300] text-white font-bold text-xs cursor-pointer"
                  >
                    ▶ Run Code
                  </button>
                </div>

                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  rows={8}
                  className="w-full font-mono text-xs bg-gray-900 text-green-400 p-4 rounded-xl border border-gray-800 focus:outline-hidden"
                />

                {ideOutput && (
                  <div className="bg-gray-950 text-gray-200 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap border border-gray-800">
                    {ideOutput}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Dataset Tasks */}
            {activeStep === 'dataset' && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  <h2 className="text-base font-bold text-gray-900">Dataset Tasks: Patient Health Log Analysis</h2>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Perform exploratory data transformations on patient vital signs dataset (`heart_rate`, `systolic_bp`, `glucose_level`).
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs font-mono text-gray-700">
                  {`import pandas as pd\ndf = pd.read_csv('patient_vitals_2026.csv')\nprint(df.describe())`}
                </div>
              </div>
            )}

            {/* STEP 5: Build Projects */}
            {activeStep === 'project' && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-bold text-gray-900">Build Project: Patient Health Tracker</h2>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Combine the local storage cache, responsive table rendering, and vital threshold alerts into your final milestone submission.
                </p>
                <div className="p-4 rounded-xl bg-lime-50 border border-lime-200 text-xs text-gray-800">
                  ✅ All unit tests passing! Milestone ready for mentor code review.
                </div>
              </div>
            )}

          </div>

          {/* Right Column (4 cols): Learning Flow */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Learning Flow Section */}
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Learning Flow
              </h2>

              <div className="space-y-2.5">
                {steps.map((step) => {
                  const isActive = activeStep === step.id;
                  const isLocked = !step.isUnlocked && !step.isCompleted;

                  return (
                    <div
                      key={step.id}
                      onClick={() => {
                        if (step.isUnlocked || step.isCompleted) {
                          setActiveStep(step.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else if (onShowToast) {
                          onShowToast(`Step ${step.stepNumber} is locked. Complete preceding steps to unlock.`);
                        }
                      }}
                      className={`rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#f7fcee] border-2 border-[#8DB600] shadow-xs'
                          : 'bg-white border border-gray-200/80 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Circle Badge */}
                        {step.id === 'video' ? (
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            1
                          </div>
                        ) : step.isCompleted ? (
                          <div className="w-8 h-8 rounded-full bg-[#8DB600] text-white flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div>
                          <div className={`text-xs sm:text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-800'}`}>
                            {step.title}
                          </div>
                          <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {step.duration}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* About This Lesson Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8DB600]" />
                <h3 className="text-sm font-bold text-gray-900">
                  About This Lesson
                </h3>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Learn how to write and execute your first Python program. We will cover basic syntax, the print function, and how to run Python code.
              </p>

              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 mb-2">
                  Learning Objectives
                </h4>
                <ul className="space-y-2 text-xs text-gray-600">
                  <li className="flex items-start gap-2">
                    <Target className="w-3.5 h-3.5 text-[#8DB600] shrink-0 mt-0.5" />
                    <span>Understand Python syntax basics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-3.5 h-3.5 text-[#8DB600] shrink-0 mt-0.5" />
                    <span>Write your first print statement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-3.5 h-3.5 text-[#8DB600] shrink-0 mt-0.5" />
                    <span>Execute Python code successfully</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Module Lessons Section */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8DB600]" />
                <h3 className="text-sm font-bold text-gray-900">
                  Module Lessons
                </h3>
              </div>

              <div className="space-y-2 text-xs text-gray-600 font-medium">
                <div className="p-2.5 rounded-xl bg-lime-50/70 border border-lime-200/60 text-gray-900 font-bold flex items-center justify-between">
                  <span>1. Your First Python Program</span>
                  <span className="text-[10px] text-[#8DB600]">Current</span>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-between text-gray-500">
                  <span>2. Variables & Data Types</span>
                  <Lock className="w-3 h-3 text-gray-400" />
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-between text-gray-500">
                  <span>3. Working with Local Storage</span>
                  <Lock className="w-3 h-3 text-gray-400" />
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-between text-gray-500">
                  <span>4. Healthcare Data Serialization</span>
                  <Lock className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3 px-4 sm:px-8 lg:px-12 xl:px-16 shadow-xs">
        <div className="w-full flex items-center justify-between relative">
          
          {/* Left: Previous Step Button (Only displayed from Step 2 onwards, hidden on Step 1) */}
          {currentStepIndex > 0 ? (
            <button
              id="sticky-previous-step-btn"
              onClick={handlePreviousStep}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
              <span>Previous Step</span>
            </button>
          ) : (
            <div className="w-28 sm:w-36 invisible" />
          )}

          {/* Center: Complete & Continue Button (Exact Match to Screenshot 1 & Screenshot 2) */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <button
              id="sticky-complete-and-continue-btn"
              onClick={handleCompleteAndContinue}
              className={`inline-flex items-center gap-1.5 px-8 sm:px-10 py-2.5 sm:py-3 rounded-xl ${
                isStep1Initial
                  ? 'bg-[#94a3b8] hover:bg-[#8594a6] text-white'
                  : 'bg-[#8DB600] hover:bg-[#7ca300] text-white'
              } font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-95 whitespace-nowrap`}
            >
              <span>Complete & Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right invisible spacer to balance the layout */}
          <div className="w-24 sm:w-32 hidden sm:block" />

        </div>
      </div>
    </div>
  );
}

export default LearningPlayerPage;

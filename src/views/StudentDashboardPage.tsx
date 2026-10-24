"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { StudentSidebar } from "@/components/dashboard/StudentSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import {
  MyLearningDashboardSection,
  EnrolledCourseItem,
} from "@/components/dashboard/MyLearningDashboardSection";
import {
  UpcomingLiveClassesCard,
  LiveClassCardItem,
} from "@/components/dashboard/UpcomingLiveClassesCard";
import {
  LearningGoalsCard,
  LearningGoalsData,
} from "@/components/dashboard/LearningGoalsCard";
import {
  CertificateEligibilityCard,
  CertificateEligibilityData,
} from "@/components/dashboard/CertificateEligibilityCard";
import { RecentActivityCard, ActivityItem } from "@/components/dashboard/RecentActivityCard";
import { KeepGoingCard } from "@/components/dashboard/KeepGoingCard";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isAuthLoading, logout, openAuthModal } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  const [dashboardData, setDashboardData] = useState<{
    stats: {
      enrolledCourses: number;
      completedLessons: number;
      totalLessons: number;
      pendingAssignments: number;
      certificatesEarned: number;
    };
    enrollments: EnrolledCourseItem[];
    upcomingLiveClasses: LiveClassCardItem[];
    learningGoals: LearningGoalsData;
    certificateEligibility: CertificateEligibilityData;
    recentActivity: ActivityItem[];
  }>({
    stats: {
      enrolledCourses: 3,
      completedLessons: 5,
      totalLessons: 28,
      pendingAssignments: 2,
      certificatesEarned: 0,
    },
    enrollments: [],
    upcomingLiveClasses: [],
    learningGoals: {
      completed: 1,
      total: 3,
      message: "Complete 3 more courses to earn your next certificate!",
      checklist: [
        { title: "Finish Web Development Basics", isCompleted: true },
        { title: "Complete Python Programming", isCompleted: false },
        { title: "Complete AWS Cloud Computing", isCompleted: false },
      ],
    },
    certificateEligibility: {
      percentage: 25,
      message: "Complete 2 more courses and 1 assignment to become eligible for your certificate.",
      isEligible: false,
    },
    recentActivity: [],
  });

  // Check auth & redirect if unauthenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      openAuthModal("login", "/dashboard");
    }
  }, [isAuthenticated, isAuthLoading, openAuthModal]);

  // Fetch dashboard data
  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setDashboardData({
              stats: data.stats || dashboardData.stats,
              enrollments: data.enrollments || [],
              upcomingLiveClasses: data.upcomingLiveClasses || [],
              learningGoals: data.learningGoals || dashboardData.learningGoals,
              certificateEligibility: data.certificateEligibility || dashboardData.certificateEligibility,
              recentActivity: data.recentActivity || [],
            });
          }
        }
      } catch (err) {
        console.error("Failed to load student dashboard:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (isAuthenticated) {
      loadDashboard();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Filter courses if search is entered
  const filteredCourses = React.useMemo(() => {
    if (!searchFilter.trim()) return dashboardData.enrollments;
    const q = searchFilter.toLowerCase().trim();
    return dashboardData.enrollments.filter(
      (c) =>
        c.courseTitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q)
    );
  }, [dashboardData.enrollments, searchFilter]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* 1. Left Student Sidebar */}
      <StudentSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <DashboardHeader
          currentUser={currentUser}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onLogout={handleLogout}
          onSearch={(q) => setSearchFilter(q)}
        />

        {/* Dashboard Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          {/* Welcome Banner */}
          <WelcomeBanner
            userName={
              currentUser?.name || (currentUser as any)?.full_name || currentUser?.email?.split('@')[0] || "Student"
            }
          />

          {/* 2-Column Responsive Workspace matching Reference Image */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Primary Section (approx 8 of 12 columns) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Statistics Cards */}
              <DashboardStatsCards stats={dashboardData.stats} />

              {/* My Learning Section */}
              <MyLearningDashboardSection courses={filteredCourses} />

              {/* Recent Activity */}
              <RecentActivityCard activities={dashboardData.recentActivity} />
            </div>

            {/* Right Information Column (approx 4 of 12 columns) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Upcoming Live Classes */}
              <UpcomingLiveClassesCard classes={dashboardData.upcomingLiveClasses} />

              {/* Learning Goals */}
              <LearningGoalsCard data={dashboardData.learningGoals} />

              {/* Certificate Eligibility */}
              <CertificateEligibilityCard data={dashboardData.certificateEligibility} />

              {/* Keep Going! Motivational Banner */}
              <KeepGoingCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

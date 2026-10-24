"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Share2,
  Plus,
  Send,
  Sparkles,
  Flame,
  Hash,
  TrendingUp,
  Award,
  CheckCircle2,
  X,
  Search,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { useAuth } from "@/context/AuthContext";
import {
  getCommunityPosts,
  getLikedPostIds,
  togglePostLike,
  createCommunityPost,
  CommunityPost,
} from "@/api/communityApi";

const CATEGORIES = [
  "All",
  "General",
  "Announcements",
  "Development",
  "AI & ML",
  "Projects",
  "Career",
  "Job Opportunities",
];

const TRENDING_TOPICS = [
  { tag: "#React19", posts: "42 discussions" },
  { tag: "#Nextjs16", posts: "38 discussions" },
  { tag: "#SystemDesign", posts: "29 discussions" },
  { tag: "#LangGraph", posts: "21 discussions" },
  { tag: "#JobHiring", posts: "19 discussions" },
];

const ACTIVE_MEMBERS = [
  { name: "Ananya Sharma", role: "Top Contributor", points: "1,240 XP" },
  { name: "Rahul Verma", role: "Mentor", points: "3,890 XP" },
  { name: "Karthik R.", role: "Full-Stack Dev", points: "890 XP" },
  { name: "Devika Nair", role: "AI Enthusiast", points: "760 XP" },
];

export default function CommunityPage() {
  const { currentUser } = useAuth();
  const studentName =
    currentUser?.name ||
    (currentUser as any)?.full_name ||
    (currentUser?.email ? currentUser.email.split("@")[0] : "Student");

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Create post modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Development");
  const [newTags, setNewTags] = useState("");

  useEffect(() => {
    setPosts(getCommunityPosts());
    setLikedIds(getLikedPostIds());
  }, []);

  const handleLike = (id: string) => {
    togglePostLike(id);
    setPosts(getCommunityPosts());
    setLikedIds(getLikedPostIds());
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    createCommunityPost({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      authorName: studentName,
      authorRole: "Student",
      tags: newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setPosts(getCommunityPosts());
    setNewTitle("");
    setNewContent("");
    setNewTags("");
    setIsCreateModalOpen(false);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCat =
      selectedCategory === "All" ||
      post.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  return (
    <StudentLayout activePath="/community">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              InGage Student Community
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Connect with fellow students, exchange architectural code reviews, and collaborate on projects.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Discussion Post</span>
          </button>
        </div>

        {/* 3-Column Community Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ==================================================
              LEFT: CATEGORIES
              ================================================== */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Discussion Channels</h3>
              <nav className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Hash className={`w-3.5 h-3.5 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                        <span>{cat}</span>
                      </span>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* ==================================================
              MIDDLE: FEED & POSTS
              ================================================== */}
          <div className="lg:col-span-6 space-y-4">
            {/* Quick Share Box */}
            <div
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex items-center gap-3 cursor-pointer hover:border-emerald-300 transition"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                {studentName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 text-xs text-slate-400 font-medium">
                Ask a question, share a milestone, or start a tech discussion...
              </div>
              <button className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition">
                Post
              </button>
            </div>

            {/* Posts List */}
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <p className="font-bold text-slate-700 text-sm">No discussions in this channel yet.</p>
                <p className="text-xs text-slate-400">Be the first student to start the conversation!</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Write Post
                </button>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const isLiked = likedIds.includes(post.id);

                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition space-y-4"
                  >
                    {/* Author & Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {post.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">
                            {post.authorName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {post.authorRole} • {post.createdAt}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {post.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <Link href={`/community/${post.id}`} className="block group">
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md"
                          >
                            #{t.replace(/^#/, "")}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 transition cursor-pointer ${
                          isLiked ? "text-emerald-600 font-bold" : "hover:text-slate-900"
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-emerald-600 text-emerald-600" : ""}`} />
                        <span>{post.likes} Likes</span>
                      </button>

                      <Link
                        href={`/community/${post.id}`}
                        className="flex items-center gap-1.5 hover:text-slate-900 transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.commentsCount || post.comments?.length || 0} Comments</span>
                      </Link>

                      <button
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(window.location.origin + `/community/${post.id}`);
                            alert("Link copied to clipboard!");
                          }
                        }}
                        className="flex items-center gap-1.5 hover:text-slate-900 transition ml-auto cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ==================================================
              RIGHT: TRENDING & ACTIVE MEMBERS
              ================================================== */}
          <div className="lg:col-span-3 space-y-6">
            {/* Trending */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Trending Topics</span>
              </div>
              <div className="space-y-2">
                {TRENDING_TOPICS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-800">{item.tag}</span>
                    <span className="text-[11px] text-slate-400">{item.posts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Members */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Active Peers &amp; Mentors</span>
              </div>
              <div className="space-y-2.5">
                {ACTIVE_MEMBERS.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{m.name}</p>
                        <p className="text-[10px] text-slate-400">{m.role}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {m.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Create Post Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">Create Discussion Post</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Channel / Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Post Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. How to structure Prisma relational joins efficiently"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discussion Details *</label>
                  <textarea
                    required
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Describe your technical question, project discovery, or code pattern..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g. Next.js, TypeScript, PostgreSQL"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                  >
                    Publish Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

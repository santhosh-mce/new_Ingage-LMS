"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Share2,
  Send,
  User,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { useAuth } from "@/context/AuthContext";
import {
  getCommunityPostById,
  getLikedPostIds,
  togglePostLike,
  addCommentToPost,
  CommunityPost,
} from "@/api/communityApi";

export default function CommunityPostDetailPage() {
  const params = useParams();
  const postId = params?.postId as string;
  const { currentUser } = useAuth();
  const studentName =
    currentUser?.name ||
    (currentUser as any)?.full_name ||
    (currentUser?.email ? currentUser.email.split("@")[0] : "Student");

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (postId) {
      setPost(getCommunityPostById(postId));
      setLikedIds(getLikedPostIds());
    }
  }, [postId]);

  const handleLike = () => {
    if (!post) return;
    togglePostLike(post.id);
    setPost(getCommunityPostById(post.id));
    setLikedIds(getLikedPostIds());
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;

    addCommentToPost(post.id, {
      authorName: studentName,
      authorRole: "Student",
      content: commentText.trim(),
    });

    setCommentText("");
    setPost(getCommunityPostById(post.id));
  };

  if (!post) {
    return (
      <StudentLayout activePath="/community">
        <div className="p-12 text-center space-y-4">
          <p className="text-sm font-bold text-slate-600">Discussion post not found.</p>
          <Link
            href="/community"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold inline-block"
          >
            Back to Community
          </Link>
        </div>
      </StudentLayout>
    );
  }

  const isLiked = likedIds.includes(post.id);

  return (
    <StudentLayout activePath="/community">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Discussions</span>
        </Link>

        {/* Post Container */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Author Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold text-base shadow-xs">
                {post.authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {post.authorName}
                </h4>
                <p className="text-xs text-slate-400">
                  {post.authorRole} • Posted {post.createdAt}
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {post.category}
            </span>
          </div>

          {/* Title & Body */}
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {post.title}
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {post.content}
            </p>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg"
                >
                  #{t.replace(/^#/, "")}
                </span>
              ))}
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition cursor-pointer ${
                isLiked ? "text-emerald-600 font-bold" : "hover:text-slate-900"
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-emerald-600 text-emerald-600" : ""}`} />
              <span>{post.likes} Likes</span>
            </button>

            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>{post.comments?.length || 0} Comments</span>
            </span>

            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Post link copied to clipboard!");
                }
              }}
              className="flex items-center gap-1.5 hover:text-slate-900 transition ml-auto cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Discussion</span>
            </button>
          </div>
        </div>

        {/* Comment Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <h3 className="font-extrabold text-slate-900 text-base">
            Comments &amp; Peer Answers ({post.comments?.length || 0})
          </h3>

          {/* New Comment Box */}
          <form onSubmit={handleAddComment} className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a constructive response or peer answer..."
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </div>
          </form>

          {/* Comment Thread */}
          <div className="space-y-4 pt-4 divide-y divide-slate-100">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((c) => (
                <div key={c.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {c.authorName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{c.authorName}</p>
                        <p className="text-[10px] text-slate-400">
                          {c.authorRole} • {c.createdAt}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 pl-10 leading-relaxed whitespace-pre-line">
                    {c.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                No replies yet. Be the first to share insights!
              </p>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

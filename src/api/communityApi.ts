"use client";

export interface CommunityComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  createdAt: string;
  content: string;
  likes: number;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  createdAt: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  likes: number;
  commentsCount: number;
  comments: CommunityComment[];
}

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    authorName: "Ananya Sharma",
    authorRole: "Full-Stack Track",
    createdAt: "2 hours ago",
    title: "How I optimized my Next.js 16 app load time by 60% with Server Components",
    content:
      "Hey everyone! Just finished Milestone 3 project. Moving our data-fetching tree from client useEffect calls to streaming React Server Components dropped our bundle size and improved First Contentful Paint drastically. Here are the 3 major lessons I learned...",
    category: "Development",
    tags: ["Next.js", "React 19", "Web Performance"],
    likes: 24,
    commentsCount: 6,
    comments: [
      {
        id: "c-1",
        authorName: "Karthik R.",
        authorRole: "Student",
        createdAt: "1 hour ago",
        content: "Awesome writeup Ananya! Did you encounter any issues with auth cookies in Server Actions?",
        likes: 3,
      },
      {
        id: "c-2",
        authorName: "Ananya Sharma",
        authorRole: "Full-Stack Track",
        createdAt: "30 mins ago",
        content: "Great question! Using next/headers cookies() in server actions worked seamlessly once we configured the JWT httpOnly flag correctly.",
        likes: 5,
      },
    ],
  },
  {
    id: "post-2",
    authorName: "InGage Academic Team",
    authorRole: "Staff Instructor",
    createdAt: "Yesterday",
    title: "Official Announcement: Hackathon 2026 Registration is Now Open!",
    content:
      "We are thrilled to announce our upcoming 48-Hour Fall Hackathon! Form teams of 2 to 4 students, build an impactful open-source AI or Cloud application, and present live before our hiring partners.",
    category: "Announcements",
    tags: ["Hackathon", "Prizes", "Careers"],
    likes: 89,
    commentsCount: 14,
    comments: [
      {
        id: "c-3",
        authorName: "Devika Nair",
        authorRole: "AI Track",
        createdAt: "18 hours ago",
        content: "Looking for 2 teammates focused on FastAPI and LangGraph! Message me if interested.",
        likes: 7,
      },
    ],
  },
  {
    id: "post-3",
    authorName: "Rohan Mukherjee",
    authorRole: "Cloud & DevOps Track",
    createdAt: "2 days ago",
    title: "Passed the AWS Solutions Architect Associate exam! Here is my study guide",
    content:
      "Huge shoutout to the InGage cloud modules! The hands-on labs with VPC peering, IAM policies, and RDS multi-AZ failover testing were identical to real scenario questions on the exam.",
    category: "Career",
    tags: ["AWS", "Certification", "StudyGuide"],
    likes: 45,
    commentsCount: 9,
    comments: [],
  },
];

const COMMUNITY_STORAGE_KEY = "ingage_community_posts_v1";
const LIKED_POSTS_KEY = "ingage_liked_posts_v1";

export function getCommunityPosts(): CommunityPost[] {
  if (typeof window === "undefined") return INITIAL_POSTS;
  try {
    const saved = localStorage.getItem(COMMUNITY_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
      return INITIAL_POSTS;
    }
    return JSON.parse(saved);
  } catch {
    return INITIAL_POSTS;
  }
}

export function getCommunityPostById(id: string): CommunityPost | null {
  const posts = getCommunityPosts();
  return posts.find((p) => p.id === id) || null;
}

export function getLikedPostIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LIKED_POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function togglePostLike(id: string): { isLiked: boolean; newCount: number } {
  if (typeof window === "undefined") return { isLiked: false, newCount: 0 };
  try {
    const liked = getLikedPostIds();
    const posts = getCommunityPosts();
    const postIdx = posts.findIndex((p) => p.id === id);
    if (postIdx === -1) return { isLiked: false, newCount: 0 };

    let isLiked = false;
    let newCount = posts[postIdx].likes;

    if (liked.includes(id)) {
      const updatedLiked = liked.filter((x) => x !== id);
      localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(updatedLiked));
      newCount = Math.max(0, newCount - 1);
      isLiked = false;
    } else {
      const updatedLiked = [...liked, id];
      localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(updatedLiked));
      newCount += 1;
      isLiked = true;
    }

    posts[postIdx].likes = newCount;
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(posts));
    return { isLiked, newCount };
  } catch {
    return { isLiked: false, newCount: 0 };
  }
}

export function createCommunityPost(data: {
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorRole?: string;
  tags?: string[];
}): CommunityPost {
  const posts = getCommunityPosts();
  const newPost: CommunityPost = {
    id: `post-${Date.now()}`,
    authorName: data.authorName || "Student",
    authorRole: data.authorRole || "Learner",
    createdAt: "Just now",
    title: data.title,
    content: data.content,
    category: data.category || "General",
    tags: data.tags || ["General"],
    likes: 1,
    commentsCount: 0,
    comments: [],
  };

  const updated = [newPost, ...posts];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }
  return newPost;
}

export function addCommentToPost(postId: string, comment: {
  authorName: string;
  authorRole?: string;
  content: string;
}): CommunityComment | null {
  const posts = getCommunityPosts();
  const postIdx = posts.findIndex((p) => p.id === postId);
  if (postIdx === -1) return null;

  const newComment: CommunityComment = {
    id: `c-${Date.now()}`,
    authorName: comment.authorName || "Student",
    authorRole: comment.authorRole || "Student",
    createdAt: "Just now",
    content: comment.content,
    likes: 0,
  };

  posts[postIdx].comments = [...(posts[postIdx].comments || []), newComment];
  posts[postIdx].commentsCount = posts[postIdx].comments.length;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(posts));
    } catch {}
  }
  return newComment;
}

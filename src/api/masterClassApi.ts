"use client";

export interface MasterClassItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  instructor: string;
  instructorDesignation: string;
  instructorBio: string;
  date: string;
  time: string;
  duration: string;
  description: string;
  longDescription: string;
  status: "Upcoming" | "Live Now" | "Completed";
  meetingUrl?: string;
  recordingUrl?: string;
  registeredCount: number;
  agenda: Array<{ time: string; topic: string }>;
  learningOutcomes: string[];
}

export const MASTER_CLASSES_DATA: MasterClassItem[] = [
  {
    id: "system-design-microservices",
    title: "High-Scale System Design: Zero to 10M Concurrent Users",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    instructor: "Rahul Verma",
    instructorDesignation: "Staff Infrastructure Architect, ex-Uber",
    instructorBio:
      "Rahul has scaled distributed database backends and edge cache hierarchies supporting tens of millions of concurrent requests globally.",
    date: "October 18, 2026",
    time: "6:00 PM - 8:30 PM IST",
    duration: "2.5 Hours",
    description:
      "Deep dive into real-world caching strategies, database partitioning, event-driven message brokers, and failure resilience.",
    longDescription:
      "Explore real architectural blueprints for high-throughput payment gateways and ride-dispatch state machines. You will see live telemetry walkthroughs and load testing demonstrations.",
    status: "Upcoming",
    meetingUrl: "https://meet.google.com/ingage-masterclass-sys",
    registeredCount: 420,
    agenda: [
      { time: "6:00 PM", topic: "Intro to Distributed Bottlenecks & Backpressure" },
      { time: "6:45 PM", topic: "Database Sharding vs Read Replicas vs Distributed SQL" },
      { time: "7:30 PM", topic: "Event-Driven Microservices with Kafka & Dead-Letter Queues" },
      { time: "8:00 PM", topic: "Live Q&A and Architecture Reviews" },
    ],
    learningOutcomes: [
      "Diagnose latency spikes and connection pool starvation",
      "Design consistent hashing rings and multi-region read replicas",
      "Model idempotency in payment processing architectures",
      "Structure high-concurrency systems to withstand partial network partitions",
    ],
  },
  {
    id: "generative-ai-production",
    title: "Building Real-Time GenAI Applications with RAG & Vector Databases",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    instructor: "Dr. Arvind Ramesh",
    instructorDesignation: "Principal AI Research Engineer",
    instructorBio:
      "Pioneer in retrieval-augmented generation architectures and production LLM evaluation frameworks.",
    date: "Today",
    time: "7:00 PM - 9:00 PM IST",
    duration: "2 Hours",
    description:
      "Hands-on workshop building hybrid semantic search, chunking strategies, and low-latency rerankers.",
    longDescription:
      "Learn how to build production-grade Retrieval-Augmented Generation (RAG) pipelines that don't hallucinate. We will build, benchmark, and deploy a vector search service.",
    status: "Live Now",
    meetingUrl: "https://meet.google.com/ingage-genai-live",
    registeredCount: 680,
    agenda: [
      { time: "7:00 PM", topic: "RAG Foundations & Where Naive Embeddings Fail" },
      { time: "7:35 PM", topic: "Hybrid BM25 + Dense Vector Search & Reciprocal Rank Fusion" },
      { time: "8:15 PM", topic: "Context Window Compression and Prompt Optimization" },
      { time: "8:45 PM", topic: "Live Interactive Coding Demo" },
    ],
    learningOutcomes: [
      "Implement parent-document and recursive sentence chunking",
      "Integrate PGVector and Pinecone with low-latency indexing",
      "Measure retrieval precision with RAGAS metrics",
      "Deploy guardrails against prompt injection and hallucination",
    ],
  },
  {
    id: "web-security-threat-modeling",
    title: "Modern Web Application Security & Offensive Threat Modeling",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
    instructor: "Priya Sundaram",
    instructorDesignation: "Chief Information Security Officer",
    instructorBio:
      "15+ years leading Red Team audits, zero-day vulnerability disclosures, and cloud perimeter defense.",
    date: "September 28, 2026",
    time: "5:00 PM - 7:30 PM IST",
    duration: "2.5 Hours",
    description:
      "Understand modern attack vectors including SSRF, OAuth misuse, token theft, and dependency chain poisoning.",
    longDescription:
      "A complete breakdown of real CVEs that compromised modern enterprise SaaS platforms, accompanied by secure-by-default coding patterns.",
    status: "Completed",
    recordingUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    registeredCount: 540,
    agenda: [
      { time: "5:00 PM", topic: "OWASP Top 10 API Security Deep Dive" },
      { time: "5:45 PM", topic: "JWT & OAuth2 Common Vulnerabilities" },
      { time: "6:30 PM", topic: "Supply Chain Attacks & Automated Dependency Auditing" },
      { time: "7:10 PM", topic: "Defensive Hardening Checklist" },
    ],
    learningOutcomes: [
      "Prevent server-side request forgery (SSRF) in cloud environments",
      "Correctly validate and sign JWT tokens with asymmetric keys",
      "Set up automated Software Bill of Materials (SBOM) scanning",
      "Audit cloud IAM role permissions for principle of least privilege",
    ],
  },
];

const MASTERCLASS_REG_KEY = "ingage_registered_masterclass_ids";

export function getMasterClasses(): MasterClassItem[] {
  return MASTER_CLASSES_DATA;
}

export function getMasterClassById(id: string): MasterClassItem | null {
  return MASTER_CLASSES_DATA.find((m) => m.id === id) || null;
}

export function getRegisteredMasterClassIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MASTERCLASS_REG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleMasterClassRegistration(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getRegisteredMasterClassIds();
    let updated: string[];
    let isReg = false;
    if (current.includes(id)) {
      updated = current.filter((x) => x !== id);
      isReg = false;
    } else {
      updated = [...current, id];
      isReg = true;
    }
    localStorage.setItem(MASTERCLASS_REG_KEY, JSON.stringify(updated));
    return isReg;
  } catch {
    return false;
  }
}

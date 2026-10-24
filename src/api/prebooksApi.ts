"use client";

export interface PrebookItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  description: string;
  longDescription?: string;
  expectedLaunchDate: string;
  instructor: string;
  instructorRole: string;
  price: number;
  originalPrice: number;
  availability: string;
  totalSeats: number;
  bookedSeats: number;
  learningOutcomes: string[];
}

export const PREBOOKS_DATA: PrebookItem[] = [
  {
    id: "ai-agentic-systems",
    title: "Autonomous AI Agents & Multi-Agent Swarms",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
    description:
      "Design, build and evaluate production autonomous agentic workflows using LangGraph, AutoGen, and MCP.",
    longDescription:
      "This upcoming master curriculum provides cutting-edge architectures for building self-correcting agent swarms, tool-use protocols, memory systems, and resilient sandbox execution for automated software engineering.",
    expectedLaunchDate: "December 1, 2026",
    instructor: "Dr. Arvind Ramesh",
    instructorRole: "Principal AI Research Engineer",
    price: 1999,
    originalPrice: 4999,
    availability: "Pre-Booking Open (Batch 1)",
    totalSeats: 150,
    bookedSeats: 118,
    learningOutcomes: [
      "Architect autonomous reasoning loops and reflection agents",
      "Implement Model Context Protocol (MCP) integrations with custom servers",
      "Deploy self-hosted LLM orchestration pipelines with Ollama and vLLM",
      "Benchmark agent evaluation frameworks with real GitHub test harnesses",
    ],
  },
  {
    id: "rust-distributed-systems",
    title: "High-Performance Distributed Systems in Rust",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    description:
      "Master memory safety, concurrency, Raft consensus, and sub-millisecond network services using modern Rust.",
    longDescription:
      "Engineered for backend developers seeking low latency and maximum throughput. Learn async Tokio runtimes, zero-copy deserialization, distributed consensus, and microservice mesh patterns.",
    expectedLaunchDate: "January 10, 2027",
    instructor: "Kavya S.",
    instructorRole: "Systems Architect & Rust Foundation Member",
    price: 2499,
    originalPrice: 5999,
    availability: "Pre-Booking Open",
    totalSeats: 100,
    bookedSeats: 64,
    learningOutcomes: [
      "Master Rust ownership, borrowing, lifetimes and unsafe boundary constraints",
      "Build high-throughput async services with Tokio and Axum",
      "Implement Raft distributed consensus and write-ahead logging (WAL)",
      "Deploy cross-platform WebAssembly modules into high-concurrency Node.js and edge runtimes",
    ],
  },
  {
    id: "kubernetes-cloud-native",
    title: "Enterprise Kubernetes, eBPF & Multi-Cloud Platform Engineering",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80",
    description:
      "Architect internal developer platforms (IDP), zero-trust service meshes, and observability with Cilium eBPF.",
    longDescription:
      "The definitive guide to enterprise cloud native platform engineering. Go beyond basic deployments to operator SDKs, GitOps with ArgoCD, kernel-level eBPF security, and cost optimization across AWS and GCP.",
    expectedLaunchDate: "January 25, 2027",
    instructor: "Vikram Sengupta",
    instructorRole: "Head of Infrastructure & Cloud Operations",
    price: 2999,
    originalPrice: 6999,
    availability: "Early Bird Access",
    totalSeats: 200,
    bookedSeats: 172,
    learningOutcomes: [
      "Write custom Kubernetes controllers in Go with Operator SDK",
      "Deploy kernel-space networking and observability with Cilium eBPF",
      "Design multi-tenant internal developer platforms with Backstage and ArgoCD",
      "Implement FinOps automated resource scaling and cost optimization strategies",
    ],
  },
];

const PREBOOK_STORAGE_KEY = "ingage_prebooked_ids";

export function getPrebooksList(): PrebookItem[] {
  return PREBOOKS_DATA;
}

export function getPrebookById(id: string): PrebookItem | null {
  return PREBOOKS_DATA.find((p) => p.id === id) || null;
}

export function getPrebookedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREBOOK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function togglePrebook(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getPrebookedIds();
    let updated: string[];
    let isBooked = false;
    if (current.includes(id)) {
      updated = current.filter((x) => x !== id);
      isBooked = false;
    } else {
      updated = [...current, id];
      isBooked = true;
    }
    localStorage.setItem(PREBOOK_STORAGE_KEY, JSON.stringify(updated));
    return isBooked;
  } catch {
    return false;
  }
}

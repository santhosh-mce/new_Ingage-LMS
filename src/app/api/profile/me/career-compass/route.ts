import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    readinessScore: 84,
    skillsScore: 78,
    projectsScore: 90,
    educationScore: 85,
    certificationsScore: 82,
    targetRole: "Full Stack Developer",
    status: "Strong Match",
    recommendations: [
      "Complete Capstone Project on Cloud Infrastructure",
      "Earn Google Certified Associate Cloud Engineer Credential",
      "Contribute to open source projects"
    ],
  });
}

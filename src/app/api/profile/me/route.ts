import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: sessionUser.id },
      include: {
        user_education: { orderBy: { id: "desc" } },
        user_skills: { orderBy: { id: "asc" } },
        user_projects: { orderBy: { id: "desc" } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const names = (user.name || "").split(" ");
    const firstName = user.first_name || names[0] || "";
    const lastName = user.last_name || names.slice(1).join(" ") || "";

    const response = {
      personalInfo: {
        firstName,
        lastName,
        fullName: user.name,
        email: user.email,
        phone: user.phone || "",
        profileImage: user.profile_image || "",
        location: user.location || "",
        dateOfBirth: user.date_of_birth || "",
        gender: user.gender || "",
        bio: user.bio || "",
        emailVerified: user.email_verified,
      },
      careerGoal: {
        targetJobRole: user.target_job_role || "",
        preferredIndustry: user.preferred_industry || "",
        experienceLevel: user.experience_level || "Fresher / Entry Level",
        preferredLocation: user.preferred_location || "",
        careerGoal: user.career_goal || "",
        openToWork: user.open_to_work ?? true,
      },
      links: {
        linkedinUrl: user.linkedin_url || "",
        githubUrl: user.github_url || "",
        portfolioUrl: user.portfolio_url || "",
        otherWebsiteUrl: user.other_website_url || "",
      },
      education: user.user_education.map((e) => ({
        id: Number(e.id),
        qualification: e.qualification,
        degree: e.degree,
        institution: e.institution,
        department: e.department || "",
        graduationYear: e.graduation_year || "",
        cgpa: e.cgpa || "",
      })),
      skills: user.user_skills.map((s) => ({
        id: Number(s.id),
        name: s.name,
        category: s.category || "General",
        level: s.level || "Intermediate",
      })),
      projects: user.user_projects.map((p) => ({
        id: Number(p.id),
        title: p.title,
        description: p.description || "",
        techStack: p.technologies ? p.technologies.split(",") : [],
        projectUrl: p.live_url || "",
        githubUrl: p.github_url || "",
        startDate: "",
        endDate: "",
        ongoing: false,
      })),
      resume: user.resume_url
        ? {
            filename: user.resume_filename || "Resume.pdf",
            url: user.resume_url,
            fileSize: user.resume_file_size || "1.2 MB",
            uploadedAt: user.resume_uploaded_at ? user.resume_uploaded_at.toISOString() : "",
          }
        : undefined,
    };

    return NextResponse.json(serializeData(response));
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const fullName = body.fullName || (body.firstName || body.lastName ? `${body.firstName || ""} ${body.lastName || ""}`.trim() : undefined);

    const updatedUser = await prisma.users.update({
      where: { id: sessionUser.id },
      data: {
        name: fullName || undefined,
        first_name: body.firstName !== undefined ? body.firstName : undefined,
        last_name: body.lastName !== undefined ? body.lastName : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        location: body.location !== undefined ? body.location : undefined,
        date_of_birth: body.dateOfBirth !== undefined ? String(body.dateOfBirth) : undefined,
        gender: body.gender !== undefined ? body.gender : undefined,
        bio: body.bio !== undefined ? body.bio : undefined,
        profile_image: (body.profileImage || body.profile_image) !== undefined ? (body.profileImage || body.profile_image) : undefined,
      },
    });

    return NextResponse.json({ success: true, user: serializeData(updatedUser) });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

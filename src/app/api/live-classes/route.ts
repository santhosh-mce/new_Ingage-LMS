import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const liveLessons = await prisma.course_lessons.findMany({
      where: {
        lesson_type: "LIVE_CLASS",
      },
      include: {
        course_sections: {
          include: {
            courses: {
              select: {
                id: true,
                title: true,
                instructor: true,
              },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    const parsedClasses = liveLessons.map((item: any, idx: number) => {
      let meta: any = {};
      if (item.description) {
        try {
          if (typeof item.description === "string" && item.description.startsWith("{")) {
            meta = JSON.parse(item.description);
          } else if (typeof item.description === "object") {
            meta = item.description;
          }
        } catch {}
      }

      let status: "Live Now" | "Upcoming" | "Completed" = "Upcoming";
      if (meta.status) {
        status = meta.status;
      } else if (idx === 0) {
        status = "Live Now";
      } else if (idx === 1 || idx === 2) {
        status = "Upcoming";
      } else {
        status = "Completed";
      }

      const courseObj = item.course_sections?.courses;

      return {
        id: Number(item.id),
        title: item.title,
        description:
          typeof item.description === "string" && !item.description.startsWith("{")
            ? item.description
            : meta.topic || "Interactive live session with live code review and Q&A.",
        courseId: Number(courseObj?.id || 0),
        courseTitle: courseObj?.title || "Web Development",
        instructor: meta.instructor || courseObj?.instructor || "InGage Faculty",
        date: meta.date || (status === "Live Now" ? "Today" : "Tomorrow"),
        time: meta.time || "7:00 PM - 8:30 PM IST",
        duration: item.duration || "1.5 Hours",
        status,
        meetingUrl: meta.meetingUrl || item.content_url || "https://meet.google.com/ingage-live-class",
        recordingUrl: meta.recordingUrl || item.content_url || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      };
    });

    return NextResponse.json(serializeData(parsedClasses));
  } catch (error: any) {
    console.error("Live classes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch live classes" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const courseId = BigInt(id);

    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      include: {
        course_sections: {
          orderBy: { display_order: "asc" },
          include: {
            course_lessons: {
              orderBy: { display_order: "asc" },
              include: {
                quiz_questions: {
                  orderBy: { display_order: "asc" },
                  include: {
                    quiz_question_options: {
                      orderBy: { option_order: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
        enrollments: {
          take: 10,
          orderBy: { enrolled_at: "desc" },
          include: {
            users: {
              select: { id: true, name: true, email: true, profile_image: true },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const serialized: any = serializeData(course);
    if (serialized.course_sections) {
      serialized.sections = serialized.course_sections.map((sec: any) => ({
        id: Number(sec.id),
        courseId: Number(sec.course_id),
        title: sec.title,
        description: sec.description || '',
        displayOrder: sec.display_order ?? 0,
        lessons: (sec.course_lessons || []).map((les: any) => ({
          id: Number(les.id),
          sectionId: Number(les.section_id),
          title: les.title,
          description: les.description || '',
          lessonType: les.lesson_type || 'VIDEO',
          contentUrl: les.content_url || null,
          duration: les.duration || '10m',
          durationSeconds: les.duration_seconds || 600,
          displayOrder: les.display_order ?? 0,
          freePreview: Boolean(les.free_preview),
          required: Boolean(les.required),
          videoKey: les.video_key || "",
          quizQuestions: (les.quiz_questions || []).map((q: any) => ({
            id: Number(q.id),
            questionText: q.question_text,
            correctAnswer: q.correct_option_index,
            explanation: q.explanation || "",
            displayOrder: q.display_order,
            options: (q.quiz_question_options || []).map((o: any) => o.option_text),
          })),
        })),
      }));

      // Compute isolated video sections (modules containing at least one valid VIDEO lesson)
      serialized.videoSections = serialized.sections
        .map((sec: any) => {
          const videoLessons = (sec.lessons || []).filter(
            (les: any) =>
              (les.lessonType || "").toUpperCase() === "VIDEO" &&
              les.contentUrl &&
              String(les.contentUrl).trim().length > 0
          );
          return {
            ...sec,
            lessons: videoLessons,
          };
        })
        .filter((sec: any) => sec.lessons.length > 0);

      try {
        const { searchParams } = new URL(req.url);
        if (searchParams.get("type")?.toUpperCase() === "VIDEO") {
          serialized.sections = serialized.videoSections;
        }
      } catch (e) {}
    }

    serialized.shortDescription = serialized.short_description || serialized.shortDescription || '';
    serialized.discountType = serialized.discount_type || serialized.discountType || 'NONE';
    serialized.discountValue = serialized.discount_value != null ? Number(serialized.discount_value) : (serialized.discountValue != null ? Number(serialized.discountValue) : 0);
    serialized.finalPrice = serialized.final_price != null ? Number(serialized.final_price) : (serialized.finalPrice != null ? Number(serialized.finalPrice) : serialized.price);

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error("Get course error:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const courseId = BigInt(resolvedParams.id);
    const body = await req.json();

    const data: any = {
      updated_at: new Date(),
    };

    if (body.title !== undefined) data.title = body.title.trim();
    if (body.category !== undefined) data.category = body.category;
    if (body.level !== undefined) data.level = body.level;
    if (body.price !== undefined) data.price = Math.round(Number(body.price)) || 0;
    if (body.description !== undefined) data.description = body.description;
    if (body.short_description !== undefined) data.short_description = body.short_description;
    if (body.shortDescription !== undefined) data.short_description = body.shortDescription;
    if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail;
    if (body.banner !== undefined) data.banner = body.banner;
    if (body.slug !== undefined) data.slug = body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (body.language !== undefined) data.language = body.language;
    if (body.duration !== undefined) data.duration = body.duration;
    if (body.instructor !== undefined) data.instructor = body.instructor;
    if (body.currency !== undefined) data.currency = body.currency;

    // Strict validation for discount_type check constraint: must be 'PERCENTAGE', 'FIXED_AMOUNT', or null
    if (body.discountType !== undefined || body.discount_type !== undefined) {
      const rawDiscType = String(body.discountType || body.discount_type || '').toUpperCase().trim();
      if (rawDiscType === 'PERCENTAGE' || rawDiscType === 'FIXED_AMOUNT') {
        data.discount_type = rawDiscType;
        const val = body.discountValue !== undefined ? body.discountValue : body.discount_value;
        data.discount_value = val != null && !isNaN(Number(val)) ? Number(val) : 0;
      } else {
        data.discount_type = null;
        data.discount_value = null;
      }
    } else if (body.discountValue !== undefined || body.discount_value !== undefined) {
      const val = body.discountValue !== undefined ? body.discountValue : body.discount_value;
      data.discount_value = val != null && !isNaN(Number(val)) ? Number(val) : null;
    }

    if (body.published !== undefined) {
      data.published = Boolean(body.published);
    }
    if (body.status !== undefined) {
      const rawStatus = String(body.status).toUpperCase().trim();
      if (['DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'].includes(rawStatus)) {
        data.status = rawStatus;
      } else {
        data.status = data.published ? 'PUBLISHED' : 'DRAFT';
      }
    } else if (body.published !== undefined) {
      data.status = data.published ? 'PUBLISHED' : 'DRAFT';
    }

    // Final price calculation
    if (body.final_price !== undefined) {
      data.final_price = Number(body.final_price);
    } else if (body.finalPrice !== undefined) {
      data.final_price = Number(body.finalPrice);
    } else if (data.discount_type === 'PERCENTAGE' && data.discount_value) {
      const basePrice = data.price !== undefined ? data.price : 0;
      data.final_price = Math.max(0, Math.round((basePrice - (basePrice * data.discount_value) / 100) * 100) / 100);
    } else if (data.discount_type === 'FIXED_AMOUNT' && data.discount_value) {
      const basePrice = data.price !== undefined ? data.price : 0;
      data.final_price = Math.max(0, basePrice - data.discount_value);
    } else if (data.price !== undefined) {
      data.final_price = data.price;
    }

    const updated = await prisma.courses.update({
      where: { id: courseId },
      data,
    });

    const serialized: any = serializeData(updated);
    serialized.shortDescription = serialized.short_description || serialized.shortDescription || "";
    serialized.discountType = (serialized.discount_type === 'PERCENTAGE' || serialized.discount_type === 'FIXED_AMOUNT') ? serialized.discount_type : "NONE";
    serialized.discountValue = serialized.discount_value != null ? Number(serialized.discount_value) : 0;
    serialized.finalPrice = serialized.final_price != null ? Number(serialized.final_price) : serialized.price;

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error("Update course error:", error);
    return NextResponse.json({ error: "Failed to update course: " + (error?.message || error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const courseId = BigInt(resolvedParams.id);

    await prisma.courses.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ success: true, message: "Course deleted successfully" });
  } catch (error: any) {
    console.error("Delete course error:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}

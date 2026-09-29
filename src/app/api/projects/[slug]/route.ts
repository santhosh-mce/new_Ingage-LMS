import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    const project = await prisma.projects.findFirst({
      where: { slug },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(serializeData(project));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

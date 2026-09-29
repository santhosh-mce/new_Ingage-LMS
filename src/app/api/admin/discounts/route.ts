import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const discounts = await prisma.discounts.findMany({
      orderBy: { created_at: "desc" },
    });

    const result = discounts.map((d) => ({
      id: d.id.toString(),
      couponCode: d.coupon_code,
      discountType: d.discount_type,
      discountValue: d.discount_value,
      minPurchaseAmount: d.min_purchase_amount,
      maxDiscount: d.max_discount,
      startDate: d.start_date ? d.start_date.toISOString() : null,
      endDate: d.end_date ? d.end_date.toISOString() : null,
      usageLimit: d.usage_limit,
      usedCount: d.used_count,
      perUserLimit: d.per_user_limit,
      active: d.active,
      createdAt: d.created_at.toISOString(),
      updatedAt: d.updated_at ? d.updated_at.toISOString() : null,
    }));

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Admin discounts error:", error);
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const created = await prisma.discounts.create({
      data: {
        coupon_code: body.couponCode.toUpperCase().trim(),
        discount_type: body.discountType || "PERCENTAGE",
        discount_value: Number(body.discountValue) || 0,
        min_purchase_amount: body.minPurchaseAmount ? Number(body.minPurchaseAmount) : null,
        max_discount: body.maxDiscount ? Number(body.maxDiscount) : null,
        start_date: body.startDate ? new Date(body.startDate) : new Date(),
        end_date: body.endDate ? new Date(body.endDate) : null,
        usage_limit: body.usageLimit ? Number(body.usageLimit) : null,
        per_user_limit: body.perUserLimit ? Number(body.perUserLimit) : 1,
        used_count: 0,
        active: body.active !== undefined ? Boolean(body.active) : true,
        created_at: new Date(),
      },
    });

    // Audit log
    await prisma.admin_activity_logs.create({
      data: {
        action: "CREATE_DISCOUNT",
        admin_email: user?.email || "admin@ingage.com",
        admin_id: user?.id || "admin",
        created_at: new Date(),
        details: "Created discount coupon: " + created.coupon_code,
        entity_id: created.id.toString(),
        entity_type: "DISCOUNT",
      },
    });

    return NextResponse.json(serializeData(created), { status: 201 });
  } catch (error: any) {
    console.error("Create discount error:", error);
    return NextResponse.json({ error: error.message || "Failed to create discount" }, { status: 500 });
  }
}

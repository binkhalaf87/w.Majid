import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";
import { templateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await prisma.template.findMany({ orderBy: { updatedAt: "desc" } }));
}

export async function POST(request: NextRequest) {
  const parsed = templateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("بيانات القالب غير صالحة");
  try {
    return Response.json(await prisma.template.create({ data: parsed.data }), { status: 201 });
  } catch {
    return apiError("اسم القالب موجود مسبقًا", 409);
  }
}

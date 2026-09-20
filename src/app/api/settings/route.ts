import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.settings.upsert({ where: { id: "default" }, create: {}, update: {} });
  return Response.json(settings);
}

export async function PUT(request: NextRequest) {
  const parsed = z.object({ businessName: z.string().trim().min(1).max(80) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("اسم المنصة غير صالح");
  return Response.json(await prisma.settings.upsert({ where: { id: "default" }, create: parsed.data, update: parsed.data }));
}

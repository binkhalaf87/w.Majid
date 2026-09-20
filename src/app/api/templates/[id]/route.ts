import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";
import { templateSchema } from "@/lib/validation";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const parsed = templateSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("بيانات القالب غير صالحة");
  try {
    return Response.json(await prisma.template.update({ where: { id: params.id }, data: parsed.data }));
  } catch {
    return apiError("القالب غير موجود", 404);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.template.delete({ where: { id: params.id } });
    return new Response(null, { status: 204 });
  } catch {
    return apiError("القالب غير موجود", 404);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const conversations = await prisma.conversation.findMany({
    where: query
      ? { OR: [{ waId: { contains: query } }, { name: { contains: query, mode: "insensitive" } }] }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: { id: true, waId: true, name: true, lastMessage: true, unreadCount: true, createdAt: true, updatedAt: true },
  });
  return Response.json(conversations);
}

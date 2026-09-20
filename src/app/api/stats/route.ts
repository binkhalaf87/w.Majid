import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [totalConversations, messagesToday, unread] = await Promise.all([
    prisma.conversation.count(),
    prisma.message.count({ where: { timestamp: { gte: startOfDay } } }),
    prisma.conversation.aggregate({ _sum: { unreadCount: true } }),
  ]);
  return Response.json({ totalConversations, messagesToday, unread: unread._sum.unreadCount || 0 });
}

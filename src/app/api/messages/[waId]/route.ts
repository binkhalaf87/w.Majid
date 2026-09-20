import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { apiError } from "@/lib/utils";
import { phoneSchema, textMessageSchema } from "@/lib/validation";
import { markMessageRead, sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { waId: string } }) {
  const parsedPhone = phoneSchema.safeParse(params.waId);
  if (!parsedPhone.success) return apiError("رقم واتساب غير صالح");
  const conversation = await prisma.conversation.findUnique({
    where: { waId: parsedPhone.data },
    include: { messages: { orderBy: { timestamp: "asc" }, take: 200 } },
  });
  if (!conversation) return apiError("المحادثة غير موجودة", 404);

  const lastUnread = [...conversation.messages].reverse().find((message) => message.role === "user" && message.metaMessageId);
  await prisma.conversation.update({ where: { id: conversation.id }, data: { unreadCount: 0 } });
  if (lastUnread?.metaMessageId) markMessageRead(lastUnread.metaMessageId).catch((error) => console.error("Failed to mark read", error));

  return Response.json({ ...conversation, unreadCount: 0 });
}

export async function POST(request: NextRequest, { params }: { params: { waId: string } }) {
  const phone = phoneSchema.safeParse(params.waId);
  if (!phone.success) return apiError(phone.error.issues[0]?.message || "رقم غير صالح");
  if (!rateLimit(`send:${phone.data}`, 30, 60_000).allowed) return apiError("تم تجاوز حد الإرسال المؤقت", 429);

  const body = textMessageSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return apiError("نص الرسالة مطلوب وبحد أقصى 4096 حرفًا");

  try {
    const result = await sendWhatsAppMessage(phone.data, body.data.content);
    const metaMessageId = result.messages?.[0]?.id;
    const conversation = await prisma.conversation.upsert({
      where: { waId: phone.data },
      create: { waId: phone.data, lastMessage: body.data.content },
      update: { lastMessage: body.data.content, updatedAt: new Date() },
    });
    const message = await prisma.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: body.data.content, status: "sent", metaMessageId },
    });
    return Response.json(message, { status: 201 });
  } catch (error) {
    console.error("Manual send failed", error);
    return apiError(error instanceof Error ? error.message : "تعذر إرسال الرسالة", 502);
  }
}

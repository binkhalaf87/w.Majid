import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { apiError } from "@/lib/utils";
import { phoneSchema } from "@/lib/validation";
import { sendTemplate } from "@/lib/whatsapp";

const sendSchema = z.object({
  to: phoneSchema,
  templateId: z.string().min(1),
  params: z.array(z.string().max(1024)).max(20).default([]),
});

export async function POST(request: NextRequest) {
  const parsed = sendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("بيانات الإرسال غير صالحة");
  if (!rateLimit(`template:${parsed.data.to}`, 20, 60_000).allowed) return apiError("تم تجاوز حد الإرسال المؤقت", 429);
  const template = await prisma.template.findUnique({ where: { id: parsed.data.templateId } });
  if (!template) return apiError("القالب غير موجود", 404);
  if (template.status !== "APPROVED") return apiError("لا يمكن إرسال قالب غير معتمد", 409);

  try {
    const result = await sendTemplate(parsed.data.to, template.name, parsed.data.params, template.language);
    const renderedBody = parsed.data.params.reduce((body, value, index) => body.replace(`{{${index + 1}}}`, value), template.body);
    const conversation = await prisma.conversation.upsert({
      where: { waId: parsed.data.to },
      create: { waId: parsed.data.to, lastMessage: renderedBody },
      update: { lastMessage: renderedBody, updatedAt: new Date() },
    });
    const message = await prisma.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: renderedBody, status: "sent", metaMessageId: result.messages?.[0]?.id },
    });
    return Response.json(message, { status: 201 });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "تعذر إرسال القالب", 502);
  }
}

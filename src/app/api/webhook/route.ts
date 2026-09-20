import { MessageStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { messageText, verifyMetaSignature, type MetaWebhookPayload } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`webhook:${clientIp}`, 180, 60_000).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const rawBody = await request.text();
  if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as MetaWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};

        for (const statusUpdate of value.statuses || []) {
          const nextStatus = statusUpdate.status;
          if (!statusUpdate.id || !nextStatus || !["sent", "delivered", "read", "failed"].includes(nextStatus)) continue;
          await prisma.message.updateMany({
            where: { metaMessageId: statusUpdate.id },
            data: { status: nextStatus as MessageStatus },
          });
        }

        for (const message of value.messages || []) {
          const waId = String(message.from || "").replace(/\D/g, "");
          if (!waId || !message.id) continue;
          const name = value.contacts?.find((contact) => contact.wa_id === waId)?.profile?.name;
          const content = messageText(message);
          const timestamp = message.timestamp ? new Date(Number(message.timestamp) * 1000) : new Date();

          try {
            await prisma.$transaction(async (tx) => {
              const conversation = await tx.conversation.upsert({
                where: { waId },
                create: { waId, name, lastMessage: content, unreadCount: 1 },
                update: { name: name || undefined, lastMessage: content, unreadCount: { increment: 1 }, updatedAt: timestamp },
              });
              await tx.message.create({
                data: { conversationId: conversation.id, role: "user", content, timestamp, status: "received", metaMessageId: message.id },
              });
            });
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
            throw error;
          }
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed", error);
    // Meta retries non-2xx responses, so return 500 only when persistence failed.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

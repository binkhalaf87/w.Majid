import crypto from "node:crypto";

export type MetaMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};

export type MetaWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        statuses?: Array<{ id?: string; status?: string }>;
        messages?: MetaMessage[];
        contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
      };
    }>;
  }>;
};

export function verifyMetaSignature(rawBody: string, signature: string | null) {
  const secret = process.env.APP_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function messageText(message: MetaMessage) {
  if (message.type === "text") return message.text?.body || "";
  if (message.type === "button") return message.button?.text || "[زر]";
  if (message.type === "interactive") {
    return message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || "[رد تفاعلي]";
  }
  const labels: Record<string, string> = { image: "صورة", video: "فيديو", audio: "مقطع صوتي", document: "مستند", sticker: "ملصق", location: "موقع", contacts: "جهة اتصال" };
  const type = message.type || "unknown";
  return `[${labels[type] || (type === "unknown" ? "رسالة غير مدعومة" : type)}]`;
}

import { phoneSchema } from "@/lib/validation";

const graphVersion = process.env.GRAPH_API_VERSION || "v20.0";

function config() {
  const token = process.env.TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) throw new Error("إعدادات Meta غير مكتملة");
  return { token, phoneNumberId };
}

async function graphRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { token } = config();
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json();
  if (!response.ok) {
    console.error("Meta Graph API error", { status: response.status, payload });
    throw new Error(payload?.error?.message || "تعذر الاتصال بخدمة واتساب");
  }
  return payload as T;
}

type SendResponse = { messages: Array<{ id: string; message_status?: string }> };

export async function sendWhatsAppMessage(to: string, text: string) {
  const phone = phoneSchema.parse(to);
  const { phoneNumberId } = config();
  return graphRequest<SendResponse>(`${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: phone, type: "text", text: { preview_url: false, body: text } }),
  });
}

export async function sendTemplate(to: string, templateName: string, params: string[] = [], language = "ar") {
  const phone = phoneSchema.parse(to);
  const { phoneNumberId } = config();
  const components = params.length
    ? [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }]
    : undefined;
  return graphRequest<SendResponse>(`${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "template", template: { name: templateName, language: { code: language }, components } }),
  });
}

export async function markMessageRead(messageId: string) {
  const { phoneNumberId } = config();
  return graphRequest(`${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }),
  });
}

export async function getConnectionStatus() {
  const { phoneNumberId } = config();
  return graphRequest<{ id: string; display_phone_number?: string; verified_name?: string; quality_rating?: string }>(
    `${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
    { method: "GET" },
  );
}

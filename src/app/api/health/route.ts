export async function GET() {
  return Response.json({ status: "ok", service: "WhatsApp Majid", timestamp: new Date().toISOString() });
}

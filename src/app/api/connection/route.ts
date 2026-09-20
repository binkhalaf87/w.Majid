import { getConnectionStatus } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getConnectionStatus();
    return Response.json({ connected: true, ...data });
  } catch (error) {
    return Response.json({ connected: false, error: error instanceof Error ? error.message : "غير متصل" }, { status: 503 });
  }
}

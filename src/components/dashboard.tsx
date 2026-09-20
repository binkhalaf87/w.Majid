"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Check, CheckCheck, ChevronRight, CircleAlert, FileText, Loader2, Menu, MessageCircle, Moon, PanelLeft, Search, Send, Sun, UserRound, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Conversation = { id: string; waId: string; name: string | null; lastMessage: string | null; unreadCount: number; createdAt: string; updatedAt: string };
type Message = { id: string; role: "user" | "assistant"; content: string; timestamp: string; status: "sent" | "delivered" | "read" | "failed" | "received" };
type Template = { id: string; name: string; body: string; category: string; status: string; language: string };
type Chat = Conversation & { messages: Message[] };
type Connection = { connected: boolean; display_phone_number?: string; verified_name?: string; quality_rating?: string; error?: string };

const pollMs = Math.max(3000, Number(process.env.NEXT_PUBLIC_POLL_MS) || 3000);

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "تعذر إكمال الطلب");
  return body;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "؟";
}

function timeLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "2-digit" }).format(date);
  return new Intl.DateTimeFormat("ar-SA", { month: "short", day: "numeric" }).format(date);
}

function StatusTicks({ status }: { status: Message["status"] }) {
  if (status === "failed") return <CircleAlert className="h-3.5 w-3.5 text-red-500" aria-label="فشل الإرسال" />;
  if (status === "read") return <CheckCheck className="h-3.5 w-3.5 text-sky-500" aria-label="تمت القراءة" />;
  if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5" aria-label="تم التسليم" />;
  return <Check className="h-3.5 w-3.5" aria-label="تم الإرسال" />;
}

export function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeWaId, setActiveWaId] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [infoOpen, setInfoOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, setTheme } = useTheme();

  const loadConversations = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await fetchJson<Conversation[]>(`/api/conversations?q=${encodeURIComponent(search)}`);
      setConversations(data);
    } catch (err) { if (!quiet) setError(err instanceof Error ? err.message : "تعذر تحميل المحادثات"); }
    finally { if (!quiet) setLoading(false); }
  }, [search]);

  const loadChat = useCallback(async (waId: string, quiet = false) => {
    if (!quiet) setChatLoading(true);
    try {
      const data = await fetchJson<Chat>(`/api/messages/${waId}`);
      setChat(data);
      setConversations((items) => items.map((item) => item.waId === waId ? { ...item, unreadCount: 0 } : item));
    } catch (err) { if (!quiet) setError(err instanceof Error ? err.message : "تعذر تحميل الرسائل"); }
    finally { if (!quiet) setChatLoading(false); }
  }, []);

  useEffect(() => { const timeout = setTimeout(() => loadConversations(), 250); return () => clearTimeout(timeout); }, [loadConversations]);
  useEffect(() => {
    fetchJson<Connection>("/api/connection").then(setConnection).catch((err) => setConnection({ connected: false, error: err.message }));
    const timer = setInterval(() => { loadConversations(true); if (activeWaId) loadChat(activeWaId, true); }, pollMs);
    return () => clearInterval(timer);
  }, [activeWaId, loadChat, loadConversations]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat?.messages.length]);

  function selectConversation(waId: string) {
    setActiveWaId(waId); setMobileView("chat"); loadChat(waId);
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!activeWaId || !message.trim() || sending) return;
    const content = message.trim(); setSending(true); setError(null);
    try {
      await fetchJson(`/api/messages/${activeWaId}`, { method: "POST", body: JSON.stringify({ content }) });
      setMessage(""); await Promise.all([loadChat(activeWaId, true), loadConversations(true)]);
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر إرسال الرسالة"); }
    finally { setSending(false); }
  }

  const active = useMemo(() => conversations.find((item) => item.waId === activeWaId) || chat, [conversations, activeWaId, chat]);

  return (
    <main className="h-dvh overflow-hidden bg-muted p-0 lg:p-4">
      <div className="mx-auto grid h-full max-w-[1600px] overflow-hidden bg-card shadow-soft lg:h-[calc(100dvh-2rem)] lg:grid-cols-[360px_minmax(0,1fr)_300px] lg:rounded-2xl lg:border">
        <aside className={`${mobileView === "chat" ? "hidden" : "flex"} min-w-0 flex-col border-l bg-card lg:flex`}>
          <header className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white"><MessageCircle /></span><div><h1 className="font-bold">WhatsApp Majid</h1><ConnectionBadge connection={connection} /></div></div>
            <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="تبديل المظهر">{resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
          </header>
          <div className="p-3"><div className="relative"><Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" /><Input className="pr-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالاسم أو الرقم" aria-label="بحث في المحادثات" /></div></div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <ConversationSkeleton /> : conversations.length === 0 ? <EmptyList /> : conversations.map((item) => (
              <button key={item.id} onClick={() => selectConversation(item.waId)} className={`flex w-full gap-3 border-b px-4 py-3 text-right transition hover:bg-muted ${item.waId === activeWaId ? "bg-muted" : ""}`}>
                <Avatar name={item.name || item.waId} />
                <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{item.name || item.waId}</strong><time className="shrink-0 text-[11px] text-muted-foreground">{timeLabel(item.updatedAt)}</time></span><span className="mt-1 flex items-center justify-between gap-2"><span className="truncate text-xs text-muted-foreground">{item.lastMessage || "محادثة جديدة"}</span>{item.unreadCount > 0 && <Badge>{item.unreadCount}</Badge>}</span></span>
              </button>
            ))}
          </div>
        </aside>

        <section className={`${mobileView === "list" ? "hidden" : "flex"} min-w-0 flex-col lg:flex`}>
          {active ? <>
            <header className="flex h-16 items-center gap-3 border-b bg-card px-3 sm:px-5"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileView("list")}><ChevronRight /></Button><Avatar name={active.name || active.waId} small /><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{active.name || active.waId}</h2><p className="text-xs text-muted-foreground" dir="ltr">+{active.waId}</p></div><Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}><FileText className="h-4 w-4" /><span className="hidden sm:inline">إرسال قالب</span></Button><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setInfoOpen(true)}><Menu /></Button></header>
            <div className="chat-pattern flex-1 overflow-y-auto p-4 sm:p-6">
              {chatLoading ? <MessageSkeleton /> : chat?.messages.length ? chat.messages.map((item) => <MessageBubble key={item.id} message={item} />) : <div className="grid h-full place-items-center text-center text-muted-foreground"><div><MessageCircle className="mx-auto h-10 w-10 opacity-40"/><p className="mt-3">ابدأ أول رسالة في هذه المحادثة</p></div></div>}
              <div ref={endRef} />
            </div>
            {error && <div className="flex items-center justify-between border-t bg-red-50 px-4 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300"><span>{error}</span><button onClick={() => setError(null)}><X className="h-4 w-4" /></button></div>}
            <form onSubmit={sendMessage} className="flex items-end gap-2 border-t bg-card p-3 sm:p-4"><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" placeholder="اكتب رسالة..." rows={1} maxLength={4096} aria-label="نص الرسالة" /><Button type="submit" size="icon" className="h-11 w-11 rounded-xl" disabled={!message.trim() || sending}>{sending ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5 rotate-180" />}</Button></form>
          </> : <EmptyChat onOpen={() => setMobileView("list")} />}
        </section>

        <CustomerPanel active={active || null} connection={connection} className="hidden lg:flex" />
      </div>
      {infoOpen && <div className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={() => setInfoOpen(false)}><CustomerPanel active={active || null} connection={connection} className="absolute left-0 top-0 h-full w-[min(88vw,340px)]" onClose={() => setInfoOpen(false)} /></div>}
      {templateOpen && activeWaId && <TemplateModal waId={activeWaId} onClose={() => setTemplateOpen(false)} onSent={() => { setTemplateOpen(false); loadChat(activeWaId, true); loadConversations(true); }} />}
    </main>
  );
}

function ConnectionBadge({ connection }: { connection: Connection | null }) {
  if (!connection) return <span className="text-[11px] text-muted-foreground">جارٍ فحص الاتصال...</span>;
  return <span className={`flex items-center gap-1 text-[11px] ${connection.connected ? "text-emerald-600" : "text-red-500"}`}><i className={`h-1.5 w-1.5 rounded-full ${connection.connected ? "bg-emerald-500" : "bg-red-500"}`} />{connection.connected ? "متصل بـ Meta" : "غير متصل"}</span>;
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) { return <span className={`grid shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 ${small ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"}`}>{initials(name)}</span>; }

function MessageBubble({ message }: { message: Message }) {
  const outgoing = message.role === "assistant";
  return <div className={`mb-2 flex ${outgoing ? "justify-start" : "justify-end"}`}><div className={`max-w-[84%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%] ${outgoing ? "rounded-tr-sm bg-emerald-100 dark:bg-emerald-950" : "rounded-tl-sm bg-card"}`}><p className="whitespace-pre-wrap break-words leading-6">{message.content}</p><span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground"><time>{new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "2-digit" }).format(new Date(message.timestamp))}</time>{outgoing && <StatusTicks status={message.status} />}</span></div></div>;
}

function CustomerPanel({ active, connection, className, onClose }: { active: Conversation | Chat | null; connection: Connection | null; className?: string; onClose?: () => void }) {
  return <aside className={`${className || ""} flex-col border-r bg-card p-5`} onClick={(event) => event.stopPropagation()}>{onClose && <Button variant="ghost" size="icon" className="self-end" onClick={onClose}><X /></Button>}<div className="mt-8 text-center">{active ? <><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{initials(active.name || active.waId)}</div><h3 className="mt-4 font-bold">{active.name || "عميل واتساب"}</h3><p className="mt-1 text-sm text-muted-foreground" dir="ltr">+{active.waId}</p></> : <><UserRound className="mx-auto h-12 w-12 text-muted-foreground"/><p className="mt-3 text-sm text-muted-foreground">اختر محادثة لعرض بيانات العميل</p></>}</div>{active && <div className="mt-8 space-y-4 border-t pt-5 text-sm"><InfoRow label="رقم واتساب" value={`+${active.waId}`} /><InfoRow label="تاريخ أول تواصل" value={new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(active.createdAt))} /><InfoRow label="الرسائل غير المقروءة" value={String(active.unreadCount || 0)} /></div>}<div className="mt-auto rounded-xl bg-muted p-4"><p className="text-xs font-semibold">رقم الأعمال</p><p className="mt-1 text-xs text-muted-foreground" dir="ltr">{connection?.display_phone_number || "غير متاح"}</p>{connection?.verified_name && <p className="mt-2 text-xs text-muted-foreground">{connection.verified_name}</p>}</div></aside>;
}

function InfoRow({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-all font-medium">{value}</p></div>; }
function EmptyList() { return <div className="grid h-64 place-items-center p-8 text-center text-sm text-muted-foreground"><div><Search className="mx-auto h-9 w-9 opacity-40"/><p className="mt-3">لا توجد محادثات مطابقة</p></div></div>; }
function EmptyChat({ onOpen }: { onOpen: () => void }) { return <div className="grid h-full place-items-center bg-muted/50 p-8 text-center"><div><span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary"><PanelLeft className="h-9 w-9" /></span><h2 className="mt-5 text-xl font-bold">WhatsApp Majid</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">اختر محادثة لعرض الرسائل والرد مباشرة من رقم واتساب الأعمال.</p><Button className="mt-5 lg:hidden" onClick={onOpen}>عرض المحادثات</Button></div></div>; }
function ConversationSkeleton() { return <div className="space-y-1 p-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex gap-3 p-2"><Skeleton className="h-11 w-11 rounded-full"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3"/><Skeleton className="h-3 w-full"/></div></div>)}</div>; }
function MessageSkeleton() { return <div className="space-y-4"><Skeleton className="mr-auto h-16 w-2/3"/><Skeleton className="ml-auto h-20 w-3/4"/><Skeleton className="mr-auto h-14 w-1/2"/></div>; }

function TemplateModal({ waId, onClose, onSent }: { waId: string; onClose: () => void; onSent: () => void }) {
  const [templates, setTemplates] = useState<Template[]>([]); const [selected, setSelected] = useState(""); const [params, setParams] = useState(""); const [loading, setLoading] = useState(true); const [sending, setSending] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetchJson<Template[]>("/api/templates").then((data) => { setTemplates(data.filter((item) => item.status === "APPROVED")); setSelected(data.find((item) => item.status === "APPROVED")?.id || ""); }).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); setSending(true); setError(null); try { await fetchJson("/api/templates/send", { method: "POST", body: JSON.stringify({ to: waId, templateId: selected, params: params ? params.split("|").map((item) => item.trim()) : [] }) }); onSent(); } catch (err) { setError(err instanceof Error ? err.message : "تعذر الإرسال"); } finally { setSending(false); } }
  const template = templates.find((item) => item.id === selected);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}><form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl border bg-card p-5 shadow-2xl"><div className="flex items-center justify-between"><div><h3 className="font-bold">إرسال قالب واتساب</h3><p className="mt-1 text-xs text-muted-foreground">القالب يجب أن يكون معتمدًا في Meta</p></div><Button type="button" variant="ghost" size="icon" onClick={onClose}><X /></Button></div>{loading ? <Skeleton className="mt-5 h-24"/> : templates.length ? <div className="mt-5 space-y-4"><label className="block text-sm font-medium">القالب<select value={selected} onChange={(event) => setSelected(event.target.value)} className="mt-2 h-10 w-full rounded-md border bg-background px-3"><option value="" disabled>اختر قالبًا</option>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{template && <div className="rounded-xl bg-muted p-4 text-sm leading-6">{template.body}</div>}<label className="block text-sm font-medium">قيم المتغيرات<Input className="mt-2" value={params} onChange={(event) => setParams(event.target.value)} placeholder="القيمة الأولى | القيمة الثانية" /></label></div> : <div className="mt-5 rounded-xl bg-muted p-5 text-center text-sm text-muted-foreground">لا توجد قوالب معتمدة. أضفها عبر API القوالب بعد اعتمادها في Meta.</div>}{error && <p className="mt-3 text-sm text-red-500">{error}</p>}<div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>إلغاء</Button><Button type="submit" disabled={!selected || sending}>{sending && <Loader2 className="h-4 w-4 animate-spin"/>}إرسال</Button></div></form></div>;
}

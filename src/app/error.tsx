"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="grid min-h-dvh place-items-center p-6 text-center"><div><h1 className="text-2xl font-bold">حدث خطأ غير متوقع</h1><p className="mt-2 text-muted-foreground">تحقق من إعدادات قاعدة البيانات ثم حاول مجددًا.</p><Button className="mt-5" onClick={reset}>إعادة المحاولة</Button></div></main>;
}

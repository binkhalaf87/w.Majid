import type { Metadata, Viewport } from "next";
import { Noto_Kufi_Arabic } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const arabic = Noto_Kufi_Arabic({ subsets: ["arabic"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: "WhatsApp Majid",
  description: "منصة ماجد الشخصية لإدارة واتساب الأعمال مباشرة عبر Meta Cloud API",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f9f6e" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={arabic.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

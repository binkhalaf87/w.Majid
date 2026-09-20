import { cn } from "@/lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground", className)}>{children}</span>;
}

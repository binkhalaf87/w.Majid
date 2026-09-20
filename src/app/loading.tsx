import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="grid h-dvh place-items-center"><div className="w-72 space-y-3"><Skeleton className="h-12" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div></main>;
}

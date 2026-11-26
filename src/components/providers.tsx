"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";

function TimezoneAndMidnightSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!document.cookie.includes(`ds_tz=${encodeURIComponent(tz)}`)) {
      document.cookie = `ds_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
      qc.invalidateQueries();
    }
    // Daily content is keyed by local date; refetch everything right after local midnight.
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const t = setTimeout(() => qc.invalidateQueries(), midnight.getTime() - now.getTime());
    return () => clearTimeout(t);
  }, [qc]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 1 } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TimezoneAndMidnightSync />
        {children}
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

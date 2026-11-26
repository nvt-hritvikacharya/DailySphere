"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";

type N = { id: string; title: string; body: string; read: boolean; createdAt: string };

export function NotificationBell() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ notifications: N[]; unread: number }>("/api/notifications"),
    refetchInterval: 5 * 60_000,
  });
  const markRead = useMutation({
    mutationFn: () => api("/api/notifications", { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <DropdownMenu onOpenChange={(open) => open && data?.unread && markRead.mutate()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell />
          {!!data?.unread && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-background" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {data?.notifications.length ? (
          data.notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5">
              <span className="font-medium">{n.title}</span>
              <span className="text-xs text-muted-foreground">{n.body}</span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
            </DropdownMenuItem>
          ))
        ) : (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

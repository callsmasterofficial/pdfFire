"use client";

import React from "react";
import { WifiOff, ShieldCheck } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 animate-in fade-in duration-300">
      <WifiOff className="size-3.5 text-amber-600 shrink-0" />
      <span className="font-medium">Offline Mode:</span>
      <span className="opacity-80">
        You are currently offline. All PDF operations run locally without network access.
      </span>
      <ShieldCheck className="size-3.5 text-emerald-600 shrink-0 ml-1" />
    </div>
  );
}

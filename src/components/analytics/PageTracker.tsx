"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getPlanType } from "@/lib/storage/user-learning-store";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let vid = localStorage.getItem("shadowlog_visitor_id");
    if (!vid) {
      vid = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("shadowlog_visitor_id", vid);
    }
    return vid;
  } catch {
    return "anonymous";
  }
}

export function PageTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;

    try {
      const visitorId = getOrCreateVisitorId();
      const plan = getPlanType();
      const payload = JSON.stringify({
        path: pathname,
        referrer: typeof document !== "undefined" ? document.referrer : "",
        userType: plan,
        visitorId,
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/log", blob);
      } else {
        fetch("/api/analytics/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Completely silent; never throw or interrupt UI
    }
  }, [pathname]);

  return null;
}

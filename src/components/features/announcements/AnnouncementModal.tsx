"use client";

import { useState, useEffect } from "react";
import { Announcement } from "@/types";
import {
  getPendingAnnouncement,
  markAsRead,
  markAsLater,
} from "@/lib/storage/announcement-store";


import {
  X,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Megaphone,
} from "lucide-react";

export function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isSucking, setIsSucking] = useState(false);
  const [targetCoords, setTargetCoords] = useState<{ x: number; y: number }>({ x: -300, y: 300 });

  useEffect(() => {
    // Check pending unhandled announcement on mount
    const pending = getPendingAnnouncement();
    if (pending) {
      setAnnouncement(pending);
    }
  }, []);

  // Update target coordinates of settings icon on screen
  useEffect(() => {
    if (!announcement) return;
    const updateTargetLocation = () => {
      const settingsEl = document.getElementById("settings-nav-item");
      if (settingsEl) {
        const rect = settingsEl.getBoundingClientRect();
        // Target center of settings button
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;
        setTargetCoords({ x: targetX, y: targetY });
      }
    };
    updateTargetLocation();
    window.addEventListener("resize", updateTargetLocation);
    return () => window.removeEventListener("resize", updateTargetLocation);
  }, [announcement]);

  if (!announcement) return null;

  const triggerSettingsIconBounce = () => {
    const settingsEl = document.getElementById("settings-nav-item");
    if (settingsEl) {
      settingsEl.classList.remove("animate-bounce");
      // Force reflow
      void settingsEl.offsetWidth;
      settingsEl.classList.add("animate-bounce");
      setTimeout(() => {
        settingsEl.classList.remove("animate-bounce");
      }, 1000);
    }
  };

  const handleDismiss = (action: "read" | "later") => {
    setIsSucking(true);

    // Wait for suck-in animation (450ms)
    setTimeout(() => {
      if (action === "read") {
        markAsRead(announcement.id);
      } else {
        markAsLater(announcement.id);
      }
      triggerSettingsIconBounce();
      setAnnouncement(null);
      setIsSucking(false);
    }, 450);
  };

  const images = announcement.coverImages || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      {/* Modal Container with Suck-in transform */}
      <div
        style={
          isSucking
            ? {
                transform: `translate(${targetCoords.x - window.innerWidth / 2}px, ${
                  targetCoords.y - window.innerHeight / 2
                }px) scale(0.05)`,
                opacity: 0,
                transition: "all 450ms cubic-bezier(0.4, 0, 0.2, 1)",
              }
            : {
                transition: "all 450ms cubic-bezier(0.4, 0, 0.2, 1)",
              }
        }
        className="relative w-full max-w-lg bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="relative flex items-center justify-between p-4 px-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                announcement.category === "update"
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                  : announcement.category === "important"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                  : "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
              }`}
            >
              {announcement.tagText}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {announcement.publishedAt}
            </span>
          </div>

          <button
            onClick={() => handleDismiss("read")}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
            title="閉じる（確認した）"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cover Image Carousel */}
        {images.length > 0 && (
          <div className="relative w-full h-48 sm:h-56 bg-black/5 overflow-hidden shrink-0">
            <img
              src={images[currentImageIdx]}
              alt="Cover Image"
              className="w-full h-full object-cover transition-all duration-300"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition backdrop-blur-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition backdrop-blur-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Indicators */}
                <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5">
                  {images.map((_: string, idx: number) => (
                    <span
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIdx ? "bg-white w-4" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-3 overflow-y-auto">
          <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug flex items-start gap-2">
            <Megaphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            {announcement.title}
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-primary leading-relaxed bg-primary/5 p-3 rounded-xl border border-primary/15">
            {announcement.summary}
          </p>

          <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed pt-1">
            {announcement.content}
          </p>

          {announcement.actionUrl && (
            <div className="pt-2">
              <a
                href={announcement.actionUrl}
                target={announcement.actionUrl.startsWith("http") ? "_blank" : "_self"}
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline"
              >
                <span>{announcement.actionText || "詳細を見る"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions (2 Buttons) */}
        <div className="p-4 px-6 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            onClick={() => handleDismiss("later")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition min-h-[42px]"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>⏱️ あとで読む</span>
          </button>

          <button
            onClick={() => handleDismiss("read")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition shadow-sm min-h-[42px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>確認した (既読にする)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

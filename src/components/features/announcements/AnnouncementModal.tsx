"use client";

import { useState, useEffect } from "react";
import {
  X,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Announcement } from "@/types";
import {
  getPendingAnnouncement,
  markAsRead,
  markAsLater,
} from "@/lib/storage/announcement-store";

export function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isSucking, setIsSucking] = useState(false);
  const [targetCoords, setTargetCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const pending = getPendingAnnouncement();
    if (pending) {
      setAnnouncement(pending);
    }
  }, []);

  // Target coordinates of settings icon on screen for smooth dismiss animation
  useEffect(() => {
    if (!announcement) return;
    const updateTargetLocation = () => {
      const settingsEl =
        document.getElementById("settings-nav-item") ||
        document.getElementById("settings-nav-item-mobile");
      if (settingsEl) {
        const rect = settingsEl.getBoundingClientRect();
        setTargetCoords({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    };
    updateTargetLocation();
    window.addEventListener("resize", updateTargetLocation);
    return () => window.removeEventListener("resize", updateTargetLocation);
  }, [announcement]);

  if (!announcement) return null;

  const triggerSettingsIconBounce = () => {
    const settingsEl =
      document.getElementById("settings-nav-item") ||
      document.getElementById("settings-nav-item-mobile");
    if (settingsEl) {
      settingsEl.classList.remove("animate-bounce");
      void settingsEl.offsetWidth;
      settingsEl.classList.add("animate-bounce");
      setTimeout(() => {
        settingsEl.classList.remove("animate-bounce");
      }, 1000);
    }
  };

  const handleDismiss = (action: "read" | "later") => {
    setIsSucking(true);

    setTimeout(() => {
      if (action === "read") {
        markAsRead(announcement.id);
      } else {
        markAsLater(announcement.id);
      }
      triggerSettingsIconBounce();
      setAnnouncement(null);
      setIsSucking(false);
    }, 400);
  };

  const images = announcement.coverImages || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto overscroll-contain">
      {/* Modal Container */}
      <div
        style={
          isSucking
            ? targetCoords.x > 0
              ? {
                  transform: `translate(${targetCoords.x - window.innerWidth / 2}px, ${
                    targetCoords.y - window.innerHeight / 2
                  }px) scale(0.05)`,
                  opacity: 0,
                  transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                }
              : {
                  transform: "scale(0.95)",
                  opacity: 0,
                  transition: "all 300ms ease",
                }
            : {
                transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)",
              }
        }
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[82dvh] sm:max-h-[85dvh] my-auto animate-in zoom-in-95 duration-200"
      >
        {/* 1. Header Bar (Fixed / Non-scrollable) */}
        <div className="shrink-0 relative flex items-center justify-between p-3.5 sm:p-4 px-4 sm:px-6 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                announcement.category === "campaign"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  : announcement.category === "update"
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                  : "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
              }`}
            >
              {announcement.tagText}
            </span>
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {announcement.publishedAt}
            </span>
          </div>

          <button
            onClick={() => handleDismiss("read")}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 ml-2"
            title="閉じる（確認した）"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Body (Contains Cover Image + Text) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
          {/* Cover Image Carousel */}
          {images.length > 0 && (
            <div className="relative w-full h-36 sm:h-48 bg-black/5 overflow-hidden shrink-0">
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
                    {images.map((_, idx) => (
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

          {/* Text Content */}
          <div className="p-4 sm:p-6 space-y-3.5">
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug flex items-start gap-2.5 min-w-0">
              <Megaphone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <span className="flex-1 min-w-0 break-words">{announcement.title}</span>
            </h2>

            <p className="text-xs sm:text-sm font-semibold text-primary leading-relaxed bg-primary/5 p-3.5 rounded-2xl border border-primary/15 break-words">
              {announcement.summary}
            </p>

            <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed pt-1 break-words">
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
        </div>

        {/* 3. Footer Actions (Always Anchored at Bottom, Never Pushed Off-Screen) */}
        <div className="shrink-0 p-3 sm:p-4 px-4 sm:px-6 border-t border-border bg-card/95 backdrop-blur-xs flex items-center justify-between gap-2.5">
          <button
            onClick={() => handleDismiss("later")}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition min-h-[44px] active:scale-95"
          >
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap">⏱️ あとで読む</span>
          </button>

          <button
            onClick={() => handleDismiss("read")}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition shadow-sm min-h-[44px] active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">確認した</span>
          </button>
        </div>
      </div>
    </div>
  );
}

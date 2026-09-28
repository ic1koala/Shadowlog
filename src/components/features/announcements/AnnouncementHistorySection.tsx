"use client";

import { useState, useEffect } from "react";
import {
  allAnnouncements,
  getReadAnnouncementIds,
  getLaterAnnouncementIds,
  markAsRead,
  hasUnreadLaterAnnouncements,
} from "@/lib/storage/announcement-store";
import { Announcement } from "@/types";
import {
  Megaphone,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export function AnnouncementHistorySection() {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [laterIds, setLaterIds] = useState<string[]>([]);
  const [hasRedDot, setHasRedDot] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  const refreshState = () => {
    setReadIds(getReadAnnouncementIds());
    setLaterIds(getLaterAnnouncementIds());
    setHasRedDot(hasUnreadLaterAnnouncements());
  };

  useEffect(() => {
    refreshState();
    const handleUpdate = () => refreshState();
    window.addEventListener("shadowlog:announcements-update", handleUpdate);
    return () => window.removeEventListener("shadowlog:announcements-update", handleUpdate);
  }, []);

  const handleOpenDetail = (ann: Announcement) => {
    setSelectedAnn(ann);
    // Automatically mark as read once opened
    markAsRead(ann.id);
  };

  return (
    <>
      <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                <Megaphone className="w-5 h-5" />
              </div>
              {hasRedDot && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-card animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                お知らせ・アップデート履歴
                {hasRedDot && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    あとで読む項目あり
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                過去の新機能アップデート・広報からのお知らせを読み返せます。
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpenModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold text-foreground transition"
          >
            <span>履歴を見る ({allAnnouncements.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">お知らせ・アップデート一覧</h2>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
              {allAnnouncements.map((ann) => {
                const isRead = readIds.includes(ann.id);
                const isLater = laterIds.includes(ann.id) && !isRead;

                return (
                  <div
                    key={ann.id}
                    onClick={() => handleOpenDetail(ann)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLater
                        ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60"
                        : isRead
                        ? "bg-card border-border hover:bg-muted/40 opacity-85"
                        : "bg-primary/5 border-primary/20 hover:border-primary/50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ann.category === "update"
                              ? "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                              : ann.category === "important"
                              ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                              : "bg-purple-500/15 text-purple-600 border border-purple-500/30"
                          }`}
                        >
                          {ann.tagText}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {ann.publishedAt}
                        </span>
                        {isLater && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            あとで読む
                          </span>
                        )}
                        {isRead && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            既読
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{ann.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{ann.summary}</p>
                    </div>

                    <button className="self-end sm:self-center shrink-0 px-3 py-1.5 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground text-xs font-bold transition">
                      詳細を読む
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {selectedAnn.tagText}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {selectedAnn.publishedAt}
                </span>
              </div>
              <button
                onClick={() => setSelectedAnn(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto">
              <h2 className="text-lg font-bold text-foreground">{selectedAnn.title}</h2>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {selectedAnn.content}
              </p>
              {selectedAnn.actionUrl && (
                <div className="pt-2">
                  <a
                    href={selectedAnn.actionUrl}
                    target={selectedAnn.actionUrl.startsWith("http") ? "_blank" : "_self"}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <span>{selectedAnn.actionText || "リンクを開く"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 px-6 border-t border-border bg-muted/20 text-right">
              <button
                onClick={() => setSelectedAnn(null)}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

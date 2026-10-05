"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Industry, UserPlanType } from "@/types";
import {
  getCustomWordSlots,
  saveCustomWords,
  getSuggestedCustomWordChips,
  getCustomGenerateQuota,
  CustomGenerateQuotaStatus,
  SuggestedWordChip,
} from "@/lib/storage/custom-words-store";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles,
  Save,
  CheckCircle2,
  X,
  Flame,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

interface CustomWordsSectionProps {
  industry: Industry;
  plan?: UserPlanType;
  isLoggedIn?: boolean;
}

export function CustomWordsSection({
  industry,
  plan = "free",
  isLoggedIn = false,
}: CustomWordsSectionProps) {
  const [slots, setSlots] = useState<[string, string, string]>(["", "", ""]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [industryChips, setIndustryChips] = useState<SuggestedWordChip[]>([]);
  const [weakChips, setWeakChips] = useState<SuggestedWordChip[]>([]);
  const [quota, setQuota] = useState<CustomGenerateQuotaStatus | null>(null);

  useEffect(() => {
    setSlots(getCustomWordSlots());
    setQuota(getCustomGenerateQuota(plan));
  }, [plan]);

  useEffect(() => {
    const chips = getSuggestedCustomWordChips(industry);
    setIndustryChips(chips.industryChips);
    setWeakChips(chips.weakChips);
  }, [industry]);

  const handleSlotChange = (index: 0 | 1 | 2, value: string) => {
    setSlots((prev) => {
      const next: [string, string, string] = [...prev] as [string, string, string];
      next[index] = value;
      return next;
    });
    setIsSaved(false);
  };

  const handleClearSlot = (index: 0 | 1 | 2) => {
    handleSlotChange(index, "");
  };

  const handleSelectChip = (word: string) => {
    setSlots((prev) => {
      const next: [string, string, string] = [...prev] as [string, string, string];
      const existingIdx = next.findIndex(
        (s) => s.trim().toLowerCase() === word.trim().toLowerCase()
      );
      // If already selected, toggle it off
      if (existingIdx !== -1) {
        next[existingIdx] = "";
        return next;
      }
      // Find first empty slot
      const emptyIdx = next.findIndex((s) => s.trim().length === 0);
      if (emptyIdx !== -1) {
        next[emptyIdx] = word;
      } else {
        // Replace the 3rd slot if all 3 are full
        next[2] = word;
      }
      return next;
    });
    setIsSaved(false);
  };

  const handleSaveCustomWords = async () => {
    setIsSaving(true);
    try {
      const saved = saveCustomWords(slots);
      setSlots(getCustomWordSlots());

      // Best-effort cloud sync if logged in
      if (isLoggedIn) {
        try {
          const supabase = createClient();
          await supabase.auth.updateUser({
            data: { custom_words: saved },
          });
        } catch {
          // ignore cloud sync error
        }
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const filledCount = slots.filter((s) => s.trim().length > 0).length;

  return (
    <div
      id="section-custom-words"
      className="bg-card rounded-2xl p-5 sm:p-6 border border-primary/25 shadow-xs space-y-4 transition-all"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              ✨ カスタム生成用マイ単語（3単語登録）
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              登録中: {filledCount}/3語
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
            覚えたい英単語・熟語や日本語キーワードを最大3つ登録しておくと、練習画面の「✨ マイ単語で生成」ボタンから自然なオリジナル例文＆音声をワンタップ作成できます（空欄もOK）。
          </p>
        </div>

        {quota && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
            {quota.isCumulative
              ? `お試し残り ${quota.remaining}/${quota.limit}回`
              : `本日残り ${quota.remaining}/${quota.limit}回`}
          </span>
        )}
      </div>

      {/* 3 Word Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {([0, 1, 2] as const).map((idx) => (
          <div key={idx} className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
              <span>マイ単語 {idx + 1}</span>
              <span className="text-[10px] font-normal">英語・日本語OK</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={slots[idx]}
                onChange={(e) => handleSlotChange(idx, e.target.value)}
                placeholder={
                  idx === 0
                    ? "例: scalability"
                    : idx === 1
                    ? "例: align with"
                    : "例: 納期交渉 / bottleneck"
                }
                maxLength={40}
                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              {slots[idx].length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearSlot(idx)}
                  aria-label={`マイ単語 ${idx + 1} をクリア`}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Chips Section */}
      <div className="space-y-2.5 pt-1">
        {/* Industry Suggested Chips */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>選択中ジャンルのおすすめ語彙（タップで空き枠にセット）</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {industryChips.map((chip) => {
              const isSelected = slots.some(
                (s) => s.trim().toLowerCase() === chip.word.toLowerCase()
              );
              return (
                <button
                  key={chip.word}
                  type="button"
                  onClick={() => handleSelectChip(chip.word)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-muted/50 text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  + {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weak Word Chips (if user has unmastered weak words) */}
        {weakChips.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>あなたの復習カルテ（苦手単語）から選ぶ</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {weakChips.map((chip) => {
                const isSelected = slots.some(
                  (s) => s.trim().toLowerCase() === chip.word.toLowerCase()
                );
                return (
                  <button
                    key={chip.word}
                    type="button"
                    onClick={() => handleSelectChip(chip.word)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                      isSelected
                        ? "bg-orange-500 text-white border-orange-500 shadow-2xs"
                        : "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/25 hover:bg-orange-500/20"
                    }`}
                  >
                    🔥 {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Save Row */}
      <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {isSaved ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              マイ単語を保存しました！
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              ※ Baseプランは1日3回、Proプランは1日10回までマイ単語生成が可能です
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Link
            href="/practice"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition"
          >
            <span>練習画面へ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={handleSaveCustomWords}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition shadow-xs text-xs sm:text-sm min-h-[40px] disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>マイ単語を保存する</span>
          </button>
        </div>
      </div>
    </div>
  );
}

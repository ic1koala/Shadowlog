"use client";

import { useState, useEffect } from "react";
import {
  UserPersonaProfile,
  getPersonaProfile,
  savePersonaProfile,
  clearPersonaProfile,
  isPersonaEligible,
  PERSONA_ROLE_PRESETS,
  PERSONA_FIELD_PRESETS,
  PERSONA_SCENARIO_PRESETS,
} from "@/lib/storage/persona-store";
import { UserPlanType } from "@/types";
import {
  Sparkles,
  Lock,
  CheckCircle2,
  Save,
  RotateCcw,
  Briefcase,
  Layers,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface PersonaSettingsSectionProps {
  userPlan?: UserPlanType | null;
  onNavigateToPlans?: () => void;
}

const TONE_LABELS: Record<"casual" | "polite" | "executive", string> = {
  casual: "カジュアル",
  polite: "丁寧なビジネス",
  executive: "エグゼクティブ",
};

function formatPersonaSummaryLabel(profile: UserPersonaProfile): string {
  if (!profile.enabled) {
    return "ペルソナ特化オフ（通常出題モード）";
  }

  const parts: string[] = [];
  if (profile.jobRole?.trim()) parts.push(profile.jobRole.trim());
  if (profile.industryField?.trim()) parts.push(profile.industryField.trim());
  if (profile.targetScenario?.trim()) parts.push(profile.targetScenario.trim());
  if (profile.interestedTopics?.trim()) {
    parts.push(`重点: ${profile.interestedTopics.trim()}`);
  }

  const toneLabel = TONE_LABELS[profile.customTone || "polite"];
  if (parts.length === 0) {
    return `標準ビジネス（トーン: ${toneLabel}）`;
  }
  return `${parts.join(" × ")}（トーン: ${toneLabel}）`;
}

export function PersonaSettingsSection({
  userPlan,
  onNavigateToPlans,
}: PersonaSettingsSectionProps) {
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserPersonaProfile>({
    enabled: true,
    jobRole: "",
    industryField: "",
    targetScenario: "",
    interestedTopics: "",
    customTone: "polite",
  });
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [modalMessageBoxText, setModalMessageBoxText] = useState<string | null>(null);

  useEffect(() => {
    const eligible = isPersonaEligible(userPlan);
    setIsEligible(eligible);

    if (eligible) {
      const stored = getPersonaProfile();
      if (stored) {
        setProfile({
          enabled: stored.enabled !== false,
          jobRole: stored.jobRole || "",
          industryField: stored.industryField || "",
          targetScenario: stored.targetScenario || "",
          interestedTopics: stored.interestedTopics || "",
          customTone: stored.customTone || "polite",
        });
      }
    }
  }, [userPlan]);

  const handleSave = () => {
    savePersonaProfile(profile);
    const summaryLabel = formatPersonaSummaryLabel(profile);
    const completionMsg = `「${summaryLabel}」で設定が完了しました`;

    setIsSaved(true);
    setSaveMessage(completionMsg);
    setModalMessageBoxText(completionMsg);

    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  const handleReset = () => {
    if (window.confirm("ペルソナ設定をリセットしますか？")) {
      clearPersonaProfile();
      setProfile({
        enabled: true,
        jobRole: "",
        industryField: "",
        targetScenario: "",
        interestedTopics: "",
        customTone: "polite",
      });
      setIsSaved(true);
      setSaveMessage("ペルソナ設定を初期化しました。");
      setTimeout(() => {
        setIsSaved(false);
        setSaveMessage("");
      }, 3000);
    }
  };

  // Free / Guest View (styled with semantic theme tokens matching 学習設定)
  if (!isEligible) {
    return (
      <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border shadow-xs space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  ペルソナ設定
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Base / Pro専用
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                職種 × 専門業界 × 実践場面に完全パーソナライズされた出題
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-muted/40 border border-border/80 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">
                無料版はペルソナ設定不要です
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                無料会員様は事前のペルソナ設定を気にすることなく、標準の4つの業界別カテゴリ（IT・開発、ビジネス・財務、マーケ・企画、日常会話）から実践的な英文がバランスよく自動出題されます。すぐそのまま練習をお楽しみいただけます。
              </p>
            </div>
          </div>

          <div className="border-t border-border/60 pt-3 flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">
                Base / Proプランへのアップグレードで解禁
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                「自分の実務そのままの英語で特訓したい」「特定の業界（半導体、医療、SaaS等）や想定シチュエーション（商談、1on1、プレゼン等）に絞って毎日練習したい」という方は、有料プラン（BaseまたはPro）をご利用いただくことで、あなた専属のAIペルソナ英文を生成できます。
              </p>
            </div>
          </div>
        </div>

        {/* Feature Preview Card */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/70">
          <p className="text-xs font-bold text-foreground mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            ペルソナ設定で実現できること（例）
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-card border border-border">
              <span className="font-bold text-primary block mb-1">
                海外営業 × 製造業
              </span>
              <p className="text-muted-foreground leading-snug">
                海外顧客との価格交渉や納期調整、仕様すり合わせに直結する英語フレーズ
              </p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border">
              <span className="font-bold text-primary block mb-1">
                PdM / 開発 × IT・SaaS
              </span>
              <p className="text-muted-foreground leading-snug">
                朝のスタンドアップ、ロードマップ優先度調整、障害時ポストモーテムスピーチ
              </p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border">
              <span className="font-bold text-primary block mb-1">
                経営企画 × ヘルスケア
              </span>
              <p className="text-muted-foreground leading-snug">
                四半期レビュー、ステークホルダー説明、薬事・コンプライアンス関連の議論
              </p>
            </div>
          </div>
        </div>

        {onNavigateToPlans && (
          <button
            type="button"
            onClick={onNavigateToPlans}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <span>料金プランを確認・アップグレードする</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Eligible Users (Base, Pro, VIP) — Matched to 学習設定 color scheme
  return (
    <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                ペルソナ設定
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary">
                利用可能 (Base/Pro)
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              あなたの職種・業界・シチュエーションに完全特化した英文をAIが生成します
            </p>
          </div>
        </div>

        {/* Enabled Toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer self-start md:self-auto bg-muted/40 px-3.5 py-2 rounded-xl border border-border hover:border-primary/40 transition">
          <input
            type="checkbox"
            checked={profile.enabled}
            onChange={(e) => setProfile({ ...profile, enabled: e.target.checked })}
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
          />
          <span className="text-xs sm:text-sm font-bold text-foreground">
            {profile.enabled ? "ペルソナ特化を有効中" : "ペルソナ特化をオフ（通常出題）"}
          </span>
        </label>
      </div>

      {/* Inline Status Banner */}
      {saveMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      <div className={`space-y-6 ${!profile.enabled ? "opacity-50 pointer-events-none" : ""}`}>
        {/* 1. Job Role */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <span>あなたの職種・役職</span>
                <span className="text-[11px] text-rose-500 font-semibold">*推奨</span>
              </label>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                例: 海外営業、ソフトウェアエンジニア、PdM、経営企画、コンサルタントなど
              </p>
            </div>
            {profile.jobRole && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold truncate max-w-[160px]">
                現在: {profile.jobRole}
              </span>
            )}
          </div>

          <input
            type="text"
            value={profile.jobRole}
            onChange={(e) => setProfile({ ...profile, jobRole: e.target.value })}
            placeholder="職種を入力（例: 海外アカウントエグゼクティブ）"
            maxLength={60}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />

          <div className="flex flex-wrap gap-1.5">
            {PERSONA_ROLE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setProfile({ ...profile, jobRole: preset })}
                className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  profile.jobRole === preset
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/20"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Industry Field */}
        <div className="space-y-2.5 pt-3 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>専門業界・事業ドメイン</span>
                <span className="text-[11px] text-rose-500 font-semibold">*推奨</span>
              </label>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                例: 半導体・製造業、IT・SaaS、生成AI、医療・バイオ、Fintechなど
              </p>
            </div>
            {profile.industryField && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold truncate max-w-[160px]">
                現在: {profile.industryField}
              </span>
            )}
          </div>

          <input
            type="text"
            value={profile.industryField}
            onChange={(e) => setProfile({ ...profile, industryField: e.target.value })}
            placeholder="業界を入力（例: 半導体・エレクトロニクス）"
            maxLength={60}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />

          <div className="flex flex-wrap gap-1.5">
            {PERSONA_FIELD_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setProfile({ ...profile, industryField: preset })}
                className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  profile.industryField === preset
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/20"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Target Scenario */}
        <div className="space-y-2.5 pt-3 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>想定シチュエーション・使用場面</span>
                <span className="text-[11px] text-rose-500 font-semibold">*推奨</span>
              </label>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                英語を話す具体的なシーンを指定すると、より実戦的な表現が出題されます
              </p>
            </div>
            {profile.targetScenario && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold truncate max-w-[160px]">
                現在: {profile.targetScenario}
              </span>
            )}
          </div>

          <input
            type="text"
            value={profile.targetScenario}
            onChange={(e) => setProfile({ ...profile, targetScenario: e.target.value })}
            placeholder="使用場面を入力（例: 海外パートナーとの商談・契約交渉）"
            maxLength={80}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />

          <div className="flex flex-wrap gap-1.5">
            {PERSONA_SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setProfile({ ...profile, targetScenario: preset })}
                className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  profile.targetScenario === preset
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/20"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Interested Topics / Specific Keywords */}
        <div className="space-y-2.5 pt-3 border-t border-border/60">
          <div>
            <label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>重点キーワード・頻出トピック（任意）</span>
            </label>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              カンマ区切りで入力（例: 価格交渉, 納期遅延, 品質基準, API仕様, バグ報告）
            </p>
          </div>
          <input
            type="text"
            value={profile.interestedTopics || ""}
            onChange={(e) => setProfile({ ...profile, interestedTopics: e.target.value })}
            placeholder="例: コスト削減, 障害対応, 四半期KPI"
            maxLength={100}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        {/* 5. Custom Tone */}
        <div className="space-y-2.5 pt-3 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm sm:text-base font-bold text-foreground block">
                発話トーン・コミュニケーションスタイル
              </label>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                シチュエーションに合った英語の丁寧さ・フォーマル度を選択
              </p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              現在: {TONE_LABELS[profile.customTone || "polite"]}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: "casual" as const,
                title: "カジュアル",
                desc: "同僚との雑談や1on1、気さくなチーム内会話",
              },
              {
                id: "polite" as const,
                title: "丁寧なビジネス",
                desc: "標準的な顧客対応、会議、報告メール",
              },
              {
                id: "executive" as const,
                title: "エグゼクティブ",
                desc: "役員報告、プレゼンテーション、公式スピーチ",
              },
            ].map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() =>
                  setProfile({
                    ...profile,
                    customTone: tone.id,
                  })
                }
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  profile.customTone === tone.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40 bg-card"
                }`}
              >
                <span className="text-sm font-bold block text-foreground mb-0.5">
                  {tone.title}
                </span>
                <span className="text-[11px] text-muted-foreground leading-relaxed block">
                  {tone.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons Bar (Matching 学習設定) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>設定を初期化</span>
            </button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              次回の練習・スキマ特訓から反映されます
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            {isSaved && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                保存完了
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 transition shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ペルソナ設定を保存する</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Message Box Modal */}
      {modalMessageBoxText && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-foreground">
                  ペルソナ設定完了
                </h3>
                <p className="text-xs sm:text-sm font-bold text-primary leading-relaxed">
                  {modalMessageBoxText}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/50 border border-border/80 space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">状態:</span>
                <span className="font-bold text-foreground">
                  {profile.enabled ? "有効" : "オフ（通常出題）"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">職種・役職:</span>
                <span className="font-bold text-foreground text-right">
                  {profile.jobRole?.trim() || "未指定（全般）"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">専門業界:</span>
                <span className="font-bold text-foreground text-right">
                  {profile.industryField?.trim() || "未指定（全般）"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">想定場面:</span>
                <span className="font-bold text-foreground text-right">
                  {profile.targetScenario?.trim() || "未指定（全般）"}
                </span>
              </div>
              {profile.interestedTopics?.trim() && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">重点キーワード:</span>
                  <span className="font-bold text-foreground text-right">
                    {profile.interestedTopics.trim()}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">発話トーン:</span>
                <span className="font-bold text-foreground text-right">
                  {TONE_LABELS[profile.customTone || "polite"]}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalMessageBoxText(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition shadow-xs cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
    setIsSaved(true);
    setSaveMessage("ペルソナ設定を保存しました。次回の練習から反映されます。");
    setTimeout(() => {
      setIsSaved(false);
      setSaveMessage("");
    }, 3500);
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

  // If user is Free or Guest: Display simple notice explaining Free plan does not require persona setup
  if (!isEligible) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 md:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">ペルソナ設定</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Base / Pro専用
              </span>
            </div>
            <p className="text-sm text-slate-400">
              職種 × 専門業界 × 実践場面に完全パーソナライズされた出題
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-200">
                無料版はペルソナ設定不要です
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                無料会員様は事前のペルソナ設定を気にすることなく、標準の4つの業界別カテゴリ（IT・開発、ビジネス・財務、マーケ・企画、日常会話）から実践的な英文がバランスよく自動出題されます。すぐそのまま練習をお楽しみいただけます。
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-3 flex items-start gap-3">
            <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Base / Proプランへのアップグレードで解禁
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                「自分の実務そのままの英語で特訓したい」「特定の業界（半導体、医療、SaaS等）や想定シチュエーション（商談、1on1、プレゼン等）に絞って毎日練習したい」という方は、有料プラン（BaseまたはPro）をご利用いただくことで、あなた専属のAIペルソナ英文を無制限に生成できます。
              </p>
            </div>
          </div>
        </div>

        {/* Feature Preview Card */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 mb-6">
          <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            ペルソナ設定で実現できること（例）
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-semibold text-indigo-300 block mb-1">海外営業 × 製造業</span>
              <p className="text-slate-400 leading-snug">
                海外顧客との価格交渉や納期調整、仕様すり合わせに直結する英語フレーズ
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-semibold text-indigo-300 block mb-1">PdM / 開発 × IT・SaaS</span>
              <p className="text-slate-400 leading-snug">
                朝のスタンドアップ、ロードマップ優先度調整、障害時ポストモーテムスピーチ
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-semibold text-indigo-300 block mb-1">経営企画 × ヘルスケア</span>
              <p className="text-slate-400 leading-snug">
                四半期レビュー、ステークホルダー説明、薬事・コンプライアンス関連の議論
              </p>
            </div>
          </div>
        </div>

        {onNavigateToPlans && (
          <button
            onClick={onNavigateToPlans}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <span>料金プランを確認・アップグレードする</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Eligible Users (Base, Pro, VIP)
  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 md:p-8 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">ペルソナ設定</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                利用可能 (Base/Pro)
              </span>
            </div>
            <p className="text-sm text-slate-400">
              あなたの職種・業界・シチュエーションに完全特化した英文をAIが生成します
            </p>
          </div>
        </div>

        {/* Enabled Toggle */}
        <label className="flex items-center gap-3 cursor-pointer self-start md:self-auto bg-slate-800/60 px-4 py-2.5 rounded-xl border border-slate-700/60">
          <input
            type="checkbox"
            checked={profile.enabled}
            onChange={(e) => setProfile({ ...profile, enabled: e.target.checked })}
            className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
          />
          <span className="text-sm font-medium text-slate-200">
            {profile.enabled ? "ペルソナ特化を有効中" : "ペルソナ特化をオフ（通常出題）"}
          </span>
        </label>
      </div>

      {saveMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      <div className={`space-y-6 ${!profile.enabled ? "opacity-50 pointer-events-none" : ""}`}>
        {/* 1. Job Role */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-1.5 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>あなたの職種・役職</span>
            <span className="text-xs text-rose-400 font-normal">*推奨</span>
          </label>
          <p className="text-xs text-slate-400 mb-2">
            例: 海外営業、ソフトウェアエンジニア、PdM、経営企画、コンサルタントなど
          </p>
          <input
            type="text"
            value={profile.jobRole}
            onChange={(e) => setProfile({ ...profile, jobRole: e.target.value })}
            placeholder="職種を入力（例: 海外アカウントエグゼクティブ）"
            maxLength={60}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {PERSONA_ROLE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setProfile({ ...profile, jobRole: preset })}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  profile.jobRole === preset
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Industry Field */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-1.5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>専門業界・事業ドメイン</span>
            <span className="text-xs text-rose-400 font-normal">*推奨</span>
          </label>
          <p className="text-xs text-slate-400 mb-2">
            例: 半導体・製造業、IT・SaaS、生成AI、医療・バイオ、Fintechなど
          </p>
          <input
            type="text"
            value={profile.industryField}
            onChange={(e) => setProfile({ ...profile, industryField: e.target.value })}
            placeholder="業界を入力（例: 半導体・エレクトロニクス）"
            maxLength={60}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {PERSONA_FIELD_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setProfile({ ...profile, industryField: preset })}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  profile.industryField === preset
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Target Scenario */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-1.5 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>想定シチュエーション・使用場面</span>
            <span className="text-xs text-rose-400 font-normal">*推奨</span>
          </label>
          <p className="text-xs text-slate-400 mb-2">
            英語を話す具体的なシーンを指定すると、より実戦的な表現が出題されます
          </p>
          <input
            type="text"
            value={profile.targetScenario}
            onChange={(e) => setProfile({ ...profile, targetScenario: e.target.value })}
            placeholder="使用場面を入力（例: 海外パートナーとの商談・契約交渉）"
            maxLength={80}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {PERSONA_SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setProfile({ ...profile, targetScenario: preset })}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  profile.targetScenario === preset
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Interested Topics / Specific Keywords */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-1.5 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>重点キーワード・頻出トピック（任意）</span>
          </label>
          <p className="text-xs text-slate-400 mb-2">
            カンマ区切りで入力（例: 価格交渉, 納期遅延, 品質基準, API仕様, バグ報告）
          </p>
          <input
            type="text"
            value={profile.interestedTopics || ""}
            onChange={(e) => setProfile({ ...profile, interestedTopics: e.target.value })}
            placeholder="例: コスト削減, 障害対応, 四半期KPI"
            maxLength={100}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* 5. Custom Tone */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            発話トーン・コミュニケーションスタイル
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: "casual",
                title: "カジュアル",
                desc: "同僚との雑談や1on1、気さくなチーム内会話",
              },
              {
                id: "polite",
                title: "丁寧なビジネス",
                desc: "標準的な顧客対応、会議、報告メール",
              },
              {
                id: "executive",
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
                    customTone: tone.id as "casual" | "polite" | "executive",
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  profile.customTone === tone.id
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500"
                    : "bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span className="text-sm font-semibold block text-slate-200 mb-0.5">
                  {tone.title}
                </span>
                <span className="text-xs text-slate-400 leading-snug block">
                  {tone.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>設定を初期化</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>ペルソナ設定を保存する</span>
          </button>
        </div>
      </div>
    </div>
  );
}

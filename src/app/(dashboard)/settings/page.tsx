"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DifficultyLevel, Industry } from "@/types";
import { AssessmentResult } from "@/lib/assessment/assessment-engine";
import {
  Settings,
  Save,
  CheckCircle2,
  Briefcase,
  BarChart,
  Sparkles,
  Target,
  Calendar,
  ArrowRight,
  Mic,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [industry, setIndustry] = useState<Industry>("tech");
  const [level, setLevel] = useState<DifficultyLevel>("intermediate");
  const [isSaved, setIsSaved] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [assessmentDate, setAssessmentDate] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");

  useEffect(() => {
    // Load audio devices
    if (typeof window !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
      }).catch(() => {});
    }

    try {
      const savedMicId = localStorage.getItem("shadowlog_mic_device_id") || "";
      setSelectedMicId(savedMicId);
    } catch {}
  }, []);

  const handleMicChange = (deviceId: string) => {
    setSelectedMicId(deviceId);
    try {
      if (deviceId) {
        localStorage.setItem("shadowlog_mic_device_id", deviceId);
        const found = audioDevices.find((d) => d.deviceId === deviceId);
        if (found?.label) {
          localStorage.setItem("shadowlog_mic_device_label", found.label);
        }
      } else {
        localStorage.removeItem("shadowlog_mic_device_id");
        localStorage.removeItem("shadowlog_mic_device_label");
      }
    } catch {}
  };

  useEffect(() => {
    try {
      const savedIndustry = localStorage.getItem("shadowlog_industry") as Industry;
      const savedLevel = localStorage.getItem("shadowlog_level") as DifficultyLevel;
      if (savedIndustry) setIndustry(savedIndustry);
      if (savedLevel) setLevel(savedLevel);

      // Load assessment result if exists
      const savedResult = localStorage.getItem("shadowlog_assessment_result");
      const savedDate = localStorage.getItem("shadowlog_assessment_date");
      if (savedResult) {
        setAssessmentResult(JSON.parse(savedResult) as AssessmentResult);
      }
      if (savedDate) {
        setAssessmentDate(savedDate);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem("shadowlog_industry", industry);
      localStorage.setItem("shadowlog_level", level);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch {
      alert("設定の保存に失敗しました。");
    }
  };

  const handleStartAssessment = () => {
    router.push("/settings/assessment");
  };

  const industries: Array<{ key: Industry; label: string; desc: string }> = [
    { key: "tech", label: "Tech / IT", desc: "クラウド、AI、アジャイル開発、API、障害対応など" },
    { key: "business", label: "Business", desc: "経営戦略、商談、プロジェクトマネジメント、会議など" },
    { key: "finance", label: "Finance", desc: "四半期決算、投資、リスク管理、市場動向など" },
    { key: "medical", label: "Medical", desc: "臨床研究、医療技術、ヘルスケア、患者対応など" },
    { key: "marketing", label: "Marketing", desc: "ブランド戦略、デジタル広告、顧客維持、分析など" },
    { key: "daily", label: "Daily / General", desc: "日常会話、旅行、食事、カジュアルな交流など" },
  ];

  const levels: Array<{ key: DifficultyLevel; label: string; words: string; desc: string }> = [
    {
      key: "beginner",
      label: "初級 (Beginner)",
      words: "6 〜 10語",
      desc: "基本語彙とシンプルな構文。基礎的なリズムを掴みたい方に最適です。",
    },
    {
      key: "intermediate",
      label: "中級 (Intermediate)",
      words: "12 〜 18語",
      desc: "複合文やビジネス表現。実務で通用する滑らかな発話を目指す方に最適です。",
    },
    {
      key: "advanced",
      label: "上級 (Advanced)",
      words: "20 〜 30語",
      desc: "長文・関係詞・高度な業界用語。プレゼンやハイレベルな議論向けです。",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 sm:space-y-8 pb-16 sm:pb-8">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
          学習設定
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          あなたの業種や目標レベルに合わせて、AIが生成するシャドーイング英文を最適化します。
        </p>
      </div>

      {/* Auto-Assessment Section */}
      <div className="bg-card rounded-2xl p-5 sm:p-8 border-2 border-primary/20 shadow-sm space-y-4 sm:space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Target className="w-24 h-24 text-primary" />
        </div>

        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Sparkles className="w-5 h-5 text-primary" />
          <span>レベル自動判定</span>
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] sm:text-xs font-bold rounded-full">
            おすすめ
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          10問のシャドーイングテストで、あなたの英語力を自動測定。
          初級→中級→上級の例文に段階的に挑戦し、最適な難易度を判定します。
          所要時間は約5〜10分です。
        </p>

        {/* Previous result */}
        {assessmentResult && assessmentDate && (
          <div className="p-3 sm:p-4 rounded-xl bg-muted/50 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                前回の判定結果
              </p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(assessmentDate).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-lg border text-sm font-bold ${
                assessmentResult.recommendedLevel === "beginner"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600"
                  : assessmentResult.recommendedLevel === "intermediate"
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-600"
                  : "bg-purple-500/15 border-purple-500/30 text-purple-600"
              }`}>
                {assessmentResult.recommendedLevel === "beginner" ? "初級" :
                 assessmentResult.recommendedLevel === "intermediate" ? "中級" : "上級"}
              </span>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
                <span>初級 {assessmentResult.beginnerAvg}%</span>
                <span className="text-border">|</span>
                <span>中級 {assessmentResult.intermediateAvg}%</span>
                <span className="text-border">|</span>
                <span>上級 {assessmentResult.advancedAvg}%</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleStartAssessment}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-sm active:scale-95 min-h-[48px] text-base sm:text-sm"
        >
          <Target className="w-5 h-5" />
          {assessmentResult ? "再テストを受ける" : "判定テストを開始する"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Industry Selection */}
      <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-4 sm:space-y-5">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm sm:text-base">
          <Briefcase className="w-5 h-5 text-primary" />
          <span>学習する業種・ドメイン</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {industries.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setIndustry(item.key)}
              className={`p-3.5 sm:p-4 rounded-xl border text-left transition min-h-[56px] ${
                industry === item.key
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40 bg-card"
              }`}
            >
              <p className="font-bold text-sm text-foreground">{item.label}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Level Selection (Manual) */}
      <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm sm:text-base">
            <BarChart className="w-5 h-5 text-primary" />
            <span>難易度レベル</span>
          </div>
          {assessmentResult && (
            <span className="text-[10px] sm:text-xs text-primary font-medium">
              ※ 自動判定で設定済み
            </span>
          )}
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {levels.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLevel(item.key)}
              className={`w-full p-3.5 sm:p-4 rounded-xl border text-left flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 transition min-h-[56px] ${
                level === item.key
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40 bg-card"
              }`}
            >
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-foreground">{item.label}</p>
                  <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                    {item.words}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Microphone Input Device Selection */}
      <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-4 sm:space-y-5">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm sm:text-base">
          <Mic className="w-5 h-5 text-primary" />
          <span>録音マイクの設定 (Bluetooth / 外部マイク)</span>
        </div>

        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
          シャドーイング録音で使用するマイクを選択します。Bluetoothヘッドセットや外部マイクを優先設定でき、次回以降の練習時にも自動で引き継がれます。
        </p>

        <div className="space-y-2">
          <select
            value={selectedMicId}
            onChange={(e) => handleMicChange(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
            aria-label="優先マイクを選択"
          >
            <option value="">システムのデフォルトマイク</option>
            {audioDevices.map((device, idx) => (
              <option key={device.deviceId || idx} value={device.deviceId}>
                {device.label || `マイク ${idx + 1}`}
              </option>
            ))}
          </select>
          {selectedMicId && (
            <p className="text-[10px] sm:text-xs text-primary font-medium pl-1">
              ✓ 選択したマイクは次回以降も自動で優先接続されます
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-1 sm:pt-2">
        {isSaved && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            設定を保存しました
          </span>
        )}
        <button
          onClick={handleSave}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-sm active:scale-95 min-h-[48px]"
        >
          <Save className="w-4 h-4" />
          設定を保存する
        </button>
      </div>
    </div>
  );
}

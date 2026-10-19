"use client";

import { useState } from "react";
import { playWordAudio } from "@/lib/audio/word-speaker";
import {
  DiffResult,
  CoachFeedback,
  WPMInfo,
  PracticeMode,
  AzureAssessmentResult,
} from "@/types";
import {
  TrendingUp,
  Sparkles,
  GraduationCap,
  MessageSquareQuote,
  Gauge,
  Crown,
  Volume2,
  Lightbulb,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface DiffViewerProps {
  diff: DiffResult | null;
  transcription: string;
  coachFeedback?: CoachFeedback;
  wpmInfo?: WPMInfo;
  azureAssessment?: AzureAssessmentResult;
  mode?: PracticeMode;
  onSaveSession?: () => void;
  onRetry?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  retryCount?: number;
}

export function DiffViewer({
  diff,
  transcription,
  coachFeedback,
  wpmInfo,
  azureAssessment,
  mode = "sentence",
  onSaveSession,
  onRetry,
  isSaving = false,
  isSaved = false,
  retryCount = 0,
}: DiffViewerProps) {
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

  const handlePlayWord = (rawWord: string) => {
    const clean = rawWord.replace(/^[^\w]+|[^\w]+$/g, "").trim();
    if (!clean) return;
    setSpeakingWord(clean);
    void playWordAudio(clean, {
      onEnd: () => setSpeakingWord((cur) => (cur === clean ? null : cur)),
      onError: () => setSpeakingWord((cur) => (cur === clean ? null : cur)),
    });
  };

  if (!diff) return null;

  const score = azureAssessment ? azureAssessment.overallScore : diff.accuracyScore;
  const scoreColor =
    score >= 80
      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : score >= 60
      ? "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10";

  return (
    <div className="w-full bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-5 sm:space-y-6 animate-in fade-in-50 duration-300">
      {/* ── Mock Alert Notice Banner ── */}
      {azureAssessment?.isMock && (
        <div className="p-3.5 sm:p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-1 animate-in fade-in duration-300">
          <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <span>⚠️</span>
            <span>【管理者PoC】Azure AI モック評価稼働中（固定デモ値: {azureAssessment.overallScore}%）</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed pl-5">
            {azureAssessment.mockReason ||
              "サーバー環境変数に AZURE_SPEECH_KEY が設定されていないため、テスト用の固定デモ値（88%）が表示されています。Vercelの環境変数にキーを設定すると実APIとのリアルタイム照合が有効になります。"}
          </p>
        </div>
      )}

      {/* ── Environment Smart Mention Banner (Noise / Mic Distance / Silence Advice) ── */}
      {azureAssessment?.environmentMention && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-300 ${
            azureAssessment.environmentMention.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
              : "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200"
          }`}
        >
          <span className="text-lg shrink-0 mt-0.5">📢</span>
          <div className="space-y-0.5 flex-1">
            <span className="font-bold block">
              {azureAssessment.environmentMention.type === "warning"
                ? "音響環境アドバイス"
                : "マイク入力アドバイス"}
            </span>
            <p className="leading-relaxed opacity-95">
              {azureAssessment.environmentMention.message}
            </p>
          </div>
        </div>
      )}

      {/* Header & Score — stacked on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              発話判定結果
            </h3>
            {azureAssessment && (
              azureAssessment.isMock ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  ⚠️ Azure AI モック (キー未設定)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  ⚡ Azure AI Live音素判定
                </span>
              )
            )}
            {mode === "passage" && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                長文スピーチ
              </span>
            )}
            {retryCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                リトライ {retryCount}回目
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            {azureAssessment
              ? azureAssessment.isMock
                ? "※ Azure Speech APIキー未設定のため、固定モック値が表示されています"
                : "Azure AI Speech 音素（Phoneme）波形直接照合による4軸発音評価"
              : "Whisper音声認識によるテキスト照合と差分解析"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* WPM Speed Badge */}
          {wpmInfo && (
            <div className="px-3 py-1.5 rounded-xl border border-border bg-muted/40 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold">話速 (WPM)</p>
                <p className="text-sm font-bold font-mono text-foreground">
                  {wpmInfo.wpm} <span className="text-[10px] font-normal text-muted-foreground">語/分</span>
                </p>
              </div>
            </div>
          )}

          <div className={`px-4 py-2 rounded-2xl border font-bold text-xl flex items-center gap-1.5 ${scoreColor}`}>
            <TrendingUp className="w-5 h-5" />
            {score}%
          </div>
          <div className="text-right">
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              {azureAssessment ? "発音総合点" : "正解単語数"}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {azureAssessment
                ? `${azureAssessment.overallScore} / 100点`
                : `${diff.matchedWordCount} / ${diff.originalWordCount}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Azure 4-Axis Scores Grid (Accuracy, Fluency, Completeness, Prosody) ── */}
      {azureAssessment && (
        <div className="space-y-2">
          <label className="text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-primary" />
            <span>Azure発音4軸スコア分析</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-card border border-border text-center shadow-2xs">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold block">
                正確度 (Accuracy)
              </span>
              <span className="text-base sm:text-lg font-black text-foreground mt-0.5 block">
                {azureAssessment.accuracyScore}点
              </span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center shadow-2xs">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold block">
                流暢さ (Fluency)
              </span>
              <span className="text-base sm:text-lg font-black text-foreground mt-0.5 block">
                {azureAssessment.fluencyScore}点
              </span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center shadow-2xs">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold block">
                完全性 (Completeness)
              </span>
              <span className="text-base sm:text-lg font-black text-foreground mt-0.5 block">
                {azureAssessment.completenessScore}点
              </span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center shadow-2xs">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold block">
                抑揚・リズム (Prosody)
              </span>
              <span className="text-base sm:text-lg font-black text-foreground mt-0.5 block">
                {azureAssessment.prosodyScore}点
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Diff Tokens View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <label className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            {azureAssessment ? "単語別音素判定ハイライト" : "単語別差分ハイライト"}
          </label>
          <span className="text-[11px] text-muted-foreground/85 flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-primary inline" />
            単語をタップしてネイティブ発音を聴く
          </span>
        </div>
        <div className="p-3 sm:p-6 bg-muted/30 rounded-2xl border border-border/80 flex flex-wrap items-center gap-1.5 sm:gap-2 text-base sm:text-lg font-medium leading-relaxed">
          {azureAssessment && azureAssessment.words.length > 0
            ? azureAssessment.words.map((w, idx) => {
                const isSpeaking = speakingWord === w.word.replace(/^[^\w]+|[^\w]+$/g, "").trim();
                const activeRing = isSpeaking ? "ring-2 ring-primary scale-105" : "";

                if (w.errorType === "None") {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlayWord(w.word)}
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-lg shadow-xs text-sm sm:text-lg cursor-pointer hover:opacity-90 active:scale-95 transition ${activeRing}`}
                      title={`正確度: ${w.accuracyScore}点（タップで発音再生）`}
                    >
                      {isSpeaking && <Volume2 className="w-3 h-3 mr-1 inline animate-pulse text-emerald-600 dark:text-emerald-400" />}
                      {w.word}
                    </button>
                  );
                }
                if (w.errorType === "Mispronunciation") {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlayWord(w.word)}
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 rounded-lg text-sm sm:text-lg cursor-pointer hover:opacity-90 active:scale-95 transition ${activeRing}`}
                      title={`発音改善が必要 (スコア: ${w.accuracyScore}点 / タップで発音再生)`}
                    >
                      {isSpeaking && <Volume2 className="w-3 h-3 mr-1 inline animate-pulse text-orange-600 dark:text-orange-400" />}
                      {w.word}
                      <span className="text-[10px] sm:text-xs ml-1 opacity-75">
                        ({w.accuracyScore}点)
                      </span>
                    </button>
                  );
                }
                if (w.errorType === "Omission") {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlayWord(w.word)}
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-lg line-through opacity-80 text-sm sm:text-lg cursor-pointer hover:opacity-90 active:scale-95 transition ${activeRing}`}
                      title="脱落（発音されなかった単語 / タップで発音再生）"
                    >
                      {isSpeaking && <Volume2 className="w-3 h-3 mr-1 inline animate-pulse text-rose-600 dark:text-rose-400" />}
                      {w.word}
                    </button>
                  );
                }
                if (w.errorType === "Insertion") {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlayWord(w.word)}
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-lg text-sm sm:text-lg cursor-pointer hover:opacity-90 active:scale-95 transition ${activeRing}`}
                      title="余分な発音（タップで発音再生）"
                    >
                      {isSpeaking && <Volume2 className="w-3 h-3 mr-1 inline animate-pulse text-purple-600 dark:text-purple-400" />}
                      +{w.word}
                    </button>
                  );
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePlayWord(w.word)}
                    className="cursor-pointer hover:text-primary transition"
                  >
                    {w.word}
                  </button>
                );
              })
            : diff.tokens.map((token, idx) => {
                const isSpeaking = speakingWord === token.word.replace(/^[^\w]+|[^\w]+$/g, "").trim();
                const activeRing = isSpeaking ? "ring-2 ring-primary scale-105" : "";

                if (token.status === "match") {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlayWord(token.word)}
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-lg shadow-xs text-sm sm:text-lg cursor-pointer hover:opacity-90 active:scale-95 transition ${activeRing}`}
                      title="一致（タップで発音再生）"
                    >
                      {isSpeaking && <Volume2 className="w-3 h-3 mr-1 inline animate-pulse text-emerald-600 dark:text-emerald-400" />}
                      {token.word}
                    </button>
                  );
                }
                if (token.status === "missing") {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlayWord(token.word)}
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-lg line-through opacity-80 text-sm sm:text-lg cursor-pointer hover:opacity-90 active:scale-95 transition ${activeRing}`}
                      title="脱落（発音されなかった単語 / タップで発音再生）"
                    >
                      {isSpeaking && <Volume2 className="w-3 h-3 mr-1 inline animate-pulse text-rose-600 dark:text-rose-400" />}
                      {token.word}
                    </button>
                  );
                }
                if (token.status === "extra") {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlayWord(token.word)}
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg text-sm sm:text-lg cursor-pointer hover:opacity-90 active:scale-95 transition ${activeRing}`}
                      title="余剰（元の文にない単語 / タップで発音再生）"
                    >
                      {isSpeaking && <Volume2 className="w-3 h-3 mr-1 inline animate-pulse text-amber-600 dark:text-amber-400" />}
                      +{token.word}
                    </button>
                  );
                }
                if (token.status === "mismatch") {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlayWord(token.word)}
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 rounded-lg text-sm sm:text-lg cursor-pointer hover:opacity-90 active:scale-95 transition ${activeRing}`}
                      title={`誤読・発音のズレ（認識: ${token.spokenWord} / タップで発音再生）`}
                    >
                      {isSpeaking && <Volume2 className="w-3 h-3 mr-1 inline animate-pulse text-orange-600 dark:text-orange-400" />}
                      {token.word}
                      <span className="text-[10px] sm:text-xs ml-1 opacity-75">
                        ({token.spokenWord})
                      </span>
                    </button>
                  );
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePlayWord(token.word)}
                    className="cursor-pointer hover:text-primary transition"
                  >
                    {token.word}
                  </button>
                );
              })}
        </div>
      </div>

      {/* Transcription Raw Text */}
      <div className="space-y-1.5 bg-muted/20 p-3 sm:p-4 rounded-xl border border-border text-sm">
        <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
          {azureAssessment ? "Azure認識テキスト:" : "音声認識テキスト (Whisper):"}
        </p>
        <p className="italic text-foreground font-mono text-xs sm:text-sm break-all">
          &ldquo;{transcription || "（音声が認識されませんでした）"}&rdquo;
        </p>
      </div>

      {/* Token status legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-muted-foreground px-1 py-0.5">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{" "}
          {azureAssessment ? "発音良好" : "一致"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />{" "}
          {azureAssessment ? "発音改善要" : "ズレ"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 脱落
        </span>
        {azureAssessment ? (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> 余剰
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 余剰
          </span>
        )}
      </div>

      {/* AI English Coach Review Section */}
      {coachFeedback && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <h4 className="font-bold text-sm sm:text-base">英会話コーチの指導レビュー</h4>
          </div>

          {/* Overall Comment */}
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground leading-relaxed bg-white/70 dark:bg-card/70 p-3 sm:p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
            <MessageSquareQuote className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="font-medium">{coachFeedback.overallComment}</p>
          </div>

          {/* Pronunciation & Linking Advice */}
          <div className="space-y-1.5 text-xs sm:text-sm text-foreground leading-relaxed pl-1">
            <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              発音・音声変化（リンキング・弱形）のアドバイス
            </p>
            <p className="text-muted-foreground pl-3 text-xs sm:text-sm leading-relaxed">
              {coachFeedback.pronunciationAdvice}
            </p>
          </div>

          {/* Pacing & Chunking Advice (Long Passage) */}
          {coachFeedback.pacingAdvice && (
            <div className="space-y-1.5 text-xs sm:text-sm text-foreground leading-relaxed pl-1">
              <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-xs">
                <Gauge className="w-3.5 h-3.5 text-primary" />
                話速（WPM）＆息継ぎ（チャンキング）の指導
              </p>
              <p className="text-muted-foreground pl-3 text-xs sm:text-sm leading-relaxed">
                {coachFeedback.pacingAdvice}
              </p>
            </div>
          )}

          {/* Retry Focus Point (Actionable for repetition) */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold mr-1">復習のワンポイント:</span>
              <span>{coachFeedback.retryFocusPoint}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons: Retry / Save */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-border">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl font-bold text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition shadow-xs active:scale-95 min-h-[48px] sm:min-h-0"
            title="コーチのアドバイスを意識してもう一度発話する"
          >
            <RotateCcw className="w-4 h-4 text-primary" />
            もう一度復習する
          </button>
        )}

        {onSaveSession && (
          <button
            onClick={onSaveSession}
            disabled={isSaving || isSaved}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl font-medium text-sm transition shadow-xs min-h-[48px] sm:min-h-0 ${
              isSaved
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSaved ? "実績に自動反映済み" : isSaving ? "記録中..." : "記録を保存する"}
          </button>
        )}
      </div>
    </div>
  );
}

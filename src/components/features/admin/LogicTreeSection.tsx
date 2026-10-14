"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  ExternalLink,
  GitBranch,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import {
  LOGIC_TREE_DATA,
  LogicTreeNode,
  LogicTreeStatus,
} from "@/lib/admin/logic-tree-data";

type StatusFilter = "all" | LogicTreeStatus;

const STATUS_META: Record<
  LogicTreeStatus,
  { label: string; dot: string; chip: string }
> = {
  completed: {
    label: "実装完了",
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  in_progress: {
    label: "進行中",
    dot: "bg-blue-500",
    chip: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  idea: {
    label: "検討中",
    dot: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  pending: {
    label: "保留",
    dot: "bg-slate-400",
    chip: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30",
  },
};

const PRIORITY_LABEL = { high: "🔥 高", medium: "⚡️ 中", low: "🌱 低" } as const;

/** ノード自身または子孫が条件に一致するかを判定 */
function matches(node: LogicTreeNode, query: string, status: StatusFilter): boolean {
  const q = query.trim().toLowerCase();
  const selfHit =
    (status === "all" || node.status === status) &&
    (!q ||
      `${node.title} ${node.summary} ${node.notes}`.toLowerCase().includes(q));
  if (selfHit) return true;
  return (node.children ?? []).some((c) => matches(c, query, status));
}

function collectIds(node: LogicTreeNode, acc: string[] = []): string[] {
  if (node.children?.length) {
    acc.push(node.id);
    node.children.forEach((c) => collectIds(c, acc));
  }
  return acc;
}

function countByStatus(node: LogicTreeNode, acc: Record<LogicTreeStatus, number>) {
  acc[node.status] += 1;
  node.children?.forEach((c) => countByStatus(c, acc));
  return acc;
}

/**
 * 改善ロジックツリーのモバイル最適化ビュー（管理者ダッシュボード用・閲覧専用）
 * キャンバス版（public/logic-tree.html）のパン&ズームは狭い画面で扱いづらいため、
 * 縦スクロールのアコーディオン形式で表示する。
 */
export function LogicTreeSection() {
  const root = LOGIC_TREE_DATA;
  const branches = root.children ?? [];

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  // 初期状態: 大ブランチのみ閉じた状態（一覧性を優先）
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());

  const counts = useMemo(
    () => countByStatus(root, { completed: 0, in_progress: 0, idea: 0, pending: 0 }),
    [root]
  );
  const allIds = useMemo(() => collectIds(root), [root]);
  const isFiltering = query.trim() !== "" || statusFilter !== "all";

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const renderNode = (node: LogicTreeNode, depth: number) => {
    if (!matches(node, query, statusFilter)) return null;
    const meta = STATUS_META[node.status];
    const hasChildren = !!node.children?.length;
    // 検索・絞り込み中は該当箇所が見えるよう自動展開
    const isOpen = isFiltering || openIds.has(node.id);
    const notesOpen = openNotes.has(node.id);

    return (
      <li key={node.id} className="space-y-2">
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => hasChildren && toggle(openIds, node.id, setOpenIds)}
            className={`w-full text-left p-3 flex items-start gap-2.5 ${
              hasChildren ? "active:bg-muted/60" : "cursor-default"
            }`}
            aria-expanded={hasChildren ? isOpen : undefined}
          >
            <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
            <span className="flex-1 min-w-0 space-y-1">
              <span className="block text-sm font-bold leading-snug text-foreground break-words">
                {node.title}
              </span>
              {node.summary && (
                <span className="block text-xs leading-relaxed text-muted-foreground break-words">
                  {node.summary}
                </span>
              )}
              <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.chip}`}
                >
                  {meta.label}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  優先度 {PRIORITY_LABEL[node.priority]}
                </span>
                {hasChildren && (
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    ・{node.children!.length}項目
                  </span>
                )}
              </span>
            </span>
            {hasChildren && (
              <ChevronDown
                className={`w-5 h-5 mt-0.5 shrink-0 text-muted-foreground transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {node.notes && (
            <div className="border-t border-border/60">
              <button
                type="button"
                onClick={() => toggle(openNotes, node.id, setOpenNotes)}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-muted-foreground active:bg-muted/60"
              >
                <StickyNote className="w-3.5 h-3.5" />
                {notesOpen ? "議論メモを閉じる" : "議論メモ・技術仕様を見る"}
              </button>
              {notesOpen && (
                <p className="px-3 pb-3 text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
                  {node.notes}
                </p>
              )}
            </div>
          )}
        </div>

        {hasChildren && isOpen && (
          <ul
            className={`space-y-2 border-l-2 border-primary/20 ${
              depth === 0 ? "ml-2 pl-3" : "ml-1.5 pl-2.5"
            }`}
          >
            {node.children!.map((c) => renderNode(c, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-emerald-500/10 border border-primary/20 space-y-2">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <GitBranch className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-foreground leading-snug">
              {root.title}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              {root.summary}
            </p>
          </div>
        </div>
        <a
          href="/logic-tree.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          編集はキャンバス版（PC推奨）で開く
        </a>
      </div>

      {/* Status filter chips (tap to filter) */}
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(STATUS_META) as LogicTreeStatus[]).map((s) => {
          const active = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(active ? "all" : s)}
              className={`rounded-xl border p-2 text-center transition ${
                active
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border bg-card active:bg-muted"
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <span className={`w-2 h-2 rounded-full ${STATUS_META[s].dot}`} />
                <span className="text-lg font-black text-foreground leading-none">
                  {counts[s]}
                </span>
              </span>
              <span className="block text-[10px] font-semibold text-muted-foreground mt-1">
                {STATUS_META[s].label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + expand controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="キーワードで検索"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-card text-base sm:text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
              aria-label="検索をクリア"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpenIds(new Set(allIds))}
          className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground active:bg-muted"
          aria-label="すべて展開"
          title="すべて展開"
        >
          <ChevronsUpDown className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpenIds(new Set())}
          className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground active:bg-muted"
          aria-label="すべて折りたたむ"
          title="すべて折りたたむ"
        >
          <ChevronsDownUp className="w-4 h-4" />
        </button>
      </div>

      {statusFilter !== "all" && (
        <p className="text-xs text-muted-foreground">
          「{STATUS_META[statusFilter].label}」で絞り込み中・
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="font-semibold text-primary"
          >
            解除
          </button>
        </p>
      )}

      {/* Tree */}
      <ul className="space-y-3 pb-8">
        {branches.map((b) => renderNode(b, 0))}
      </ul>
      {branches.every((b) => !matches(b, query, statusFilter)) && (
        <p className="text-center text-sm text-muted-foreground py-8">
          該当する項目がありません
        </p>
      )}
    </div>
  );
}

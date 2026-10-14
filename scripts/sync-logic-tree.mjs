#!/usr/bin/env node
/**
 * public/logic-tree.html の INITIAL_TREE_DATA を抽出し、
 * 管理者ダッシュボード用の src/lib/admin/logic-tree-data.ts を再生成する。
 *
 * 使い方: node scripts/sync-logic-tree.mjs
 */
import fs from "node:fs";

const html = fs.readFileSync("public/logic-tree.html", "utf8");
const marker = "const INITIAL_TREE_DATA = ";
const start = html.indexOf(marker) + marker.length;
const end = html.indexOf("// State Variables");
const literal = html.slice(start, end).trim().replace(/;$/, "");
const tree = new Function(`return (${literal})`)();

const strip = (n) => {
  const o = {
    id: n.id,
    title: n.title,
    summary: n.summary || "",
    status: n.status,
    priority: n.priority,
    notes: n.notes || "",
  };
  if (n.children && n.children.length) o.children = n.children.map(strip);
  return o;
};

const out = `/**
 * 改善ロジックツリーのデータ (public/logic-tree.html の INITIAL_TREE_DATA と同期)
 * 管理者ダッシュボードの「ロジックツリー」タブ (モバイル最適化表示) で使用。
 * HTML版を更新した際は \`node scripts/sync-logic-tree.mjs\` で再生成してください。
 */
export type LogicTreeStatus = "completed" | "in_progress" | "idea" | "pending";
export type LogicTreePriority = "high" | "medium" | "low";

export interface LogicTreeNode {
  id: string;
  title: string;
  summary: string;
  status: LogicTreeStatus;
  priority: LogicTreePriority;
  notes: string;
  children?: LogicTreeNode[];
}

export const LOGIC_TREE_DATA: LogicTreeNode = ${JSON.stringify(strip(tree), null, 2)};
`;

fs.writeFileSync("src/lib/admin/logic-tree-data.ts", out);
console.log("✅ src/lib/admin/logic-tree-data.ts を再生成しました");

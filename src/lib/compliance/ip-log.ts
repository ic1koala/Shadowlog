export interface IPComplianceLogEntry {
  id: string;
  timestamp: string;
  category: "trademark" | "copyright" | "patent" | "general";
  rank: "A" | "B" | "C";
  title: string;
  status: "completed" | "in_progress" | "reviewed";
  details: string;
  actionTaken: string;
  reviewer: string;
}

export const IP_COMPLIANCE_LOGS: IPComplianceLogEntry[] = [
  {
    id: "IP-LOG-001",
    timestamp: "2026-09-28T23:08:00+09:00",
    category: "trademark",
    rank: "A",
    title: "サードパーティ商標（OpenAI）のガバナンス対応",
    status: "completed",
    details: "OpenAI Brand Guidelinesに準拠するため、アプリダッシュボード下部に 'Powered by OpenAI API (GPT-4o-mini, Whisper, TTS-1)' 表記を追加。",
    actionTaken: "アプリダッシュボード最下部に正式なライセンス・商標表記フッターを実装完了",
    reviewer: "ShadowLog 法務・知財統括チーム",
  },
  {
    id: "IP-LOG-002",
    timestamp: "2026-09-28T23:08:30+09:00",
    category: "copyright",
    rank: "A",
    title: "AI英文生成時の市販英語教材デッドコピー防止プロンプト制約",
    status: "completed",
    details: "LLMが市販英会話本やTOEIC公式テキストの文章を直接引用・複製しないよう、システムプロンプトに著作権保護・オリジナル性担保の制約指示を固定化。",
    actionTaken: "src/lib/ai/prompts.ts の systemPrompt に厳格な法的制約文（IMPORTANT LEGAL & ORIGINALITY REQUIREMENT）を反映完了",
    reviewer: "ShadowLog 法務・知財統括チーム",
  },
  {
    id: "IP-LOG-003",
    timestamp: "2026-09-28T23:00:00+09:00",
    category: "patent",
    rank: "C",
    title: "Needleman-Wunsch / Levenshtein アルゴリズムの特許クリアランス",
    status: "reviewed",
    details: "使用アルゴリズムは1960〜70年代発表の公知技術（パブリックドメイン）であり特許権侵害リスクなし (Clear)。",
    actionTaken: "技術仕様書およびIPリスクアセスメントレポート（docs/ip-risk-assessment.md）に記載・確認完了",
    reviewer: "ShadowLog 法務・知財統括チーム",
  },
  {
    id: "IP-LOG-004",
    timestamp: "2026-09-28T23:00:00+09:00",
    category: "trademark",
    rank: "B",
    title: "「ShadowLog」商標登録・調査アセスメント",
    status: "reviewed",
    details: "J-PlatPatでの第9類・第41類・第42類に関する商標検索および将来の出願準備計画を策定。",
    actionTaken: "商標検索アセスメント策定完了。有料ユーザー拡大フェーズでの出願手順をロードマップ化",
    reviewer: "ShadowLog 法務・知財統括チーム",
  },
];

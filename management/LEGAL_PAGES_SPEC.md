# 法務ドキュメント・利用規約ページ 実装指示書

**発行日**: 2026年9月25日  
**発行者**: プロジェクト統括担当 (Antigravity Management)  
**対象**: 実務担当エンジニア (`f203da78-5104-423c-92ad-efa86de6e77a`)  

---

## 1. 目的 & ゴール
`docs/` に配備されている法務ドキュメントをWebサービス画面として公開し、全画面フッター・ログイン画面・アップセルモーダルからアクセスできるようにして、法務遵守・Stripe本番審査対応を完了させる。

---

## 2. 実装タスク詳細

### タスク 1: 法務ページ（3画面）の新設
`docs/` 配下のMarkdownファイルを読み込み、清潔感のある読みやすいデザインで表示するページを作成する。

1. **`/terms` (利用規約)**:
   - ファイル: `src/app/(legal)/terms/page.tsx` (または `src/app/terms/page.tsx`)
   - ソース: `docs/terms-of-service.md`
2. **`/privacy` (プライバシーポリシー)**:
   - ファイル: `src/app/(legal)/privacy/page.tsx` (または `src/app/privacy/page.tsx`)
   - ソース: `docs/privacy-policy.md`
3. **`/tokushoho` (特定商取引法に基づく表記)**:
   - ファイル: `src/app/(legal)/tokushoho/page.tsx` (または `src/app/tokushoho/page.tsx`)
   - ソース: `docs/tokushoho-template.md`

※ 戻るボタン（ダッシュボードへ戻る）を上部に配置し、Tailwindの `prose` や清潔なタイポグラフィでレイアウトすること。

---

### タスク 2: 全画面共通フッターへのリンク追加
- 対象: `src/app/(dashboard)/layout.tsx` のフッター（PC版 & モバイル版）
- 表示文言:
  ```html
  <div className="flex items-center gap-4 text-xs text-muted-foreground">
    <Link href="/terms" className="hover:underline">利用規約</Link>
    <span>•</span>
    <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
    <span>•</span>
    <Link href="/tokushoho" className="hover:underline">特定商取引法に基づく表記</Link>
  </div>
  ```

---

### タスク 3: ログイン画面 (`/login`) への同意リンク設置
- 対象: `src/app/(auth)/login/page.tsx`
- フォーム下部に以下の注記を追加:
  ```html
  <p className="text-[11px] text-muted-foreground text-center mt-4">
    サインインまたはアカウント作成により、
    <Link href="/terms" className="text-primary underline">利用規約</Link> および
    <Link href="/privacy" className="text-primary underline">プライバシーポリシー</Link>
    に同意したものとみなされます。
  </p>
  ```

---

### タスク 4: アップセルモーダル (`UpgradeModal.tsx`) へのリンク追加
- 対象: `src/components/features/subscription/UpgradeModal.tsx`
- 決済ボタン下部のセキュリティ表示エリアに「[利用規約・解約規定](/terms)」へのリンクを設置。

---

## 3. 品質検証 & デプロイ
1. `npm run build` がエラーなく完了すること。
2. Gitコミット（`feat: add legal pages (terms, privacy, tokushoho) and footer navigation`）。
3. GitHub（`origin main`）へのプッシュおよびVercel自動デプロイの確認。
4. 完了後、統括担当へ報告。

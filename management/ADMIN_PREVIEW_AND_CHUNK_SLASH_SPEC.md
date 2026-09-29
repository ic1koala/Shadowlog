# 管理者専用テストボタンモード ＆ チャンク青色スラッシュ（第1弾）実装仕様書

**作成日**: 2026年9月30日  
**統括担当**: Antigravity Management  
**実装担当**: Full-Stack Developer  

---

## 1. 目的と背景

本番環境で5名のVIPテスターが利用を開始しているため、本体のUIや機能を直接変更してトラブルや違和感を生むリスクを回避する。  
そのための安全装置として、**「管理者アカウント（`isAdminEmail`）でログインしている時のみ表示・操作できる『🧪 テストボタンモード（フィーチャーフラグ）』」** を導入する。

第1弾の試験機能として、**「生成された文字のレイアウト・改行位置・カラオケハイライトを1ミリも変えずに、チャンク（意味の塊）の切れ目に青色スラッシュ（`/`）を表示する機能」** を実装する。

---

## 2. 厳守すべき要件

### ① 管理者限定の出し分け
- `isAdminEmail(userEmail)`（`src/lib/auth/admin-checker.ts`）が `true` の場合のみ、`🧪 テスト: チャンクスラッシュ ON/OFF` ボタンを表示する。
- 一般ユーザーやVIPテスターにはボタンもスラッシュも一切表示せず、100%従来通りの画面を維持する。

### ② 文字レイアウトを変えないスラッシュ描画（最重要）
- `SentenceCard.tsx` において、単語の並びや改行位置、および音声再生時のカラオケハイライト（`wordRefs` の `getBoundingClientRect()`）に**1ピクセルも影響を与えない**こと。
- **実現方法**:
  - 各単語の `<span>`（`mr-1.5` 等で右側に隙間がある要素）に `relative` を持たせ、チャンク区切り位置の単語の右余白（単語と単語の間のスペース中央）に **`position: absolute`** で青色スラッシュ（`/`）を配置する。
  - 例:
    ```tsx
    {showChunkSlash && chunkSlashIndices.has(idx) && (
      <span
        aria-hidden="true"
        className=" precision-slash pointer-events-none select-none absolute -right-[7px] top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400 font-normal text-[0.8em] leading-none opacity-85"
      >
        /
      </span>
    )}
    ```
  - これにより、ボックスモデルの幅・高さが一切変化しないため、ONとOFFを切り替えても文字が1ミリも動かず、純粋に隙間に青い `/` だけが出現・消滅する。

### ③ 自然なチャンク（意味の塊）区切りアルゴリズム
- 新規ユーティリティ `src/lib/diff/chunk-splitter.ts` に `getChunkSlashIndices(words: string[]): Set<number>` を実装する。
- **区切り判定ルール**:
  1. 文末（最後の単語）の直後には入れない。
  2. カンマ・セミコロン・コロン・ダッシュ（`,`, `;`, `:`, `—`）または文途中のピリオド/疑問符（`.`, `?`, `!`）で終わる単語の直後には必ずスラッシュを入れる。
  3. 次の単語が接続詞・関係詞（`that`, `which`, `who`, `whose`, `where`, `when`, `while`, `because`, `although`, `though`, `since`, `if`, `unless`, `until`, `before`, `after`, `whether`, `whereas`）で、現在のチャンクが **2語以上** 続いている場合、直前の単語の後にスラッシュを入れる。
  4. 次の単語が前置詞・不定詞（`in`, `on`, `at`, `for`, `with`, `from`, `by`, `about`, `through`, `during`, `without`, `between`, `among`, `against`, `toward`, `into`, `upon`, `to`）で、現在のチャンクが **3語以上** 続いている場合、直前の単語の後にスラッシュを入れる。
     - ※ただし、`to` の直前が `want`, `wants`, `wanted`, `need`, `needs`, `needed`, `have`, `has`, `had`, `try`, `tried`, `going`, `able`, `used`, `ought`, `due`, `according`, `prior` などの定型連語である場合は、`to` の前では区切らない。
  5. 直後の残り単語数が1語しかない場合は、孤立を防ぐため区切らない（句読点がある場合を除く）。

### ④ 管理者プレビュー状態の保存 (`src/lib/storage/admin-preview-store.ts`)
- ローカルストレージ（キー: `shadowlog_admin_preview`）に `{ chunkSlash: boolean }` を保存・取得できるヘルパーを作成。
- 練習画面（`/practice`）で切り替えた状態が、次のフレーズを生成してもそのまま維持されるようにする。

---

## 3. テスト要件

- `tests/unit/chunk-splitter.test.ts` を新規作成し、英文から自然なチャンク位置にスラッシュインデックスが生成されること、連語（`want to`, `need to` 等）の途中で不自然に切れないこと、文末にはつかないことを検証する。
- `npm test` および `npx tsc --noEmit` がすべてパスすること。

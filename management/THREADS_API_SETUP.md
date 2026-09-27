# Threads API セットアップ手順ガイド

Meta公式のThreads APIを利用して、投稿のインプレッション数・いいね数・リプライ数やフォロワー数を自動取得するための初期設定ガイドです。（**費用：完全無料**）

---

## 1. 準備するもの
- Meta（Facebook）アカウント
- Threads / Instagram アカウント（`@shadowlog_official`）

---

## 2. セットアップ手順（5ステップ）

### Step 1: Meta for Developers にログイン
1. ブラウザで [Meta for Developers](https://developers.facebook.com/) にアクセス。
2. お使いのMeta/Facebookアカウントでログイン（初回はデベロッパー登録画面が出ますので進めてください）。

### Step 2: 新規アプリの作成
1. 右上の **「マイアプリ (My Apps)」** ➔ **「アプリを作成 (Create App)」** をクリック。
2. アプリのユースケース選択画面で **「Threads API」** を選択（表示されない場合は「その他」➔「ビジネス」または「Threads」を選択）。
3. アプリ名（例: `ShadowLog Analytics`）を入力し、作成を完了します。

### Step 3: Threads API プロダクトの設定
1. アプリダッシュボードで **「Threads」** の **「設定 (Set Up)」** をクリック。
2. 画面の指示に従い、API利用規約に同意。

### Step 4: Threads アカウント（@shadowlog_official）の追加・連携
1. Threads設定画面の **「Threadsテスター (Threads Testers)」** または **「ユーザー連携」** の項目へ移動。
2. `@shadowlog_official` のユーザー名を入力してテスターとして追加。
3. Threadsアプリ（またはWeb）を開き、**「設定」➔「アカウント」➔「ウェブサイト権限」➔「テスターへの招待」** で招待を承認。

### Step 5: アクセストークン (Access Token) と ユーザーID の発行
1. Meta for Developers の **「Threads Graph API Explorer」** またはアクセストークン発行ツール画面を開く。
2. 以下のパーミッション（権限）にチェックを入れてトークンを生成：
   - `threads_basic`
   - `threads_content_publish` (任意)
   - `threads_manage_insights` (インサイト/分析用・必須)
3. 生成された **「ユーザーアクセストークン」** と **「ThreadsユーザーID」** をコピー。
   - ※アクセストークンは長期アクセストークン（60日間有効、自動更新可能）に変換します。

---

## 3. 取得した情報の保存場所

取得したアクセストークンとユーザーIDは、Git除外されている [.env.local](file:///Users/suzukihideaki/Desktop/Antigravity%E7%B7%B4%E7%BF%92/Shadowlog/.env.local) に保存します。

```env
THREADS_USER_ID=your_threads_user_id
THREADS_ACCESS_TOKEN=your_long_lived_access_token
```

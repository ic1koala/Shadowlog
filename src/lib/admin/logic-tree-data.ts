/**
 * 改善ロジックツリーのデータ (public/logic-tree.html の INITIAL_TREE_DATA と同期)
 * 管理者ダッシュボードの「ロジックツリー」タブ (モバイル最適化表示) で使用。
 * HTML版を更新した際は `node scripts/sync-logic-tree.mjs` で再生成してください。
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

export const LOGIC_TREE_DATA: LogicTreeNode = {
  "id": "root",
  "title": "🏆 ShadowLog アプリ体験 & 事業改善 (2026/10/14 最新版)",
  "summary": "発音精度向上、Core UX、学習習慣化、コンテンツ拡充、収益・集客成長の5大軸でプロダクト価値を最大化する",
  "status": "in_progress",
  "priority": "high",
  "notes": "全30テストファイル・189テスト100%通過。クローズドβテスターからのフィードバックに基づき、判定の厳密化と継続モチベーションを追求。",
  "children": [
    {
      "id": "branch-quality",
      "title": "🎯 発音・採点精度の向上 (AI Engine)",
      "summary": "「適当に言っても100点になる」問題を完全撲滅し、厳密かつ納得感の高い採点を実現する",
      "status": "completed",
      "priority": "high",
      "notes": "Whisperの過度な文脈補正を排し、音素レベル照合＋口語プロンプト最適化で正確な発音評価を確立。",
      "children": [
        {
          "id": "q-azure-poc",
          "title": "🚀 Azure AI Speech 発音評価PoC (FB-046)",
          "summary": "音素(Phoneme)レベルでネイティブ音響モデルと波形照合。適当発音を23点まで適正減点！",
          "status": "completed",
          "priority": "high",
          "notes": "Accuracy(正確さ), Fluency(流暢さ), Completeness(完全性), Prosody(抑揚)の4軸採点＋単語別Mispronunciation判定。F0無料枠(毎月5時間=約3,600回)で運用。"
        },
        {
          "id": "q-env-mention",
          "title": "🚀 音響環境スマートメンション (FB-046)",
          "summary": "Azure SNR(雑音比)と入力音量から「マイクが遠い」「周囲ノイズ過多」を自動警告",
          "status": "completed",
          "priority": "high",
          "notes": "理不尽な低スコアを防ぎ、ユーザーに静かな環境やイヤホン装着を優しく促す親切設計。"
        },
        {
          "id": "q-whisper-prompt",
          "title": "🚀 Whisper口語プロンプト最適化 (FB-049)",
          "summary": "I'm, you're, don't, can't等の縮約形を自然に文字起こしし、表記ゆれ誤判定を防止",
          "status": "completed",
          "priority": "high",
          "notes": "お題英文そのものは渡さないため、言い間違いや発音抜けの自動補正は100%防止。"
        },
        {
          "id": "q-phoneme-carte",
          "title": "💡 苦手音素(Phoneme)カルテ化",
          "summary": "L/R, TH, V/B, 曖昧母音など、日本人特有の脱落・置換音を自動集計して弱点克服へ",
          "status": "idea",
          "priority": "medium",
          "notes": "Words[].Phonemes のスコアをSupabaseに蓄積し、レーダーチャート等で可視化する案。"
        },
        {
          "id": "q-voice-mental",
          "title": "💡 声相(せいそう)メンタルコンディション診断",
          "summary": "発声ピッチ・音圧・抑揚から「今日のエネルギー度: 82%」など毎朝のコンディションを測定",
          "status": "idea",
          "priority": "low",
          "notes": "勉強ではなくヘルスケア・メンタルチェックの文脈で声を出させる仕掛け（日常アプリ20選）。"
        },
        {
          "id": "q-toeic-5q-renewal",
          "title": "🚀 1分本格TOEIC診断リニューアル (全5問化 ＆ 判定厳格化)",
          "summary": "甘すぎた判定を抜本改修。下限保証撤廃＋早口減点＋全5問適応型で±50点の高信頼診断へ",
          "status": "completed",
          "priority": "high",
          "notes": "3問➔5問へ拡張し各レベル計25問を配備。適当発音での850点固定を排除し、正確性×WPM×リンキングの絶対評価に刷新。Threads告知バナー連動。"
        }
      ]
    },
    {
      "id": "branch-ux",
      "title": "🎧 シャドーイング操作性 & 音響 (Core UX)",
      "summary": "音声を耳で聴きながら影のように発声する「真のシャドーイング」を快適に行う環境づくり",
      "status": "completed",
      "priority": "high",
      "notes": "ブラウザ/OSのダッキング防止、Bluetooth機器との完全互換、話速WPM表示、モバイル反転バグ解消完了。",
      "children": [
        {
          "id": "ux-2button-recording",
          "title": "🚀 2ボタン録音分割 (FB-026〜028)",
          "summary": "「🗣️ リピーティング(お手本停止)」と「🎧 シャドーイング(イヤホン推奨)」の2系統を全開放",
          "status": "completed",
          "priority": "high",
          "notes": "シャドーイング時は echoCancellation: false でダッキング(音量低下)を防止。"
        },
        {
          "id": "ux-bluetooth-primer",
          "title": "🚀 Bluetooth頭切れ防止 (FB-036〜037)",
          "summary": "-74dB無音プライマー通信でAirPods等の休眠を防止＆自動停止タイマーを廃止し手動統一",
          "status": "completed",
          "priority": "high",
          "notes": "長文でも文頭が途切れず、ユーザーの呼吸・ペースで納得いくまで録音できる。"
        },
        {
          "id": "ux-dynamic-wpm",
          "title": "🚀 模範音声の動的WPM表示 (FB-022)",
          "summary": "音声の実際の長さと単語数から実効WPMをリアルタイム算出(~78/~130/~156 WPM)",
          "status": "completed",
          "priority": "high",
          "notes": "学習目標としてのネイティブ速度を直感的に把握可能。遅延0ms。"
        },
        {
          "id": "ux-chunk-slash",
          "title": "🚀 チャンク青スラッシュ & 3D単語辞書",
          "summary": "意味の塊(/)を太字表示＆単語タップで意味表示＋発音再生できる学習支援UI",
          "status": "completed",
          "priority": "medium",
          "notes": "カラオケハイライトと完璧に連動。"
        },
        {
          "id": "ux-mobile-flip",
          "title": "🚀 モバイル単語反転バグ完全解消 (FB-048)",
          "summary": "Android Chrome等の単語カードめくり時の半透明・透過バグをCSSハードウェア加速で修正",
          "status": "completed",
          "priority": "high",
          "notes": "transform-style: preserve-3d; backface-visibility: hidden により滑らか描画を担保。"
        },
        {
          "id": "ux-pitch-visualizer",
          "title": "💡 抑揚(ピッチカーブ)波形比較",
          "summary": "模範音声の周波数F0カーブとユーザーの発話ピッチを重ねて抑揚の違いを視覚化",
          "status": "idea",
          "priority": "low",
          "notes": "日本語話者にありがちな「平坦な英語」を、視覚的に直すための高度なUIアイディア。"
        },
        {
          "id": "ux-onboarding-tour",
          "title": "🌱 無料初回起動：対話型オンボーディングツアー",
          "summary": "初めてアプリを開いた無料ユーザーへ、ツールチップ＆ポップアップによる対話型チュートリアルを実施",
          "status": "idea",
          "priority": "high",
          "notes": "アプリの基本操作(WPM/スラッシュ辞書/2系統録音/終了窓)を1分で体感させ、離脱を防ぐ。スキップ常設＋後から再確認可能。",
          "children": [
            {
              "id": "tour-tooltip-steps",
              "title": "🧭 4ステップ・ツールチップ案内",
              "summary": "①模範音声カプセル(WPM) ➔ ②スラッシュ・3D単語辞書 ➔ ③リピーティング/シャドーイング録音 ➔ ④学習終了窓",
              "status": "idea",
              "priority": "high",
              "notes": "各要素にフキダシツールチップを順番にフォーカス。操作を促しながら次ステップへ導く直感的UX。"
            },
            {
              "id": "tour-skip-revisit",
              "title": "⚡️ スキップ常設 ＆ ヘルプからの再起動",
              "summary": "慣れているユーザー向けにワンタップ「スキップ」を用意。画面右上「？」からいつでもツアーを再確認可能",
              "status": "idea",
              "priority": "medium",
              "notes": "不要なユーザーにストレスを与えず、いつでも復習できる親切設計。"
            },
            {
              "id": "tour-storage-flag",
              "title": "💾 初回起動フラグ (LocalStorage連携)",
              "summary": "初回完了時に shadowlog_onboarded_completed を保存し、2回目以降は通常起動で即練習開始",
              "status": "idea",
              "priority": "medium",
              "notes": "1日2問しかない無料ユーザーの貴重な練習時間を2回目以降は奪わない。"
            }
          ]
        }
      ]
    },
    {
      "id": "branch-habit",
      "title": "🔥 習慣化 & リテンション (Habit & Retention)",
      "summary": "毎日アプリを開きたくなる仕掛けと、練習終わりの最高の達成感を演出する",
      "status": "completed",
      "priority": "high",
      "notes": "勉強終了サマリー窓の新設により、クロージング体験とSNS口コミ導線を強化完了。",
      "children": [
        {
          "id": "h-finish-modal",
          "title": "🚀 「今日の学習を終了」サマリー窓 (FB-047)",
          "summary": "学習時間＋連続ストリーク＋AIコーチ労い＋復習ポイント＋X/Threads/Instagramシェア",
          "status": "completed",
          "priority": "high",
          "notes": "採点結果の「次のフレーズへ」の横に新設。1回の練習の区切りと達成感を最大化。"
        },
        {
          "id": "h-streak-push",
          "title": "🚀 ストリーク管理 & Web Push通知 (FB-034)",
          "summary": "連続学習日数のバッジカウント＆毎日定時のリマインド通知機能",
          "status": "completed",
          "priority": "high",
          "notes": "学習習慣が途切れそうな夜に優しく通知する。"
        },
        {
          "id": "h-emotional-detox",
          "title": "💡 愚痴・モヤモヤの「スマート英語昇華」",
          "summary": "今日の上司への不満等を日本語で吐き出すと、AIが洗練された皮肉・ユーモア英語に変換して発声",
          "status": "idea",
          "priority": "high",
          "notes": "勉強ではなく「ストレス発散とスッキリ感」を目的に大声でシャドーイングさせるキラー企画。"
        },
        {
          "id": "h-daily-battle",
          "title": "💡 Wordle型「日替わり全国共通ワンセンテンス」",
          "summary": "毎朝7時に全ユーザーへ共通の1文を配信。発音スコアとWPMの全国順位が即座に出る1日1回対決",
          "status": "idea",
          "priority": "high",
          "notes": "手軽さとゲーム性でSNS拡散性（「今日のセンテンス全国12位！」）が極めて高い。"
        },
        {
          "id": "h-voice-diary",
          "title": "💡 AI音声英語日記 (1日1言ライフログ)",
          "summary": "今日の出来事から美しい英語1文を生成し、声で吹き込んで保存。1年後に去年の声が聴ける",
          "status": "idea",
          "priority": "medium",
          "notes": "自分の声の蓄積が人生の記録（ライフログ資産）になるため、強烈な継続動機になる。"
        },
        {
          "id": "h-morning-alarm",
          "title": "💡 声出し強制覚醒アラーム",
          "summary": "指定の英語フレーズを明瞭にシャドーイングしないと音が止まらない朝のルーティン機能",
          "status": "idea",
          "priority": "low",
          "notes": "ベッドの中で声を出すことで強制的に脳を覚醒させる実用ツール連動。"
        }
      ]
    },
    {
      "id": "branch-content",
      "title": "📚 コンテンツ & パーソナライズ (Content)",
      "summary": "飽きのこない多様な例文と、受講者の業務・関心・弱点に最適化された問題配信",
      "status": "completed",
      "priority": "high",
      "notes": "TOEIC 500/700/850換算を完了し、語彙難易度のブレを完全解決。",
      "children": [
        {
          "id": "c-toeic-calibration",
          "title": "🚀 TOEIC 500/700/850 厳格語彙換算 (FB-049)",
          "summary": "初級は最頻出2,000語上限・-tion/-ity抽象語完全禁止。レベルに忠実な日常文を保証",
          "status": "completed",
          "priority": "high",
          "notes": "初級500点/中級700点/上級850点に完全キャリブレーション。生成前のAI自己検証ステップ付。"
        },
        {
          "id": "c-sentence-bank",
          "title": "🚀 3,600文問題バンク & 週10%入替 (FB-020)",
          "summary": "4大ジャンル×3難易度=3,600文。DB配信で0.0秒遷移＆API出題原価0円を実現",
          "status": "completed",
          "priority": "high",
          "notes": "利用上位10%を毎週自動ローテーションし、鮮度を保つ。"
        },
        {
          "id": "c-custom-words",
          "title": "🚀 3単語カスタム例文生成 (FB-035)",
          "summary": "好きな英単語やトピックを3つ入力して自分専用の例文を生成(プラン別制限あり)",
          "status": "completed",
          "priority": "medium",
          "notes": "「自分の現場で使う専門用語」を練習したいユーザーのニーズを満たす。"
        },
        {
          "id": "c-seasonal-trend",
          "title": "🚀 季節(四季) & 現代ビジネストレンド・バズワード排除 (FB-038)",
          "summary": "四半期Q1〜Q4のトピックを反映しつつ、work-life harmony等の不自然なバズワードを排除",
          "status": "completed",
          "priority": "medium",
          "notes": "教科書英語ではない「今すぐ現場で使える」実践英語を提供。"
        },
        {
          "id": "c-tinder-swipe",
          "title": "💡 Tinder型「言いたい/言わない」直感スワイプ",
          "summary": "日常フレーズをスワイプ仕分け。「言いたい！」と選んだ文だけが自分の練習山札に溜まる",
          "status": "idea",
          "priority": "medium",
          "notes": "自分事化されたフレーズのみを練習できるため、教材の押し付け感をゼロにできる。"
        },
        {
          "id": "c-dialogue-mode",
          "title": "💡 対話型(2人掛け合い)シャドーイング",
          "summary": "「Aさんの質問 ➔ Bさんの回答」を交互にシャドーイングするロールプレイ形式",
          "status": "idea",
          "priority": "low",
          "notes": "単文の読み上げから、実際のミーティング会話に近い臨場感あるトレーニングへ進化。"
        }
      ]
    },
    {
      "id": "branch-growth",
      "title": "📈 集客・収益化 & 運営 (Growth & Business)",
      "summary": "テスターから有料会員（Basic/Pro）への転換と、自立的な収益化の確立",
      "status": "completed",
      "priority": "high",
      "notes": "損益分岐点（Basicわずか5〜6名）の超高収益モデル＋Threads自動投稿24/7稼働中。",
      "children": [
        {
          "id": "g-plan-differentiation",
          "title": "💡 新・3段階会員プラン設計 (無料 / 一般500円 / プロ1,000円)",
          "summary": "無料と一般(500円)の明確な差別化と、プロ(1,000円)の1日1回プレミアムAI高精度レビュー",
          "status": "idea",
          "priority": "high",
          "notes": "無料ユーザーは1日2問・週最大5問(月曜復活)＆問題バンク0円配信。2週目月曜に登録促進ポップアップ。一般は無制限＋クラウド永続。プロは長文＋AI高精度レビュー1日1回(検討中)。",
          "children": [
            {
              "id": "plan-free",
              "title": "🌱 無料ユーザー (¥0)",
              "summary": "1日2問・週最大5問制限(月曜復活)。ログから0円出題。履歴は残すが2週目月曜に登録促進",
              "status": "idea",
              "priority": "high",
              "notes": "ペルソナ固定や単語登録は制限し500円プランへ誘導。ストリークとWPMは計測可能で習慣化を維持。",
              "children": [
                {
                  "id": "free-quota",
                  "title": "⏱️ 1日2問・週最大5問制限 (毎週月曜復活)",
                  "summary": "1日最大2問、週累計5問でストップ(最短2.5日で消失)。毎週月曜日に週枠が自動リセット",
                  "status": "idea",
                  "priority": "high",
                  "notes": "毎日コツコツでも週半ばで上限に達するため、500円一般プランへの自然な移行フックになる。"
                },
                {
                  "id": "free-bank-only",
                  "title": "🏦 問題バンクログから出題 (出題原価0円死守)",
                  "summary": "無料枠の問題は生成APIを使わず既存のログ(問題バンク)から配信。APIは発話判定のみ使用",
                  "status": "idea",
                  "priority": "high",
                  "notes": "無料ユーザー急増時のAI原価リスクをゼロに抑える鉄壁の防衛アーキテクチャ。"
                },
                {
                  "id": "free-popup",
                  "title": "📢 2週目以降の月曜「登録促進ポップアップ」",
                  "summary": "履歴や苦手単語は保持するが、2週目月曜に「ブラウザ保存のため消えるリスクあり！永続保存へ」と訴求",
                  "status": "idea",
                  "priority": "high",
                  "notes": "データを人質にするのではなく、「端末変更やキャッシュクリアで消える前にクラウド同期しよう」という親切な動機付け。"
                },
                {
                  "id": "free-limits",
                  "title": "🔒 ペルソナ設定・マイ単語帳のロック",
                  "summary": "職種・業界のペルソナ登録や単語帳編集をロック。「月500円でアンロック」へ誘導",
                  "status": "idea",
                  "priority": "high",
                  "notes": "無料ユーザーはペルソナ登録不可（一般プラン昇格時に初回登録フローへ移行）。ストリーク(連続日数)とWPMは無料でも計測可能にし、利用習慣(DAU)を逃さない。"
                }
              ]
            },
            {
              "id": "plan-base",
              "title": "⚡️ 一般ユーザー (Base ¥500/月)",
              "summary": "短文シャドーイング無制限使い放題。クラウド永続保存。ペルソナ初回登録＆単語帳解禁",
              "status": "idea",
              "priority": "high",
              "notes": "ワンコインの手軽さで使い放題。問題バンク運用によりAPI出題原価0円のため営業利益率70%超を維持可能。",
              "children": [
                {
                  "id": "base-persona-onboarding",
                  "title": "🎯 一般昇格時：ペルソナ初回登録＆解放フロー",
                  "summary": "一般メンバー加入時にペルソナ（職種＋分野）を日本語登録。登録完了で機能が初めて解放される",
                  "status": "idea",
                  "priority": "high",
                  "notes": "自分の仕事のカテゴリ(営業・技術等)と分野(例: 化学系メーカー営業、半導体等)を入力し、自分専用のパーソナライズ学習がスタート。",
                  "children": [
                    {
                      "id": "persona-input-form",
                      "title": "📝 日本語ペルソナ入力フォーム",
                      "summary": "【職種/ポジション】(営業・技術など) ＋ 【分野/業界】(化学系メーカー営業、半導体など)を自然な日本語で入力",
                      "status": "idea",
                      "priority": "high",
                      "notes": "自由入力形式＋おすすめサジェストタグ。ユーザーの実際のビジネスシーンを具体的にヒアリング。"
                    },
                    {
                      "id": "persona-settings-edit",
                      "title": "⚙️ 設定画面 (/settings) での後からの修正機能",
                      "summary": "人事異動やプロジェクト変更、新しい関心に合わせていつでも設定画面からペルソナを修正可能",
                      "status": "idea",
                      "priority": "medium",
                      "notes": "いつでも修正できる安心感を提供。更新内容は即座にAI文脈および次回出題へ反映。"
                    },
                    {
                      "id": "persona-ai-prompt",
                      "title": "🤖 ペルソナ特化AI例文生成プロンプト注入",
                      "summary": "登録された職種・業界・商材をプロンプトに動的注入し、極めて実践的なビジネス例文を生成",
                      "status": "idea",
                      "priority": "high",
                      "notes": "【アイデア3採用・原価防御】アプリ起動時に裏で非同期事前生成（待機0.0秒）。日次上限（Base: 1日5問 / Pro: 1日15問）消化後は、原価0円の3,600問ストック問題バンクへシームレス移行。無制限練習と原価上限（Base: 最大26.1円/月、Pro: 最大78.3円/月、粗利率83〜95%）を両立。"
                    }
                  ]
                },
                {
                  "id": "base-unlimited",
                  "title": "🚀 短文シャドーイング利用制限なし (無制限)",
                  "summary": "1日何問でも好きなだけ練習可能。英語学習アプリ業界最強のコスパ",
                  "status": "idea",
                  "priority": "high",
                  "notes": "出題は問題バンク＋先読み0.0秒遷移でサクサク練習できる。"
                },
                {
                  "id": "base-cloud-sync",
                  "title": "☁️ クラウド永続保存 & 復習カルテ",
                  "summary": "Supabaseで全セッション履歴、弱点単語、WPM推移を消えずに永久保存",
                  "status": "idea",
                  "priority": "high",
                  "notes": "端末を変えても、ブラウザのキャッシュをクリアしてもデータが安全に保持される。"
                },
                {
                  "id": "base-custom-words",
                  "title": "🎯 苦手単語帳のフル活用 ＆ リベンジ出題",
                  "summary": "苦手単語帳から「リベンジ問題」を自動生成し、弱点を徹底克服",
                  "status": "idea",
                  "priority": "medium",
                  "notes": "業務の専門用語や苦手な音に絞ったパーソナライズ特訓が可能。"
                }
              ]
            },
            {
              "id": "plan-pro",
              "title": "👑 プロユーザー (Pro ¥1,000/月)",
              "summary": "プロ長文機能(Passage) ＋ 【検討中】AI高精度レビューを「1日1回」受講可能",
              "status": "idea",
              "priority": "high",
              "notes": "一般機能に加えて、スピーチ・プレゼン特化の長文練習（ペルソナ枠1日15問）と1日1回限定のプレミアムAI添削。【価格改定確定】コスト担当との協議により¥1,480→¥1,000/月に改定合意。一般(¥500)との差額¥500で上位転換率を最大化し、粗利率83.5〜95.6%を確保。",
              "children": [
                {
                  "id": "pro-passage",
                  "title": "🎙️ プロ長文機能 (Passage Mode)",
                  "summary": "数十秒〜1分超の実践スピーチやビジネスプレゼンを丸ごとシャドーイング",
                  "status": "idea",
                  "priority": "high",
                  "notes": "息継ぎ(ポーズ)や話速(WPM)の維持など、実践的な英語体力を鍛える上位プラン専用機能。"
                },
                {
                  "id": "pro-ai-review",
                  "title": "💡 【検討中】長文AI高精度レビュー (1日1回提出型)",
                  "summary": "長文を読んで提出すると、AI(Azure音素/GPT)による精密な発音・抑揚添削が1日1回受けられる",
                  "status": "idea",
                  "priority": "high",
                  "notes": "Azure AI Speechは管理者PoC検証中。1日1回チケット制でAI原価を確実に予測可能に保つ。"
                }
              ]
            }
          ]
        },
        {
          "id": "g-threads-cron",
          "title": "🚀 Threads 24/7 自動投稿ワークフロー (FB-048)",
          "summary": "GitHub Actions cronにより30分間隔で自律投稿。3投稿に1回URLリンクでアルゴリズム最適化",
          "status": "completed",
          "priority": "high",
          "notes": ".threads-queue.json を自動更新し、日中・夜間問わず完全自動で発信・集客。"
        },
        {
          "id": "g-stripe-billing",
          "title": "🚀 Stripe決済 & 3段階チケット制",
          "summary": "Guest(無料2問) / Basic(月500円/使い放題) / Pro(現行1,480円・新1,000円改定対応予定)のインフラ完成",
          "status": "completed",
          "priority": "high",
          "notes": "月間固定費1,650円に対して、黒字化ハードルを極小化（有料会員4〜5名で回収）。Pro価格を¥1,000/月へ改定する場合、Stripeの新Price作成・価格ID差し替え・料金表示/特商法ページの更新が必要（現行実装は¥1,480）。"
        },
        {
          "id": "g-payment-methods",
          "title": "💳 多彩な決済手段 ＆ 支払いサイクル設計 (10/21〜着手予定)",
          "summary": "クレジットカード(Stripe安全保存)に加え、PayPay(3ヶ月まとめ)やApple/Google Payに対応",
          "status": "idea",
          "priority": "high",
          "notes": "【確定スケジュール】2026/10/21頃より実装着手。クレカ安全保存表示＋PayPay 3ヶ月まとめ払い(一般¥1,500/プロ¥3,000の都度一括・90日有効期限)＋Apple/Google Payワンタップ決済を導入予定。",
          "children": [
            {
              "id": "pay-credit-security",
              "title": "🔒 クレジットカード決済 ＆ Stripe安全保存表示",
              "summary": "世界最高水準(PCI-DSS Level 1)のStripeで暗号化保存される安心感をUI上で明示",
              "status": "idea",
              "priority": "high",
              "notes": "「カード情報は世界標準の決済機関Stripeに直接暗号化保存され、当アプリには保存されません」というセキュリティバッジと鍵アイコンを表示して信頼性を担保。月額自動更新。"
            },
            {
              "id": "pay-paypay-quarterly",
              "title": "📱 PayPay決済 (3ヶ月まとめ払い・10/21〜着手)",
              "summary": "3ヶ月ごとの一括支払い(一般: ¥1,500 / プロ: ¥3,000)。クレカ未保持層の取り込み",
              "status": "idea",
              "priority": "high",
              "notes": "【仕様合意・10/21〜着手】PayPayは3ヶ月チケット(都度一括決済)として実装。90日間有効とし、期限前リマインド通知を経て未更新時は無料プランへ自動フォールバック。チャーンを防ぎLTVを最大化。",
              "children": [
                {
                  "id": "paypay-cycle-rules",
                  "title": "📅 3ヶ月サイクルの期限管理 ＆ 更新リマインド",
                  "summary": "決済から90日間の有効期限管理。期限7日前と前日にWeb Pushやメールで更新案内を自動通知",
                  "status": "idea",
                  "priority": "high",
                  "notes": "未更新時は自動的に無料プラン（1日2問制限）へフォールバックし、いつでも再開可能とする。"
                },
                {
                  "id": "paypay-integration-tech",
                  "title": "⚙️ PayPay連携方式 (Stripe PayPay / 直接連携)",
                  "summary": "Stripe経由のPayPay決済、または国内決済ゲートウェイの接続検証",
                  "status": "idea",
                  "priority": "medium",
                  "notes": "QRコード表示またはスマホPayPayアプリ自動ディープリンクで即時決済完了。"
                }
              ]
            },
            {
              "id": "pay-mobile-wallets",
              "title": "⚡️ Apple Pay ＆ Google Pay (ワンタップ決済)",
              "summary": "Face ID / Touch IDでカード入力不要の即時決済。スマホからの離脱を最小化",
              "status": "idea",
              "priority": "high",
              "notes": "Stripe Elements / Checkoutの標準ウォレット機能を有効化。SafariではApple Pay、Chrome/AndroidではGoogle Payが自動出現。"
            }
          ]
        },
        {
          "id": "g-waitlist-lp",
          "title": "🚀 先行登録LP & 1問デモ (/waitlist)",
          "summary": "登録不要で1問シャドーイングを体験できるバイラルLP＆14日間無料クーポン自動発行",
          "status": "completed",
          "priority": "high",
          "notes": "Threads等のSNS集客からの着地先として稼働中。"
        },
        {
          "id": "g-admin-risk",
          "title": "🚀 顧客採算リスク & 統括ダッシュボードタブ統合 (/admin)",
          "summary": "API利用コストと会費の差額を自動計算し、逆ざやリスクを検知。統括ダッシュボードもタブ統合",
          "status": "completed",
          "priority": "medium",
          "notes": "メンバーごとの日次利用回数折れ線グラフも完備。"
        },
        {
          "id": "g-logic-tree",
          "title": "🚀 思考整理ロジックツリースタジオ (FB-050)",
          "summary": "アプリ改善アイディアと技術論点を5大ブランチで可視化・編集・localStorage保存",
          "status": "completed",
          "priority": "medium",
          "notes": "統括ダッシュボードからワンクリックでアクセス可能。"
        },
        {
          "id": "g-ugc-campaign",
          "title": "💡 #今日のシャドーイング 口コミ拡散企画",
          "summary": "勉強終了窓からのSNSシェアで「今月も継続中！」のUGCを増やし自然流入を獲得",
          "status": "idea",
          "priority": "medium",
          "notes": "シェアしたユーザーに限定バッジや特典を付与する仕組みの検討。"
        }
      ]
    }
  ]
};

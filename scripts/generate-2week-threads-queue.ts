import { enqueuePost, saveQueue, QueueItem } from "../src/lib/threads/publisher";
import fs from "fs";
import path from "path";

const QUEUE_FILE = path.join(process.cwd(), ".threads-queue.json");

// Clear existing queue to start fresh for 14-day campaign
const queue: QueueItem[] = [];

const startDate = new Date("2026-10-09T00:00:00+09:00");

// Helper to format ISO JST time string
function getJstIsoString(dayOffset: number, hour: number, minute: number): string {
  const d = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return `${year}-${month}-${day}T${h}:${m}:00+09:00`;
}

// 14-Day Content Matrix (42 Posts Total: 14 Morning, 14 Lunch, 14 Night)
const postsData = [
  // --- Day 1 (10/09) ---
  {
    day: 0, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

今日から英語学習のコツと、30秒で話せるスピード（WPM）や推定TOEICスコアがAI判定できるツール情報を発信していきます！

通勤・通学の隙間時間で、自分の「英語スピーキング発声スピード」を無料測定してみませんか？

▼30秒AI診断はこちら
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #シャドーイング #ShadowLog`
  },
  {
    day: 0, slot: "lunch", hour: 12, minute: 30,
    text: `【英語発音スピードの目安知ってますか？】

・初級者: 90〜110 WPM
・中級（TOEIC600〜700）: 120〜140 WPM
・ネイティブ日常会話: 160〜180 WPM

あなたの現在の発声スピードは何WPM？
AIが30秒で音の連結再現度とTOEIC推定スコアを割り出します💡

▼無料診断を試す👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 0, slot: "night", hour: 20, minute: 0,
    text: `シャドテンの月額2万円が高くて継続を諦めそうになったので、自分で無料から使えるAIシャドーイングアプリ「ShadowLog」を開発しました！

まずは30秒であなたのリスニング・発声弱点と推定TOEICスコアが分析できる無料AI診断を試していただけると嬉しいです！

先着20名様限定で初期VIPモニター（全Pro機能使い放題）も受付中🔥

▼30秒AI無料診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #個人開発 #TOEIC #ShadowLog`
  },

  // --- Day 2 (10/10) ---
  {
    day: 1, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

英語のリスニングで「知っている単語なのに聞き取れない」最大の原因は【音の連結（リンキング）】です。

"Check it out" が "チェケラウ" に聴こえる現象ですね。
あなたのリンキング再現率は何％？30秒でAIが判定します！

▼30秒AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #リスニング #ShadowLog`
  },
  {
    day: 1, slot: "lunch", hour: 12, minute: 30,
    text: `昼休みの隙間時間30秒で英語力チェック！

短い英文を音読・発声するだけで：
1. 発話スピード（WPM）
2. 音の連結（リンキング）再現率
3. 推定TOEICスコア
をAIがリアルタイム算出します！

スマホのマイクからログイン不要で今すぐ試せます👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 1, slot: "night", hour: 20, minute: 0,
    text: `【英語が聞き取れない3つの段階】

1級: 単語の意味がわからない（語彙不足）
2级: 変化した音が聞き取れない（リンキング未定着）
3級: スピードについていけない（WPM不足）

あなたはどこで詰まっていますか？AIが30秒で弱点を特定します。

▼30秒AI無料診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #シャドーイング #TOEIC #ShadowLog`
  },

  // --- Day 3 (10/11) ---
  {
    day: 2, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

週末の土曜日！朝の30秒で英語のスピーキング力＆発音速度をチェックしてみませんか？

スマホに向かって短いフレーズを音声吹き込むだけで、AIがリアルタイム診断します。

▼今すぐ試せる30秒無料診断👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 2, slot: "lunch", hour: 12, minute: 30,
    text: `【クイズ】
"What do you want to do?" 
ネイティブが発声すると "Whaddya wanna do?" に変化します。

耳で追うだけでなく、口を動かして自分で発声できるようになるとリスニング力が跳ね上がります！

あなたの発声再現度をAIが30秒でチェック👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #発音 #ShadowLog`
  },
  {
    day: 2, slot: "night", hour: 20, minute: 0,
    text: `【先着20名限定】初期VIPモニター募集中！

30秒AI診断を受けると、正式リリース後も全Pro機能（無制限シャドーイング＆AI詳細フィードバック）が使い放題になるVIPモニターに応募できます！

残り枠数をリアルタイム表示中。

▼30秒AI診断＆VIP応募はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #無料診断 #ShadowLog`
  },

  // --- Day 4 (10/12) ---
  {
    day: 3, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

日曜日も英語学習頑張っていきましょう！
「自分の英語の発音、本当に通じるかな？」と気になったら、まずは30秒でAIチェックしてみませんか？

単語の聞き取り＆発音再現度をその場で数値化します。

▼無料30秒AI診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 3, slot: "lunch", hour: 12, minute: 30,
    text: `「TOEIC L&Rのスコアはあるのに、スピーキングテストや英会話だと言葉が出てこない…」

それは脳内の単語検索スピード（WPM）のトレーニング不足が原因かもしれません。

AIがあなたのWPMと推定TOEICスコアを30秒で無料診断します💡

▼診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #スピーキング #ShadowLog`
  },
  {
    day: 3, slot: "night", hour: 20, minute: 0,
    text: `【なぜShadowLogを作ったのか？】

英語アプリって「毎日30分スクールに通う」タイプの重いものが多くて続きづらいですよね。

「1日3分、声を出して速攻フィードバックが貰える環境」を作りたくて作りました。
まずは30秒診断で体験してみてください！

▼30秒無料AI診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #個人開発 #ShadowLog`
  },

  // --- Day 5 (10/13) ---
  {
    day: 4, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

今週もスタート！月曜朝の通学・通勤時に30秒だけ英語力を測ってみませんか？

ログイン登録不要で、スマホマイクからすぐ発音スピードと推定TOEICスコアが分かります。

▼今すぐ無料診断👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 4, slot: "lunch", hour: 12, minute: 30,
    text: `音の連結（リンキング）解説💡

"Get out of here" ➔ "ゲラウロブヒア"
"Pick it up" ➔ "ピッカップ"

英語は子音と母音がくっついて別の音に変化します。
あなたのリンキング発声再現率をAIが30秒判定！

▼無料AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #発音 #ShadowLog`
  },
  {
    day: 4, slot: "night", hour: 20, minute: 0,
    text: `リスニング上達の近道は「自分が発声できるスピードまで口を鳴らすこと」。

お手本音声のWPM（1分間の単語数）に合わせて声を出すことで、自然と耳が英語のスピードに追いつくようになります。

まずは自分の発声WPMを30秒でチェック！

▼30秒AI診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #シャドーイング #ShadowLog`
  },

  // --- Day 6 (10/14) ---
  {
    day: 5, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

英語学習で大切なのは「現在の自分の正確な位置（数値）」を知ること。

WPM（発話速度）や弱点音の再現率をAIで客観的に測定してみませんか？

▼30秒で測れる無料AI診断👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 5, slot: "lunch", hour: 12, minute: 30,
    text: `【昼休みの30秒チャレンジ】
短い英文を3つ発声して、AIコーチから判定をもらおう！

・語彙キャッチ度
・発話スピード（WPM）
・推定TOEICスコア

完全無料でその場で結果が出ます👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 5, slot: "night", hour: 20, minute: 0,
    text: `【VIPモニター残り枠わずか！】

ShadowLogの初期VIPモニター募集（先着20名限定）ですが、少しずつ枠が埋まってきています！

VIP特典：全Pro機能（無制限練習・詳細フィードバック）永久無料使い放題。

診断結果画面からワンタップで応募できます👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #モニター募集 #ShadowLog`
  },

  // --- Day 7 (10/15) ---
  {
    day: 6, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

水曜日！折り返し地点ですね。
朝の30秒で自分の英語発声スピードをチェックして、今日も英語脳を呼び覚ましましょう！

▼30秒AI無料診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 6, slot: "lunch", hour: 12, minute: 30,
    text: `英語力診断ツール「ShadowLog Diagnosis」は、Whisper AI音声認識アルゴリズムを活用してリアルタイムに発音スピード（WPM）と推定TOEICスコアを分析します。

0秒の待ち時間でストレスなく結果が出るので試してみてください！

▼30秒AI診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #個人開発 #ShadowLog`
  },
  {
    day: 6, slot: "night", hour: 20, minute: 0,
    text: `英語を話す時に「えーっと…」と詰まってしまう方へ。

それは単語力ではなく「英文をカタマリ（チャンク）で発声するリズム」が身についていないからかも。

AI診断であなたのWPMとチャンク発声度をチェックしてみませんか？

▼無料30秒AI診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #英会話 #TOEIC #ShadowLog`
  },

  // --- Day 8 (10/16) ---
  {
    day: 7, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

「英語学習を始めたいけど何からやればいいか分からない…」
まずは今の自分の「発声スピード」と「推定TOEICスコア」を30秒で可視化してみましょう！

▼無料30秒AI診断👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 7, slot: "lunch", hour: 12, minute: 30,
    text: `【TOEICスコア別・発声WPMの目安】
・500点レベル: 〜110 WPM
・700点レベル: 120〜140 WPM
・850点以上: 150+ WPM

あなたの今の発音スピードは何WPM？30秒でAIが計測します！

▼無料AI診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 7, slot: "night", hour: 20, minute: 0,
    text: `シャドーイングは「お手本音声を聞きながら、0.5秒遅れで声を追う」トレーニング。

リスニング力とスピーキング力を同時に鍛える最強の方法です。

まずは30秒で自分の適性スコアをAI診断してみよう！

▼30秒無料AI診断👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #シャドーイング #TOEIC #ShadowLog`
  },

  // --- Day 9 (10/17) ---
  {
    day: 8, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

金曜日！今週ラストスパートですね。
出勤・通学前の30秒で英語力チェックしてみませんか？

スマホに声を吹き込むだけで、AIがリンキング再現度と推定TOEICスコアを即出します。

▼30秒AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 8, slot: "lunch", hour: 12, minute: 30,
    text: `昼休み30秒英語チャレンジ！

「シャドーイングって難しそう…」という方向けに、お手本を聞いてから話す「リピーティングモード」も用意しています！

まずは診断ツールで体験してみてください👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 8, slot: "night", hour: 20, minute: 0,
    text: `【残りわずか】先着20名様限定VIPモニター！

全Pro機能が無制限使い放題になる特別VIP枠を募集中です。
診断完了ページから1タップでエントリーできます！

リアルタイムの残枠表示をチェック👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #VIPモニター #ShadowLog`
  },

  // --- Day 10 (10/18) ---
  {
    day: 9, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

週末の土曜日！ゆっくり時間が取れる日に、自分の英語スピーキングの実力を客観的に測ってみませんか？

30秒でAIが判定する無料診断ツールはこちら！

▼今すぐ試す👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 9, slot: "lunch", hour: 12, minute: 30,
    text: `英語の音変化パターン解説💡

・Flap T: "Water" ➔ "ワラ"
・Linking: "An apple" ➔ "アナップル"
・Reduction: "Going to" ➔ "ゴナ"

自分の口で再現できているかAIが30秒判定します！

▼無料AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #発音 #TOEIC #ShadowLog`
  },
  {
    day: 9, slot: "night", hour: 20, minute: 0,
    text: `「継続できる英語アプリ」を目指して改善を重ねています。

ユーザー様からのフィードバックをもとに、毎日使える30秒診断や直感的な2モード録音を実装しました。

ぜひ試してご感想を教えてください！

▼30秒無料AI診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #個人開発 #ShadowLog`
  },

  // --- Day 11 (10/19) ---
  {
    day: 10, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

日曜日の朝！リフレッシュしながら30秒で英語力診断してみませんか？

単語再現率・WPM・推定TOEICスコアがその場で分かります。

▼無料30秒AI診断👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 10, slot: "lunch", hour: 12, minute: 30,
    text: `【TOEIC L&Rテスト対策にも！】

Part 3 & 4 の長文リスニングで「途中で置き去りにされる…」という方は、WPM（発話スピード）への慣れが必要です。

まずは自分の発音スピードを測ってみよう！

▼30秒AI診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 10, slot: "night", hour: 20, minute: 0,
    text: `【先着20名初期VIPモニター枠 最終カウントダウン】

Pro機能永久使い放題のVIPモニター枠、残りわずかとなっています！
診断ツール実行後に表示されるバナーからすぐ応募できます。

▼30秒AI診断＆VIP応募👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },

  // --- Day 12 (10/20) ---
  {
    day: 11, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

新しい1週間のスタート！今週も英語学習を楽しんでいきましょう！

毎日の上達を実感するために、まずは今のスコアを30秒で記録してみませんか？

▼無料30秒AI診断👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 11, slot: "lunch", hour: 12, minute: 30,
    text: `昼休みの30秒で自分の発音力＆推定TOEICスコアチェック！

面倒な会員登録・ログイン一切なし。
サイトを開いて声を出すだけですぐ判定されます💡

▼今すぐ無料診断👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 11, slot: "night", hour: 20, minute: 0,
    text: `「高額な英語スクールに通わなくても、AIを活用すれば独学でスピーキングもリスニングも伸ばせる」

そんな世界を作りたいと思ってShadowLogを作っています。
30秒診断でそのスピード感を体験してみてください！

▼30秒AI無料診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #個人開発 #ShadowLog`
  },

  // --- Day 13 (10/21) ---
  {
    day: 12, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

朝の通学・通勤時間にサクッと30秒英語診断！

音の連結（リンキング）再現度やWPMを判定して、今日の英語学習の目標をセットしましょう！

▼30秒AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 12, slot: "lunch", hour: 12, minute: 30,
    text: `【リスニング力が跳ね上がるポイント】

文字で英語を読むのではなく、「聞こえた音そのまま」を真似して発声すること。

AIがあなたの発音再現度をリアルタイムでスコア化します！

▼無料30秒AI診断👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #シャドーイング #TOEIC #ShadowLog`
  },
  {
    day: 12, slot: "night", hour: 20, minute: 0,
    text: `【いよいよラスト枠！】初期VIPモニター募集

全Pro機能無制限使い放題の初期VIPモニター枠、まもなく上限20名に達します！
気になっている方はお早めに診断＆エントリーをお願いします！

▼30秒AI診断＆VIP応募👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #VIPモニター #ShadowLog`
  },

  // --- Day 14 (10/22) ---
  {
    day: 13, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

2週間の自動チャレンジ最終日！たくさんの診断ご利用ありがとうございます！

今日も朝の30秒で自分の発音WPMと推定TOEICスコアをチェックして一日をスタートしましょう！

▼30秒無料AI診断👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 13, slot: "lunch", hour: 12, minute: 30,
    text: `昼休みのスキマ時間に30秒で英語実力テスト！

・語彙再現率
・WPM（話すスピード）
・推定TOEICスコア
をAIが判定します💡

今すぐ試せる無料診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 13, slot: "night", hour: 20, minute: 0,
    text: `声を出して英語力を伸ばすAIシャドーイングアプリ「ShadowLog」。

これからも皆さまが楽しく、効果的に英語力を伸ばせる機能をどんどんアップデートしていきます！

まずは30秒無料AI診断であなたの実力を試してみてください🔥

▼30秒AI無料診断
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #シャドーイング #ShadowLog`
  }
];

function generateQueue() {
  const finalQueue: QueueItem[] = [];

  for (const item of postsData) {
    const scheduledAt = getJstIsoString(item.day, item.hour, item.minute);
    const queueItem: QueueItem = {
      id: `queue_2w_${item.day + 1}_${item.slot}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: item.text,
      scheduledAt,
      status: "pending",
    };
    finalQueue.push(queueItem);
  }

  saveQueue(finalQueue);
  console.log(`🎉 Successfully generated and saved ${finalQueue.length} scheduled posts for 2-week Threads campaign!`);
}

generateQueue();

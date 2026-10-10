import { saveQueue, QueueItem } from "../src/lib/threads/publisher";
import path from "path";

const OGP_IMAGE_URL = "https://shadowlog.vercel.app/diagnosis/opengraph-image";
const startDate = new Date("2026-10-11T00:00:00+09:00");

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

// 14-Day Humanized Conversational Posts Matrix (42 Posts Total)
const postsData = [
  // --- Day 1 (10/11 - Sun) ---
  {
    day: 0, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

日曜日ですね！みなさん休日の朝はどこで英語勉強してますか？自分はカフェで静かに発声練習するのが習慣になってます☕️

そういえば自分の英語の発話スピード（WPM）って測ったことありますか？
30秒声を出すだけでAIがTOEIC推定スコアと一緒に測定してくれるツールを作ったので、よかったら休日の朝活に遊んでみてください！

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 0, slot: "lunch", hour: 12, minute: 30,
    text: `みんなお昼何食べてる？🍱

英語学習してて一番しんどいのって何ですか？
自分は昔、知ってるはずの単語なのにネイティブの早口で全く聞き取れなかった時でした…泣

"Check it out" が "チェケラウ" に聞こえるみたいな「音の連結（リンキング）」再現度、AIが30秒でチェックしてくれる無料ツール作ったので試してみてね！

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 0, slot: "night", hour: 20, minute: 0,
    text: `今日もお疲れ様です！夜の勉強タイムの方も多いかな？🌙

実はシャドテンを使いたかったんですが月2万円が高すぎて継続を断念し…悔しくて自分で作ったのがこの「ShadowLog」です（笑）

30秒声を吹き込むだけで発声WPMと推定TOEICスコアが無料判定できるので、今日の締めくくりにぜひ試してみてください！

https://shadowlog.vercel.app/diagnosis

#英語学習 #個人開発 #TOEIC #ShadowLog`
  },

  // --- Day 2 (10/12 - Mon) ---
  {
    day: 1, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

月曜日スタート！みなさん通勤・通学中ですか？
電車の中で単語帳見てる人見かけると「仲間だ…！」って嬉しくなります。

朝の隙間時間30秒で、自分の「英語を話すスピード」と推定TOEICスコアがAI判定できる無料ツール置いておきますね👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 1, slot: "lunch", hour: 12, minute: 30,
    text: `お昼休みにちょっと英語小ネタ💡

英語の発音スピードの目安ってご存知ですか？
・初級者: 90〜110 WPM
・中級（TOEIC600〜700）: 120〜140 WPM
・ネイティブ日常会話: 160〜180 WPM

あなたの今のスピードは何WPM？30秒でAIが測ってくれます！

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 1, slot: "night", hour: 20, minute: 0,
    text: `月曜日の夜、いかがお過ごしですか？

「英語を話す時、頭の中で英作文しちゃって言葉が詰まる…」って悩みありませんか？
これ、単語力じゃなくて脳内の単語検索スピード（WPM）の問題だったりします。

30秒で自分のWPMと弱点が可視化できるAI診断、夜の学習のついでにやってみてね！

https://shadowlog.vercel.app/diagnosis

#英語学習 #英会話 #ShadowLog`
  },

  // --- Day 3 (10/13 - Tue) ---
  {
    day: 2, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

火曜日の朝！みなさん英語学習のモチベーション維持どうしてますか？
自分は「自分の成長を数値で見ること」が一番効くタイプです。

30秒声を出すだけで有効WPMと推定TOEICスコアが数値化される無料AI診断、よかったら朝の運動がてら試してみてね！

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 2, slot: "lunch", hour: 12, minute: 30,
    text: `ランチタイム英語クイズ！

"What do you want to do?" 
ネイティブが言うと "Whaddya wanna do?" って聴こえますよね。

耳で追うだけじゃなくて口を動かして真似するとリスニング力が一気に上がります！
あなたの発声再現度をAIが30秒判定👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #発音 #ShadowLog`
  },
  {
    day: 2, slot: "night", hour: 20, minute: 0,
    text: `【先着20名限定】初期VIPモニター募集中！

実は30秒AI診断を受けてくれた方限定で、正式版もPro機能（無制限練習・詳細AIフィードバック）が使い放題になるVIPモニター枠を開放しています！

残り枠数をリアルタイム表示中。気になる方はお早めにどうぞ👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #VIPモニター #ShadowLog`
  },

  // --- Day 4 (10/14 - Wed) ---
  {
    day: 3, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

水曜日、折り返し地点ですね！
「洋画を字幕なしで見たい！」と思って英語始めた時のワクワク、忘れないようにしたいです。

朝の30秒で自分の英語発声スピードをチェックして、今日も一日頑張っていきましょう！

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 3, slot: "lunch", hour: 12, minute: 30,
    text: `お昼休み30秒チャレンジ！

「シャドーイングって難しそう…」という声をもらったので、お手本を聞いてから落ち着いて発声できる「リピーティングモード」も作りました！

まずは無料の30秒診断で試してみてね👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 3, slot: "night", hour: 20, minute: 0,
    text: `英語が聞き取れない原因って、実は3段階あるんです。

1. 単語の意味がわからない（語彙不足）
2. 変化した音が聞き取れない（リンキング未定着）
3. スピードについていけない（WPM不足）

自分がどこで詰まってるか知るだけで学習効率変わりますよ！30秒AI診断はこちら👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #シャドーイング #ShadowLog`
  },

  // --- Day 5 (10/15 - Thu) ---
  {
    day: 4, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

木曜日の朝！あと少しで週末ですね。
みなさん朝の英語学習ルーティンって何か決めてますか？

自分は毎朝30秒だけAI診断で声を出してウォームアップしてます！今朝のスコアチェックにどうぞ👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 4, slot: "lunch", hour: 12, minute: 30,
    text: `英語の音変化あるある💡

・Water ➔ ワラ
・An apple ➔ アナップル
・Going to ➔ ゴナ

自分の口で再現できているかAIが30秒でチェック！
昼休みのスキマ時間に遊んでみてね👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #発音 #ShadowLog`
  },
  {
    day: 4, slot: "night", hour: 20, minute: 0,
    text: `アプリ開発しててユーザーさんから「自分の得意・苦手が数値で分かって面白い！」って言ってもらえたのが一番嬉しかったな…✨

AIが0秒であなたの発音速度（WPM）と推定TOEIC点数を割り出します！

無料30秒AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #個人開発 #ShadowLog`
  },

  // --- Day 6 (10/16 - Fri) ---
  {
    day: 5, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

金曜日！今週ラストスパートですね！
今日を乗り切れば週末。朝の30秒でサクッと英語力チェックして気持ちよくスタートしませんか？

ログイン不要でスマホマイクからすぐ試せます👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 5, slot: "lunch", hour: 12, minute: 30,
    text: `ハッピーフライデー！昼休み何してますか？🍱

「高額なスクールに通わなくても、AIを使えば独学で英語スピーキングもリスニングも伸ばせる」
そんなアプリを目指して日々改善中です！

まずは30秒無料診断でスピード感を体験してみてね👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 5, slot: "night", hour: 20, minute: 0,
    text: `1週間お仕事・お勉強お疲れ様でした！🍻

金曜夜の解放感最高ですね。
「今週英語頑張ったな〜」という方も、「来週から頑張る！」という方も、今の実力を30秒で記録しておきませんか？

推定TOEICスコアもその場で出ます👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },

  // --- Day 7 (10/17 - Sat) ---
  {
    day: 6, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

土曜日の朝！休日ってついついダラダラしがちですが、朝イチで30秒だけ声を出しておくと脳がシャキッと目覚めますよ！

自分の発音WPMと推定TOEICスコアをAIで測ってみよう👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 6, slot: "lunch", hour: 12, minute: 30,
    text: `休日の昼下がり、いかがお過ごしですか？☕️

「TOEICのリスニングパート、後半になると集中力切れて追いつけなくなる…」という悩み。
実は発話スピード（WPM）に耳を慣らすと一気に聞き取れるようになります！

30秒無料AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 6, slot: "night", hour: 20, minute: 0,
    text: `【先着20名初期VIPモニター枠 カウントダウン】

全Pro機能が無制限使い放題になる初期VIPモニター枠、少しずつ枠が埋まってきています！

30秒AI診断を受けると診断結果画面からエントリーできます。残枠表示をチェックしてみてね👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #VIPモニター #ShadowLog`
  },

  // --- Day 8 (10/18 - Sun) ---
  {
    day: 7, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

日曜日！みなさん英語学習で一番達成感感じるのってどんな瞬間ですか？
自分は「字幕なしでフレーズが聞き取れた瞬間」が最高にアドレナリン出ます！

朝の30秒AI診断でモチベーション上げていきましょう👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 7, slot: "lunch", hour: 12, minute: 30,
    text: `日曜のランチタイム！

「英語の勉強、独学だとモチベが続かない…」って方いませんか？
自分の成長がWPM（数字）で可視化されるとゲーム感覚で続けやすくなりますよ！

まずは今のWPMを30秒でAIチェックしてみよう👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 7, slot: "night", hour: 20, minute: 0,
    text: `明日からまた新しい1週間が始まりますね！

「今週こそ英語学習習慣化するぞ！」という意気込み、応援してます🔥
まずは今夜の30秒で現在の発声速度と推定TOEICスコアをスタート地点として記録しておきませんか？

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },

  // --- Day 9 (10/19 - Mon) ---
  {
    day: 8, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

月曜日の朝！また1週間頑張っていきましょう！
通勤・通学電車の中で30秒だけ声を出さずに（または小声で）試せる英語力チェックツール置いておきますね。

AIが発話WPMと推定TOEICスコアを分析👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 8, slot: "lunch", hour: 12, minute: 30,
    text: `お昼休み30秒チャレンジ！

【TOEICスコア別・発声WPM目安】
・500点レベル: 〜110 WPM
・700点レベル: 120〜140 WPM
・850点以上: 150+ WPM

あなたの今のスピードは何WPM？30秒でAIが判定します！

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 8, slot: "night", hour: 20, minute: 0,
    text: `月曜夜のお疲れ様です！

「リスニング力伸ばしたいけどシャドーイングって正しくできてるか不安…」という方へ。
Whisper AIがあなたの発音を可視化してくれるので、ひとりでも安心して練習できます！

まずは30秒無料診断からどうぞ👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #シャドーイング #ShadowLog`
  },

  // --- Day 10 (10/20 - Tue) ---
  {
    day: 9, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

火曜日！朝の30秒で英語脳を呼び覚ましましょう！

短い英文を3問読むだけで、AIが有効WPM・音の連結再現率・推定TOEICスコアを判定します。

今朝のウォームアップはこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 9, slot: "lunch", hour: 12, minute: 30,
    text: `みんな昼休みリフレッシュできてますか？☕️

英語の聞き取りで「音が消える（Reduction）」現象：
・Going to ➔ ゴナ
・Want to ➔ ワナ

自分が言えるようになると自然と聞き取れるようになります！
AIがあなたの再現度を30秒チェック👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 9, slot: "night", hour: 20, minute: 0,
    text: `【残りわずか】先着20名初期VIPモニター！

全Pro機能無制限使い放題のVIPモニター枠、まもなく終了となります。
気になる方は30秒AI診断後のエントリー画面からお早めに応募してくださいね！

無料30秒AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #VIPモニター #ShadowLog`
  },

  // --- Day 11 (10/21 - Wed) ---
  {
    day: 10, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

水曜日！週の折り返し地点ですね！
「最近英語の勉強サボりがちかも…」という方も、30秒なら今すぐできますよ！

今の実力をAIでサクッと測ってモチベ再点火しましょう🔥

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 10, slot: "lunch", hour: 12, minute: 30,
    text: `昼休み英語小ネタ💡

英語のスピーキングで大切なのは「完璧な文法」よりも「相手に届くテンポ（WPM）」。

あなたの発話スピードは今何WPM？30秒でAIが計測します！

▼無料AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #英会話 #TOEIC #ShadowLog`
  },
  {
    day: 10, slot: "night", hour: 20, minute: 0,
    text: `個人開発でShadowLogを作ってから、色んな英語学習者さんと繋がれて本当に嬉しいです…！

これからもみんなが楽しく声を出せるアプリを目指して改善していきます！

まずは30秒診断で遊んでみてね👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #個人開発 #ShadowLog`
  },

  // --- Day 12 (10/22 - Thu) ---
  {
    day: 11, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

木曜日！週末まであと少し！
朝の通学・通勤の30秒で英語力をチェックしてみませんか？

単語の再現率や推定TOEICスコアがリアルタイムで分かります。

今朝の診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 11, slot: "lunch", hour: 12, minute: 30,
    text: `ランチタイム30秒チャレンジ！

「TOEICスコア伸ばしたいけど時間がない…」という方にこそ、1日3分のAIシャドーイングがおすすめです！

まずは30秒であなたの現在地をAI判定してみよう👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 11, slot: "night", hour: 20, minute: 0,
    text: `【いよいよラスト枠！】初期VIPモニター募集

Pro機能無制限使い放題のVIPモニター枠、残りわずかです！
30秒AI診断を受けると結果画面からワンタップで応募できます。お見逃しなく！

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },

  // --- Day 13 (10/23 - Fri) ---
  {
    day: 12, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

華金ですね！今日を乗り切れば週末！
朝の30秒で自分の英語発声スピードをチェックして、今日も一日元気にいきましょう！

無料30秒AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 12, slot: "lunch", hour: 12, minute: 30,
    text: `金曜日の昼休み！

文字で英語を読むのではなく、「聞こえた音そのまま」を真似して発声すること。
これがリスニング力爆伸びの秘訣です！

AIがあなたの発声再現度を30秒で採点👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #シャドーイング #TOEIC #ShadowLog`
  },
  {
    day: 12, slot: "night", hour: 20, minute: 0,
    text: `1週間本当にお疲れ様でした！🍻

週末の楽しみに向けて、今の自分の英語力（WPM＆推定TOEICスコア）を30秒で記録しておきませんか？

無料AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },

  // --- Day 14 (10/24 - Sat) ---
  {
    day: 13, slot: "morning", hour: 8, minute: 0,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

2週間のThreadsチャレンジ最終日！いつも見てくださりありがとうございます！

今日も朝の30秒で自分の発音WPMと推定TOEICスコアをチェックして、最高の休日をスタートしましょう！

▼30秒無料AI診断👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 13, slot: "lunch", hour: 12, minute: 30,
    text: `休日の昼下がり30秒実力テスト！

・語彙再現率
・WPM（話すスピード）
・推定TOEICスコア

面倒な登録一切なしでAIが判定します💡
今すぐ試せる無料診断はこちら👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 13, slot: "night", hour: 20, minute: 0,
    text: `声を出して英語力を伸ばすAIシャドーイングアプリ「ShadowLog」。

これからもみんなが楽しく、効果的に英語を学べる機能をどんどん作っていきます！

まずは30秒無料AI診断であなたの実力を試してみてね🔥

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #シャドーイング #ShadowLog`
  }
];

function generateQueue() {
  const finalQueue: QueueItem[] = [];

  for (const item of postsData) {
    const scheduledAt = getJstIsoString(item.day, item.hour, item.minute);
    const queueItem: QueueItem = {
      id: `queue_humanized_2w_${item.day + 1}_${item.slot}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: item.text,
      imageUrl: OGP_IMAGE_URL,
      scheduledAt,
      status: "pending",
    };
    finalQueue.push(queueItem);
  }

  saveQueue(finalQueue);
  console.log(`🎉 Successfully generated and saved ${finalQueue.length} humanized posts with OGP image attachments!`);
}

generateQueue();

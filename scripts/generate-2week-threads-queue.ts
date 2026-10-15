import { saveQueue, QueueItem } from "../src/lib/threads/publisher";
import path from "path";

const OGP_IMAGE_URL = "https://shadowlog.vercel.app/og-image.png";
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

// 14-Day Optimized Posts (42 Posts Total: URL included 1 in 3 posts for maximum reach)
const postsData = [
  // --- Day 1 (10/11 - Sun) ---
  {
    day: 0, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

日曜日ですね！みなさん休日の朝はどこで英語勉強してますか？自分はカフェで静かに発声練習するのが習慣になってます☕️

そういえば自分の英語の発話スピード（WPM）って測ったことありますか？気になる方はプロフィールのリンクから1分でAIチェックできますよ！

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 0, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `みんなお昼何食べてる？🍱

英語学習してて一番しんどいのって何ですか？
自分は昔、知ってるはずの単語なのにネイティブの早口で全く聞き取れなかった時でした…泣

やっぱり耳だけで追うより、自分の口で発声してみるのが一番の近道だと実感してます。

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 0, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `今日もお疲れ様です！夜の勉強タイムの方も多いかな？🌙

実はシャドテンを使いたかったんですが月2万円が高すぎて継続を断念し…悔しくて自分で作ったのがこの「ShadowLog」です（笑）

1分声を吹き込むだけで発声WPMと推定TOEICスコアが無料判定できるので、今日の締めくくりにぜひ試してみてください！

https://shadowlog.vercel.app/diagnosis

#英語学習 #個人開発 #TOEIC #ShadowLog`
  },

  // --- Day 2 (10/12 - Mon) ---
  {
    day: 1, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

月曜日スタート！みなさん通勤・通学中ですか？
電車の中で単語帳見てる人見かけると「仲間だ…！」って密かに心の中で応援しちゃいます。

今週も英語学習楽しんでいきましょう🔥

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 1, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `お昼休みにちょっと英語小ネタ💡

英語の発音スピード目安：
・初級者: 90〜110 WPM
・中級（TOEIC600〜700）: 120〜140 WPM
・ネイティブ日常会話: 160〜180 WPM

自分の現在地を知るだけでも学習のモチベ変わりますよね！

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 1, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `月曜日の夜、いかがお過ごしですか？

「英語を話す時、頭の中で英作文しちゃって言葉が詰まる…」って悩みありませんか？
これ、単語力じゃなくて脳内の単語検索スピード（WPM）の問題だったりします。

1分で自分のWPMと弱点が可視化できるAI診断、夜の学習のついでにやってみてね！

https://shadowlog.vercel.app/diagnosis

#英語学習 #英会話 #ShadowLog`
  },

  // --- Day 3 (10/13 - Tue) ---
  {
    day: 2, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

火曜日の朝！みなさん英語学習のモチベーション維持どうしてますか？
自分は「自分の成長を数値で見ること」が一番効くタイプです。

少しずつでも毎日前に進んでいきましょう！

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 2, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `ランチタイム英語クイズ！

"What do you want to do?" 
ネイティブが言うと "Whaddya wanna do?" って聴こえますよね。

耳で追うだけじゃなくて口を動かして真似するとリスニング力が一気に上がりますよ！

#英語学習 #TOEIC #発音 #ShadowLog`
  },
  {
    day: 2, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `【先着20名限定】初期VIPモニター募集中！

実は1min AI診断を受けてくれた方限定で、正式版もPro機能（無制限練習・詳細AIフィードバック）が使い放題になるVIPモニター枠を開放しています！

残り枠数をリアルタイム表示中。気になる方はお早めにどうぞ👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #VIPモニター #ShadowLog`
  },

  // --- Day 4 (10/14 - Wed) ---
  {
    day: 3, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

水曜日、折り返し地点ですね！
「洋画を字幕なしで見たい！」と思って英語始めた時のワクワク、今でも大切にしてます。

今日も一日頑張っていきましょう！

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 3, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `お昼休み1分チェック！

「シャドーイングって難しそう…」という声をもらったので、お手本を聞いてから落ち着いて発声できる「音読モード」も作りました。

自分のペースで声を出していくのが長続きのコツです💡

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 3, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `英語が聞き取れない原因って、実は3段階あるんです。

1. 単語の意味がわからない（語彙不足）
2. 変化した音が聞き取れない（リンキング未定着）
3. スピードについていけない（WPM不足）

自分がどこで詰まってるか知るだけで効率変わります！1min AI診断はこちら👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #シャドーイング #ShadowLog`
  },

  // --- Day 5 (10/15 - Thu) ---
  {
    day: 4, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

木曜日の朝！あと少しで週末ですね。
みなさん朝の英語学習ルーティンって何か決めてますか？

自分は毎朝好きな英語フレーズを3つ声に出すのを習慣にしてます☕️

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 4, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `英語の音変化あるある💡

・Water ➔ ワラ
・An apple ➔ アナップル
・Going to ➔ ゴナ

自分の口で言えるようになると自然と聞き取れるようになりますよ！

#英語学習 #TOEIC #発音 #ShadowLog`
  },
  {
    day: 4, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `アプリ開発しててユーザーさんから「自分の得意・苦手が数値で分かって面白い！」って言ってもらえたのが一番嬉しかったな…✨

AIが0秒であなたの発音速度（WPM）と推定TOEIC点数を割り出します！

無料1min AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #個人開発 #ShadowLog`
  },

  // --- Day 6 (10/16 - Fri) ---
  {
    day: 5, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

金曜日！今週ラストスパートですね！
今日を乗り切れば週末。朝から気分上げていきましょう！

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 5, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `ハッピーフライデー！昼休み何してますか？🍱

「高額なスクールに通わなくても、AIを使えば独学で英語スピーキングもリスニングも伸ばせる」
そんなアプリを目指して日々改善中です！

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 5, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `1週間お仕事・お勉強お疲れ様でした！🍻

金曜夜の解放感最高ですね。
「今週英語頑張ったな〜」という方も、「来週から頑張る！」という方も、今の実力を1分で記録しておきませんか？

推定TOEICスコアもその場で出ます👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },

  // --- Day 7 (10/17 - Sat) ---
  {
    day: 6, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

土曜日の朝！休日ってついついダラダラしがちですが、朝イチで1分だけ声を出しておくと脳がシャキッと目覚めますよ！

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 6, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `休日の昼下がり、いかがお過ごしですか？☕️

「TOEICのリスニングパート、後半になると集中力切れて追いつけなくなる…」という悩み。
実は発話スピード（WPM）に耳を慣らすと一気に聞き取れるようになります！

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 6, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `【先着20名初期VIPモニター枠 カウントダウン】

全Pro機能が無制限使い放題になる初期VIPモニター枠、少しずつ枠が埋まってきています！

1min AI診断を受けると診断結果画面からエントリーできます。残枠表示をチェックしてみてね👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #VIPモニター #ShadowLog`
  },

  // --- Day 8 (10/18 - Sun) ---
  {
    day: 7, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

日曜日！みなさん英語学習で一番達成感感じるのってどんな瞬間ですか？
自分は「字幕なしでフレーズが聞き取れた瞬間」が最高にアドレナリン出ます！

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 7, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `日曜のランチタイム！

「英語の勉強、独学だとモチベが続かない…」って方いませんか？
自分の成長がWPM（数字）で可視化されるとゲーム感覚で続けやすくなりますよ！

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 7, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `明日からまた新しい1週間が始まりますね！

「今週こそ英語学習習慣化するぞ！」という意気込み、応援してます🔥
まずは今夜の1分で現在の発声速度と推定TOEICスコアをスタート地点として記録しておきませんか？

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },

  // --- Day 9 (10/19 - Mon) ---
  {
    day: 8, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

月曜日の朝！また1週間頑張っていきましょう！
朝の空気吸いながら英語フレーズをぶつぶつ呟くのが日課になってます。

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 8, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `お昼休み小ネタ💡

【TOEICスコア別・発声WPM目安】
・500点レベル: 〜110 WPM
・700点レベル: 120〜140 WPM
・850点以上: 150+ WPM

自分のペースで着実にWPM伸ばしていきましょう！

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 8, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `月曜夜のお疲れ様です！

「リスニング力伸ばしたいけどシャドーイングって正しくできてるか不安…」という方へ。
Whisper AIがあなたの発音を可視化してくれるので、ひとりでも安心して練習できます！

まずは1min無料診断からどうぞ👇

https://shadowlog.vercel.app/diagnosis

#英語学習 #シャドーイング #ShadowLog`
  },

  // --- Day 10 (10/20 - Tue) ---
  {
    day: 9, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

火曜日！朝の1分で英語脳を呼び覚ましましょう！

今日も一歩ずつ前進です🔥

#英語学習 #TOEIC #英会話 #ShadowLog`
  },
  {
    day: 9, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `みんな昼休みリフレッシュできてますか？☕️

英語の聞き取りで「音が消える（Reduction）」現象：
・Going to ➔ ゴナ
・Want to ➔ ワナ

自分が言えるようになると自然と聞き取れるようになりますよ！

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 9, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `【残りわずか】先着20名初期VIPモニター！

全Pro機能無制限使い放題のVIPモニター枠、まもなく終了となります。
気になる方は1min AI診断後のエントリー画面からお早めに応募してくださいね！

無料1min AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #VIPモニター #ShadowLog`
  },

  // --- Day 11 (10/21 - Wed) ---
  {
    day: 10, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

水曜日！週の折り返し地点ですね！
「最近英語の勉強サボりがちかも…」という方も、あきらめずに今日から再開すればOK！

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 10, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `昼休み英語小ネタ💡

英語のスピーキングで大切なのは「完璧な文法」よりも「相手に届くテンポ（WPM）」。

リラックスして声を出していきましょう！

#英語学習 #英会話 #TOEIC #ShadowLog`
  },
  {
    day: 10, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `個人開発でShadowLogを作ってから、色んな英語学習者さんと繋がれて本当に嬉しいです…！

これからもみんなが楽しく声を出せるアプリを目指して改善していきます！

まずは1min診断で遊んでみてね👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #個人開発 #ShadowLog`
  },

  // --- Day 12 (10/22 - Thu) ---
  {
    day: 11, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

木曜日！週末まであと少し！
今日も笑顔で頑張りましょう！

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 11, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `ランチタイム！

「TOEICスコア伸ばしたいけど時間がない…」という方にこそ、1日3分のAIシャドーイングがおすすめです！

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 11, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `【いよいよラスト枠！】初期VIPモニター募集

Pro機能無制限使い放題のVIPモニター枠、残りわずかです！
1min AI診断を受けると結果画面からワンタップで応募できます。お見逃しなく！

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },

  // --- Day 13 (10/23 - Fri) ---
  {
    day: 12, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

華金ですね！今日を乗り切れば週末！
朝から気分上げていきましょう！

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 12, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `金曜日の昼休み！

文字で英語を読むのではなく、「聞こえた音そのまま」を真似して発声すること。
これがリスニング力爆伸びの秘訣です！

#英語学習 #シャドーイング #TOEIC #ShadowLog`
  },
  {
    day: 12, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `1週間本当にお疲れ様でした！🍻

週末の短時間学習に、現在の自分の英語力（WPM＆推定TOEICスコア）を1分で記録しておきませんか？

無料AI診断はこちら👇
https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #ShadowLog`
  },

  // --- Day 14 (10/24 - Sat) ---
  {
    day: 13, slot: "morning", hour: 6, minute: 30, hasUrl: false,
    text: `おはようございます！というと皆と仲良くなれると聞きました！☀️

2週間のThreadsチャレンジ最終日！いつも見てくださりありがとうございます！

最高の休日をお過ごしください！

#英語学習 #TOEIC #朝活 #ShadowLog`
  },
  {
    day: 13, slot: "lunch", hour: 12, minute: 30, hasUrl: false,
    text: `休日の昼下がり！

・語彙再現率
・WPM（話すスピード）
・推定TOEICスコア

自分のペースで一歩ずつ進んでいきましょう💡

#英語学習 #TOEIC #ShadowLog`
  },
  {
    day: 13, slot: "night", hour: 20, minute: 0, hasUrl: true,
    text: `声を出して英語力を伸ばすAIシャドーイングアプリ「ShadowLog」。

これからもみんなが楽しく、効果的に英語を学べる機能をどんどん作っていきます！

まずは1min無料AI診断であなたの実力を試してみてね🔥

https://shadowlog.vercel.app/diagnosis

#英語学習 #TOEIC #シャドーイング #ShadowLog`
  }
];

function generateQueue() {
  const finalQueue: QueueItem[] = [];

  for (const item of postsData) {
    const scheduledAt = getJstIsoString(item.day, item.hour, item.minute);
    const queueItem: QueueItem = {
      id: `queue_humanized_3in1_${item.day + 1}_${item.slot}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: item.text,
      // Only attach OGP image & link when hasUrl is true (1 in 3 posts)
      imageUrl: item.hasUrl ? OGP_IMAGE_URL : undefined,
      scheduledAt,
      status: "pending",
    };
    finalQueue.push(queueItem);
  }

  saveQueue(finalQueue);
  console.log(`🎉 Successfully generated ${finalQueue.length} posts (1 in 3 with URL/OGP image) for Threads campaign!`);
}

generateQueue();

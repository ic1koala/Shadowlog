import { postToThreads, getQueue, saveQueue } from "../src/lib/threads/publisher";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

interface CandidatePost {
  index: number;
  id: string;
  title: string;
  text: string;
}

const PARENT_POST_TEXT = `【どれが好き？】英語学習アプリ「ShadowLog」のロゴオープニングアニメーションを技術相談役が作ってくれたのですが…5パターンとも良すぎて選べなくなりました！😂

ぜひ皆さんの力を貸してください🙇‍♂️

この下に【候補①〜⑤】をツリー（返信）で載せるので、
「これが一番好き！」「アプリ起動時に見たい！」と思った番号の返信に【いいね❤️】で投票をお願いします！

ブラウザで実際のアニメーション全画面プレビューもできます👇
https://shadowlog.vercel.app/logo-vote

「〇番のテンポが好き」「〇番が大人っぽい」などコメントも大歓迎です！
一番いいねが多かったものを正式版の起動画面に採用します✨

👇 候補①〜⑤はツリーへ！

#英語学習 #個人開発 #ロゴデザイン #UIデザイン #ShadowLog`;

const CANDIDATES: CandidatePost[] = [
  {
    index: 1,
    id: "sparkle_wave",
    title: "無からの閃光・ウェーブ出現",
    text: `【候補①：無からの閃光・ウェーブ出現（Zero to Sparkle）】

漆黒の暗闇に一粒の星がキラリと輝き、そこから3本の音声ウェーブと公式ロゴが波紋のように広がる王道のオープニング演出✨

「音と声」が広がる世界観を表現しています。
「王道でかっこいい！」「これが見たい！」と思ったら、この投稿に【いいね❤️】をお願いします！`,
  },
  {
    index: 2,
    id: "particle_converge",
    title: "光粒子の集結・実体化",
    text: `【候補②：光粒子の集結・実体化（Particle Convergence）】

何もない空間から、四方八方に散らばる青と白の光の粒子が中央へ高速で吸い寄せられ、一瞬の閃光とともにロゴへと実体化する演出⚡️

最先端のAIテクノロジー感とワクワク感を表現しています。
「テック感があって好き！」「勢いがある！」と思ったら、この投稿に【いいね❤️】をお願いします！`,
  },
  {
    index: 3,
    id: "blur_focus",
    title: "深淵からのピント結像",
    text: `【候補③：深淵からのピント結像（Mist & Focus Reveal）】

深いブルーの靄（もや）の中から、カメラのピントが急速に合うようにロゴと文字が一文字ずつ滑らかに結像するシネマティックな演出🎬

映画のオープニングのような洗練された美しさを目指しました。
「上品でおしゃれ！」「落ち着いてて好き」と思ったら、この投稿に【いいね❤️】をお願いします！`,
  },
  {
    index: 4,
    id: "blueprint_trace",
    title: "光線ドローイング ➔ フルロゴ展開",
    text: `【候補④：光線ドローイング ➔ フルロゴ展開（Laser Blueprint Trace）】

暗闇を走るレーザー光線が一筆書きで3本の波と星をトレース。描き終えた瞬間にロイヤルブルーが宿り、横並びの公式フルロゴへ展開する演出✏️

設計図から命が吹き込まれるような緻密な動きです。
「スタイリッシュ！」「職人技を感じる！」と思ったら、この投稿に【いいね❤️】をお願いします！`,
  },
  {
    index: 5,
    id: "dimensional_rise",
    title: "シャドウ・スポットライト浮上",
    text: `【候補⑤：シャドウ・スポットライト浮上（Dimensional Spotlight）】

完全な闇（Shadow）に青いスポットライトが差し込み、ツヤのあるガラス光沢とともにロゴが立体的にせり上がる演出💎

Apple製品のようなミニマルで高級感のある、大人の学習空間を演出しています。
「高級感がある！」「シンプルで美しい」と思ったら、この投稿に【いいね❤️】をお願いします！`,
  },
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== Publishing 5 Logo Animations Voting Thread to Threads ===");
  const BANNER_IMAGE_URL = "https://shadowlog.vercel.app/og-image.png";

  // 1. Publish Parent Post
  console.log("\n[1/6] Publishing parent campaign thread...");
  const parentRes = await postToThreads(PARENT_POST_TEXT, BANNER_IMAGE_URL);

  if (!parentRes.success || !parentRes.id) {
    console.error("❌ Failed to publish parent thread:", parentRes.error);
    process.exit(1);
  }

  const parentPostId = parentRes.id;
  console.log(`🎉 Parent thread published successfully! Post ID: ${parentPostId}`);

  const queue = getQueue();
  queue.push({
    id: `logo_vote_parent_${Date.now()}`,
    text: PARENT_POST_TEXT,
    imageUrl: BANNER_IMAGE_URL,
    scheduledAt: new Date().toISOString(),
    status: "published",
    publishedAt: new Date().toISOString(),
    postId: parentPostId,
  });

  // Short pause to ensure parent post is fully propagated in Threads backend
  console.log("Waiting 5s before posting replies...");
  await sleep(5000);

  // 2. Publish 5 candidate replies under the parent post
  const publishedReplies: Array<{ index: number; id: string; postId: string }> = [];

  for (const candidate of CANDIDATES) {
    console.log(`\n[${candidate.index + 1}/6] Publishing Candidate #${candidate.index}: ${candidate.title}...`);
    const replyRes = await postToThreads(candidate.text, undefined, parentPostId);

    if (replyRes.success && replyRes.id) {
      console.log(`✅ Candidate #${candidate.index} published! Reply Post ID: ${replyRes.id}`);
      publishedReplies.push({ index: candidate.index, id: candidate.id, postId: replyRes.id });

      queue.push({
        id: `logo_vote_candidate_${candidate.index}_${Date.now()}`,
        text: candidate.text,
        scheduledAt: new Date().toISOString(),
        status: "published",
        publishedAt: new Date().toISOString(),
        postId: replyRes.id,
      });

      // Pause 3s between replies
      await sleep(3000);
    } else {
      console.error(`❌ Failed to publish candidate #${candidate.index}:`, replyRes.error);
    }
  }

  saveQueue(queue);
  console.log("\n🎉 All 5 candidate replies published and queued successfully!");
  console.log(`Parent Post ID: ${parentPostId}`);
  console.log("Reply Post IDs:", publishedReplies);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

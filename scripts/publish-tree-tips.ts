import { postToThreads, getQueue, saveQueue } from "../src/lib/threads/publisher";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const PARENT_POST_ID = "18099407192638664"; // Today's morning post

async function main() {
  console.log("🚀 Publishing Science-backed TIPS thread tree to Threads...");

  // Tree Reply 1: The Evidence-Based Learning Science Tip
  const r1Text = `【科学的エビデンスがある英語学習の真実🧠】
認知心理学や脳科学（ワーキングメモリ理論）の研究によると、実は「英語はただ聞き流すだけでは定着しにくい」ことが分かっています。

人間の脳は『自分が正しく発話できる音（音韻）』しか、無意識に意味として処理できない仕組み（音韻ループ）になっているためです。

第二言語習得論の実験でも、音声を真似て自分の口で発声する（シャドーイング）を取り入れたグループは、単なる聞き流し群に比べてリスニング理解度が有意に向上することが実証されています。

耳を鍛える最短ルートは、実は「1日1分でも声に出すこと」なんです💡`;

  console.log("Publishing Tree Reply 1 (Evidence Tip)...");
  const res1 = await postToThreads(r1Text, undefined, PARENT_POST_ID);

  if (!res1.success || !res1.id) {
    console.error("❌ Failed to post Tree Reply 1:", res1.error);
    process.exit(1);
  }

  const r1Id = res1.id;
  console.log(`🎉 Reply 1 published! ID: ${r1Id}`);

  // Small delay between replies
  await new Promise((r) => setTimeout(r, 4000));

  // Tree Reply 2: Bridge to ShadowLog & Logo Vote Post Link
  const r2Text = `ちなみに…！✨
この科学的アプローチを手軽に1分で測定・習慣化できるアプリ「ShadowLog」を個人開発中なのですが、現在アプリ起動時の【ロゴアニメーション総選挙】を大接戦で開催しています！😂

技術相談役が作ってくれた5つの候補、ぜひ直感で「これが好き！」という番号にいいねで投票していただけると嬉しいです🙇‍♂️👇
https://www.threads.com/@shadowlog_official/post/DejftLwj1rL

ブラウザで全画面プレビューもできます：
https://shadowlog.vercel.app/logo-vote`;

  console.log("Publishing Tree Reply 2 (Logo Vote Bridge)...");
  const res2 = await postToThreads(r2Text, undefined, r1Id);

  if (!res2.success || !res2.id) {
    console.error("❌ Failed to post Tree Reply 2:", res2.error);
    process.exit(1);
  }

  const r2Id = res2.id;
  console.log(`🎉 Reply 2 published! ID: ${r2Id}`);

  // Record to queue
  const nowIso = new Date().toISOString();
  const queue = getQueue();
  queue.push(
    {
      id: `tree_tip_science_${Date.now()}`,
      text: r1Text,
      replyToId: PARENT_POST_ID,
      scheduledAt: nowIso,
      status: "published",
      publishedAt: nowIso,
      postId: r1Id,
    },
    {
      id: `tree_logo_vote_bridge_${Date.now()}`,
      text: r2Text,
      replyToId: r1Id,
      scheduledAt: nowIso,
      status: "published",
      publishedAt: nowIso,
      postId: r2Id,
    }
  );
  saveQueue(queue);
  console.log("✅ Recorded tree posts to .threads-queue.json");
}

main().catch(console.error);

import { postToThreads, getQueue, saveQueue, QueueItem } from "../src/lib/threads/publisher";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  console.log("🚀 Publishing 24-hour English Learning Style Poll to Threads...");

  const pollText = `英語学習が続くかどうか、ぶっちゃけ「学習スタイルとの相性」が9割だと思ってます。
あなたが一番しっくりくる・続けやすいスタイルはどれですか？👇

投票は【24時間限定】です！
選んだ具体的な理由や、「自分はこうやってる！」というこだわりがあれば、ぜひリプ欄で教えてください。
共感するコメントがあったら「いいね」や返信で盛り上がりましょう🙌

#英語学習 #英会話 #社会人の英語 #習慣化 #ShadowLog`;

  const pollOptions = {
    option_a: "スマホ (スキマ派)",
    option_b: "ノート (手書き派)",
    option_c: "声に出す (音読派)",
    option_d: "参考書 (机集中派)",
  };

  const result = await postToThreads(pollText, undefined, undefined, pollOptions);

  if (!result.success || !result.id) {
    console.error("❌ Failed to publish Poll to Threads:", result.error);
    process.exit(1);
  }

  const postId = result.id;
  const nowIso = new Date().toISOString();
  console.log(`🎉 Successfully published Poll Thread! Post ID: ${postId}`);

  // Save to queue
  const queue = getQueue();
  const queueItem: QueueItem = {
    id: `poll_learning_style_${Date.now()}`,
    text: pollText,
    pollOptions,
    scheduledAt: nowIso,
    status: "published",
    publishedAt: nowIso,
    postId,
  };

  queue.push(queueItem);
  saveQueue(queue);
  console.log("✅ Recorded Poll to .threads-queue.json");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

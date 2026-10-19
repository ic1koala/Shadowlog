import { postToThreads, getQueue, saveQueue, QueueItem } from "../src/lib/threads/publisher";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const text = `おはようございます！朝活頑張っていきましょう♪
今日も素晴らしい一日のスタートですね☀️

昨日行った【英語学習スタイル4択】、みなさんの今朝の学習スタイルはどれですか？👇

① スマホで手軽に（スキマ派）📱
② ノートに手書き（実感派）✍️
③ 声に出して練習（音読派）🗣️
④ 机で参考書（集中派）📖

「今朝はこれやってる！」「自分はこの組み合わせ！」など、ぜひ番号やこだわりをリプで教えてください🙌
本日お昼まで投票も受付中です✨

#おはようThreads #朝活 #英語学習 #英語の勉強 #ShadowLog`;

  console.log("Publishing morning post to Threads...");
  const result = await postToThreads(text);

  if (!result.success || !result.id) {
    console.error("Failed to post:", result.error);
    process.exit(1);
  }

  console.log("🎉 Successfully published! Post ID:", result.id);

  const nowIso = new Date().toISOString();
  const queue = getQueue();
  queue.push({
    id: `morning_threads_${Date.now()}`,
    text,
    scheduledAt: nowIso,
    status: "published",
    publishedAt: nowIso,
    postId: result.id,
  });
  saveQueue(queue);
  console.log("Recorded to .threads-queue.json");
}

main().catch(console.error);

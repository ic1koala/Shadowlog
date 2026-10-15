import { postToThreads, getQueue, saveQueue } from "../src/lib/threads/publisher";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const POST_TEXT = `こんにちは！いつも見てくださりありがとうございます☀️

実は「ShadowLog」のベータ版無料枠をスタートしました！

社会人になってから「英語を話せるようになりたい」と思っても、職場に外国人がいるわけでもなく、普段声に出す機会って本当にゼロですよね…。
スクールや添削サービスも月2万円以上して手が出しにくく、単語帳を眺めては挫折する日々でした。

「高額なお金をかけずに、毎日1分でも自分の声で発話するきっかけを作りたい」
そんな悔しさと想いから個人開発したのがこのアプリです🎙️

AIが0秒で発音やWPM（発話速度）を可視化してくれるので、独学でも迷わず声を出せます。
「忙しくて話す機会がない」「独学だと発音が合ってるか不安」という社会人の方にこそ使ってみてほしいです！

ブラウザで登録不要・完全無料で試せるので、ぜひ感想を聞かせてください👇
https://shadowlog.vercel.app

みなさんは普段、英語を話す習慣どうやって作ってますか？💭

#英語学習 #シャドーイング #英会話 #習慣化 #ShadowLog`;

const IMAGE_URL = "https://shadowlog.vercel.app/diagnosis/opengraph-image";

async function main() {
  console.log(`Publishing Beta Free Tier Announcement to Threads...`);
  console.log(`Text Length: ${POST_TEXT.length} characters`);
  console.log(`Image: ${IMAGE_URL}`);

  const result = await postToThreads(POST_TEXT, IMAGE_URL);

  if (result.success) {
    console.log(`🎉 Successfully published to Threads! Post ID: ${result.id}`);
    const queue = getQueue();
    queue.push({
      id: `beta_announcement_${Date.now()}`,
      text: POST_TEXT,
      imageUrl: IMAGE_URL,
      scheduledAt: new Date().toISOString(),
      status: "published",
      publishedAt: new Date().toISOString(),
      postId: result.id,
    });
    saveQueue(queue);
    console.log(`Logged post to .threads-queue.json`);
  } else {
    console.error(`❌ Failed to publish:`, result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

import dotenv from "dotenv";
import path from "path";
import { postToThreads } from "../src/lib/threads/publisher";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const POLL_POST_ID = process.argv[2] || "18124385011898980";

async function main() {
  const token = process.env.THREADS_ACCESS_TOKEN;
  if (!token) {
    console.error("THREADS_ACCESS_TOKEN missing");
    process.exit(1);
  }

  const url = `https://graph.threads.net/v1.0/${POLL_POST_ID}?fields=id,permalink,poll_attachment{option_a,option_b,option_c,option_d,option_a_votes_percentage,option_b_votes_percentage,option_c_votes_percentage,option_d_votes_percentage,total_votes,expiration_timestamp}&access_token=${token}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || !data.poll_attachment) {
    console.error("Failed to fetch poll details:", data);
    process.exit(1);
  }

  const p = data.poll_attachment;
  console.log("=== Poll Current Status ===");
  console.log(`URL: ${data.permalink}`);
  console.log(`Total Votes: ${p.total_votes}`);
  console.log(`Expires At: ${p.expiration_timestamp}`);
  console.log(`1. ${p.option_a}: ${p.option_a_votes_percentage}%`);
  console.log(`2. ${p.option_b}: ${p.option_b_votes_percentage}%`);
  console.log(`3. ${p.option_c}: ${p.option_c_votes_percentage}%`);
  console.log(`4. ${p.option_d}: ${p.option_d_votes_percentage}%`);

  const autoPublishReply = process.argv.includes("--publish-summary");
  if (autoPublishReply) {
    console.log("Publishing follow-up summary reply to thread...");
    const summaryText = `【投票結果の発表です！📊】
24時間の投票にご参加いただきありがとうございました！✨

集計結果：
1位：${p.option_a} (${p.option_a_votes_percentage}%)
2位：${p.option_c} (${p.option_c_votes_percentage}%)
3位：${p.option_d} (${p.option_d_votes_percentage}%)
4位：${p.option_b} (${p.option_b_votes_percentage}%)

総投票数：${p.total_votes}票

やはり現代は忙しいスキマ時間に手軽に声を出したり、スマホでサクッと進めるスタイルが支持されていますね！
それぞれのスタイルに合わせて、少しずつ継続していきましょう🔥`;

    const replyResult = await postToThreads(summaryText, undefined, POLL_POST_ID);
    if (replyResult.success) {
      console.log(`🎉 Published follow-up reply! ID: ${replyResult.id}`);
    } else {
      console.error("Failed to post follow-up reply:", replyResult.error);
    }
  }
}

main().catch(console.error);

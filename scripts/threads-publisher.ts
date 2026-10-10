import { postToThreads, processQueue, enqueuePost, getQueue } from "../src/lib/threads/publisher";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--process-queue")) {
    console.log("Processing pending Threads queue...");
    const res = await processQueue();
    console.log(`Processed ${res.processedCount} items. Results:`, res.results);
    return;
  }

  if (args.includes("--list-queue")) {
    const queue = getQueue();
    console.log("Current Threads Queue:", JSON.stringify(queue, null, 2));
    return;
  }

  const textIndex = args.indexOf("--text");
  if (textIndex !== -1 && args[textIndex + 1]) {
    const text = args[textIndex + 1];
    const scheduleIndex = args.indexOf("--schedule");
    const imageIndex = args.indexOf("--image-url");
    const imageUrl = imageIndex !== -1 ? args[imageIndex + 1] : undefined;

    if (scheduleIndex !== -1 && args[scheduleIndex + 1]) {
      const scheduledAt = args[scheduleIndex + 1];
      const item = enqueuePost(text, scheduledAt, imageUrl);
      console.log(`Enqueued post for ${scheduledAt}:`, item);
    } else {
      console.log(`Publishing post immediately to Threads... (Image: ${imageUrl || "none"})`);
      const result = await postToThreads(text, imageUrl);
      if (result.success) {
        console.log(`🎉 Successfully published to Threads! Post ID: ${result.id}`);
      } else {
        console.error(`❌ Failed to publish:`, result.error);
        process.exit(1);
      }
    }
    return;
  }

  console.log(`
Usage:
  npx tsx scripts/threads-publisher.ts --text "Your Threads Post Text" [--image-url "https://..."]
  npx tsx scripts/threads-publisher.ts --text "Your Post Text" --schedule "2026-10-11T08:00:00+09:00" [--image-url "https://..."]
  npx tsx scripts/threads-publisher.ts --process-queue
  npx tsx scripts/threads-publisher.ts --list-queue
`);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

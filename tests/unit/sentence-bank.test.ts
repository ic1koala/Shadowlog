import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  MAX_SENTENCES_PER_SLOT,
  WEEKLY_REPLACE_RATIO,
  clearMemorySentenceBank,
  getMemorySlotItems,
  getSlotCount,
  isSlotFull,
  pickFromSentenceBank,
  rotateMostUsedSentences,
  saveToSentenceBank,
} from "@/lib/ai/sentence-bank";
import { POST as rotatePost } from "@/app/api/sentence-bank/rotate/route";

describe("Sentence Bank & 10% Weekly Rotation Engine", () => {
  beforeEach(() => {
    clearMemorySentenceBank();
  });

  it("enforces MAX_SENTENCES_PER_SLOT = 300 and WEEKLY_REPLACE_RATIO = 0.10", () => {
    expect(MAX_SENTENCES_PER_SLOT).toBe(300);
    expect(WEEKLY_REPLACE_RATIO).toBe(0.1);
  });

  it("saves sentences up to 300 per slot and rejects the 301st item", async () => {
    for (let i = 1; i <= 300; i++) {
      const saved = await saveToSentenceBank({
        id: `sent-tech-${i}`,
        english: `We deployed microservice number ${i} to production clusters.`,
        japanese: `私たちはマイクロサービス${i}番を本番クラスタにデプロイしました。`,
        wordCount: 8,
        industry: "tech",
        level: "intermediate",
        mode: "sentence",
      });
      expect(saved).not.toBeNull();
    }

    expect(await getSlotCount("tech", "intermediate", "sentence")).toBe(300);
    expect(await isSlotFull("tech", "intermediate", "sentence")).toBe(true);

    // 301st item should not exceed the 300 cap
    const overflow = await saveToSentenceBank({
      id: "sent-tech-301",
      english: "This 301st sentence should not be added when the slot is full.",
      japanese: "スロット満杯時は301件目を追加しない。",
      wordCount: 12,
      industry: "tech",
      level: "intermediate",
      mode: "sentence",
    });

    expect(overflow).toBeNull();
    expect(await getSlotCount("tech", "intermediate", "sentence")).toBe(300);
  });

  it("picks unseen sentences excluding excludeIds and increments usageCount", async () => {
    await saveToSentenceBank({
      id: "sent-biz-1",
      english: "Our quarterly revenue exceeded market expectations.",
      japanese: "四半期売上は市場予想を上回りました。",
      wordCount: 6,
      industry: "business",
      level: "beginner",
      mode: "sentence",
    });
    await saveToSentenceBank({
      id: "sent-biz-2",
      english: "Let us finalize the budget allocation today.",
      japanese: "本日中に予算配分を確定させましょう。",
      wordCount: 7,
      industry: "business",
      level: "beginner",
      mode: "sentence",
    });

    const picked = await pickFromSentenceBank({
      industry: "business",
      level: "beginner",
      mode: "sentence",
      excludeIds: ["sent-biz-1"],
    });

    expect(picked).not.toBeNull();
    expect(picked?.id).toBe("sent-biz-2");
    expect(picked?.usageCount).toBe(1);
  });

  it("rotates the top 10% (30 of 300) most used sentences, leaving 270 and allowing replenishment", async () => {
    for (let i = 1; i <= 300; i++) {
      await saveToSentenceBank({
        id: `sent-rot-${i}`,
        english: `Automated scaling policy ${i} reduces cloud infrastructure costs.`,
        japanese: `自動スケーリングポリシー${i}はクラウドコストを削減します。`,
        wordCount: 8,
        industry: "tech",
        level: "advanced",
        mode: "sentence",
      });
    }

    // Simulate high usage on items 1..30 (usageCount = 100..71)
    const slotItems = getMemorySlotItems("tech", "advanced", "sentence");
    expect(slotItems.length).toBe(300);

    // Increment usage on the first 30 items via pickFromSentenceBank or direct usage simulation
    for (let i = 1; i <= 30; i++) {
      const excludeOthers = slotItems
        .filter((item) => item.id !== `sent-rot-${i}`)
        .map((item) => item.id);
      // Pick each of the first 30 items twice so they have higher usageCount than the remaining 270 (which have 0)
      await pickFromSentenceBank({
        industry: "tech",
        level: "advanced",
        mode: "sentence",
        excludeIds: excludeOthers,
      });
      await pickFromSentenceBank({
        industry: "tech",
        level: "advanced",
        mode: "sentence",
        excludeIds: excludeOthers,
      });
    }

    const results = await rotateMostUsedSentences({
      industry: "tech",
      level: "advanced",
      mode: "sentence",
    });

    expect(results).toHaveLength(1);
    const slotResult = results[0]!;
    expect(slotResult.beforeCount).toBe(300);
    expect(slotResult.removedCount).toBe(30);
    expect(slotResult.afterCount).toBe(270);

    // Verify all 30 high-usage items (sent-rot-1 .. sent-rot-30) were removed
    for (let i = 1; i <= 30; i++) {
      expect(slotResult.removedIds).toContain(`sent-rot-${i}`);
    }

    expect(await getSlotCount("tech", "advanced", "sentence")).toBe(270);
    expect(await isSlotFull("tech", "advanced", "sentence")).toBe(false);

    // Verify a new sentence can now be saved to replenish the slot
    const replenished = await saveToSentenceBank({
      id: "sent-rot-new-301",
      english: "Freshly generated AI architecture sentence after weekly rotation.",
      japanese: "週次ローテーション後に新しく生成されたAIアーキテクチャの文。",
      wordCount: 8,
      industry: "tech",
      level: "advanced",
      mode: "sentence",
    });
    expect(replenished).not.toBeNull();
    expect(await getSlotCount("tech", "advanced", "sentence")).toBe(271);
  });

  it("exposes POST /api/sentence-bank/rotate endpoint for weekly cron rotation", async () => {
    for (let i = 1; i <= 20; i++) {
      await saveToSentenceBank({
        id: `sent-mkt-${i}`,
        english: `Brand storytelling campaign variant ${i} boosted customer retention.`,
        japanese: `ブランドキャンペーン案${i}は顧客維持率を高めました。`,
        wordCount: 8,
        industry: "marketing",
        level: "intermediate",
        mode: "sentence",
      });
    }

    const req = new NextRequest("http://localhost:3000/api/sentence-bank/rotate", {
      method: "POST",
      body: JSON.stringify({
        industry: "marketing",
        level: "intermediate",
        mode: "sentence",
      }),
    });

    const res = await rotatePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.totalRemoved).toBe(2); // 10% of 20 = 2
    expect(data.slots[0].afterCount).toBe(18);
  });
});

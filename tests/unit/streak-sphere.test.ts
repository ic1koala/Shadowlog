import { describe, it, expect } from "vitest";
import {
  getStreakColor,
  getStreakFormName,
  STREAK_PALETTE,
} from "@/components/features/dashboard/StreakSphereSwarm";

describe("StreakSphereSwarm Logic", () => {
  it("returns pure white for Day 1 or less", () => {
    const col0 = getStreakColor(0);
    expect(col0.hex).toBe("#ffffff");
    expect(col0.r).toBe(1);

    const col1 = getStreakColor(1);
    expect(col1.hex).toBe("#ffffff");
  });

  it("returns deep blue for Day 30 and beyond", () => {
    const col30 = getStreakColor(30);
    expect(col30.hex).toBe("#0047ff");

    const col60 = getStreakColor(60);
    expect(col60.hex).toBe("#0047ff");
  });

  it("smoothly interpolates intermediate days without errors", () => {
    const col6 = getStreakColor(6);
    expect(col6.hex).toBeTruthy();

    const col14 = getStreakColor(14);
    expect(col14.r).toBeGreaterThanOrEqual(0);
    expect(col14.g).toBeGreaterThanOrEqual(0);
    expect(col14.b).toBeGreaterThanOrEqual(0);
  });

  it("correctly identifies evolution forms by streak days and words", () => {
    expect(getStreakFormName(0, 0).label).toBe("休眠の種");
    expect(getStreakFormName(1, 500).label).toBe("純白の萌芽");
    expect(getStreakFormName(6, 3000).label).toBe("黄金橙の胎動");
    expect(getStreakFormName(12, 10000).label).toBe("新緑黄の脈動");
    expect(getStreakFormName(18, 20000).label).toBe("翠緑の覚醒");
    expect(getStreakFormName(24, 45000).label).toBe("天空碧の星雲");
    expect(getStreakFormName(30, 80000).label).toBe("深海瑠璃の完全体");
  });

  it("contains 6 standard palette stops", () => {
    expect(STREAK_PALETTE.length).toBe(6);
    expect(STREAK_PALETTE[0].day).toBe(1);
    expect(STREAK_PALETTE[5].day).toBe(30);
  });
});

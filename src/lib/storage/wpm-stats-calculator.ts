import { PracticeSession } from "@/types";

export interface DailyWpmPoint {
  date: string; // YYYY-MM-DD
  label: string; // M/D (例: "9/27")
  wpm: number; // その日の平均WPM (0なら記録なし)
  sessionCount: number;
}

export interface WpmStatsResult {
  recent3DaysAverageWpm: number; // 直近3日間の平均WPM (整数)
  hasData: boolean;
  ratingLabel: string; // "ゆったり" | "ナチュラル" | "流暢" | "ネイティブ級"
  trendDifference: number | null; // 前期間比 (例: +8 または -3, データ不足ならnull)
  dailyTrend: DailyWpmPoint[]; // 直近7日間の日別推移データ
  totalWpmRecordedSessions: number;
}

/**
 * WPMの数値からスピードの目安レーティングを算出
 */
export function getWpmRating(wpm: number): string {
  if (wpm === 0) return "測定中";
  if (wpm < 100) return "じっくり (〜99 WPM)";
  if (wpm < 130) return "ナチュラル (100〜129 WPM)";
  if (wpm < 160) return "流暢 (130〜159 WPM)";
  return "ネイティブ級 (160+ WPM)";
}

/**
 * 過去セッション履歴から直近3日間の平均WPMと直近7日間の日別推移を算出
 */
export function calculateWpmStats(sessions: PracticeSession[]): WpmStatsResult {
  // WPMが記録されているセッションを抽出
  const validSessions = sessions.filter(
    (s) => typeof s.wpm === "number" && s.wpm > 0
  );

  if (validSessions.length === 0) {
    return {
      recent3DaysAverageWpm: 0,
      hasData: false,
      ratingLabel: "未測定",
      trendDifference: null,
      dailyTrend: generateEmptyDailyTrend(7),
      totalWpmRecordedSessions: 0,
    };
  }

  // 1. 直近7日間の日付キーを生成 (今日から過去7日分)
  const now = new Date();
  const dateKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    dateKeys.push(key);
  }

  // 2. 日付ごとにセッションをグルーピング
  const groupedByDate: Record<string, number[]> = {};
  dateKeys.forEach((k) => {
    groupedByDate[k] = [];
  });

  validSessions.forEach((s) => {
    const sessionDate = s.createdAt ? s.createdAt.slice(0, 10) : "";
    if (sessionDate && groupedByDate[sessionDate]) {
      groupedByDate[sessionDate].push(s.wpm!);
    }
  });

  // 3. 直近7日間の日別推移配列を作成
  const dailyTrend: DailyWpmPoint[] = dateKeys.map((k) => {
    const wpms = groupedByDate[k] || [];
    const avg =
      wpms.length > 0
        ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length)
        : 0;
    const [, month, day] = k.split("-");
    const label = `${parseInt(month, 10)}/${parseInt(day, 10)}`;
    return {
      date: k,
      label,
      wpm: avg,
      sessionCount: wpms.length,
    };
  });

  // 4. 直近3日間の平均WPMを計算 (今日、昨日、一昨日)
  const recent3DateKeys = dateKeys.slice(4); // 直近3日分
  const recent3Wpms: number[] = [];
  recent3DateKeys.forEach((k) => {
    recent3Wpms.push(...(groupedByDate[k] || []));
  });

  let recent3Avg = 0;
  if (recent3Wpms.length > 0) {
    recent3Avg = Math.round(
      recent3Wpms.reduce((a, b) => a + b, 0) / recent3Wpms.length
    );
  } else {
    // 直近3日間に練習がなければ、直近に記録されたセッション最新3件から算出
    const latestSessions = [...validSessions]
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, 3);
    const latestAvg =
      latestSessions.reduce((acc, s) => acc + (s.wpm || 0), 0) /
      latestSessions.length;
    recent3Avg = Math.round(latestAvg);
  }

  // 5. 前期間（4〜6日前）の平均WPMと比較してトレンド差分を計算
  const prev3DateKeys = dateKeys.slice(1, 4); // 4〜6日前
  const prev3Wpms: number[] = [];
  prev3DateKeys.forEach((k) => {
    prev3Wpms.push(...(groupedByDate[k] || []));
  });

  let trendDiff: number | null = null;
  if (prev3Wpms.length > 0 && recent3Avg > 0) {
    const prevAvg = Math.round(
      prev3Wpms.reduce((a, b) => a + b, 0) / prev3Wpms.length
    );
    trendDiff = recent3Avg - prevAvg;
  }

  return {
    recent3DaysAverageWpm: recent3Avg,
    hasData: true,
    ratingLabel: getWpmRating(recent3Avg),
    trendDifference: trendDiff,
    dailyTrend,
    totalWpmRecordedSessions: validSessions.length,
  };
}

function generateEmptyDailyTrend(days: number): DailyWpmPoint[] {
  const now = new Date();
  const list: DailyWpmPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const [, month, day] = key.split("-");
    list.push({
      date: key,
      label: `${parseInt(month, 10)}/${parseInt(day, 10)}`,
      wpm: 0,
      sessionCount: 0,
    });
  }
  return list;
}

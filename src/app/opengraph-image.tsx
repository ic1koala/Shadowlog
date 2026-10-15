import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "【ベータ版無料配信中】発話可視化AIシャドーイング ShadowLog | 11月から正式リリース開始！誰でもお試し頂けます。";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#0B0F19",
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(99, 102, 241, 0.35), transparent 45%), radial-gradient(circle at 88% 82%, rgba(14, 165, 233, 0.3), transparent 45%), radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.8), #0B0F19)",
          padding: "54px 60px",
          fontFamily: "sans-serif",
          color: "#FFFFFF",
        }}
      >
        {/* Top Badges Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            width: "100%",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(99, 102, 241, 0.22)",
              border: "1.5px solid rgba(129, 140, 248, 0.6)",
              borderRadius: "9999px",
              padding: "8px 22px",
              color: "#A5B4FC",
              fontSize: "20px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              letterSpacing: "0.02em",
            }}
          >
            ⚡ ベータ版配信中
          </div>
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              border: "1.5px solid rgba(52, 211, 153, 0.6)",
              borderRadius: "9999px",
              padding: "8px 22px",
              color: "#6EE7B7",
              fontSize: "20px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              letterSpacing: "0.02em",
            }}
          >
            ✨ 誰でもお試し頂けます
          </div>
          <div
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.2)",
              border: "1.5px solid rgba(251, 191, 36, 0.6)",
              borderRadius: "9999px",
              padding: "8px 22px",
              color: "#FDE68A",
              fontSize: "20px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              letterSpacing: "0.02em",
            }}
          >
            🚀 11月から正式リリース開始！
          </div>
        </div>

        {/* Main Hero Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            marginTop: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#818CF8",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              発話可視化 AIシャドーイング
            </span>
          </div>

          <div
            style={{
              fontSize: "56px",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            声に出して身につける、新しい英語習慣。
          </div>

          <div
            style={{
              fontSize: "36px",
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: "#38BDF8",
            }}
          >
            AI音声認識Diff判定で、言えた単語・弱点を即時可視化
          </div>

          <div
            style={{
              fontSize: "22px",
              color: "#CBD5E1",
              marginTop: "6px",
              lineHeight: 1.4,
            }}
          >
            「英語を話す機会がない」「独学だと正しいかわからない」社会人のための習慣化アプリ。
            <br />
            1日3分・登録不要で、ブラウザから今すぐ無料で体験いただけます。
          </div>
        </div>

        {/* Bottom Feature Bar & Brand */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "19px",
                color: "#E2E8F0",
                fontWeight: 600,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                padding: "6px 14px",
                borderRadius: "8px",
              }}
            >
              🎙️ Whisper AI即時採点
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "19px",
                color: "#E2E8F0",
                fontWeight: 600,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                padding: "6px 14px",
                borderRadius: "8px",
              }}
            >
              ⚡ 待ち時間0秒フィードバック
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "19px",
                color: "#E2E8F0",
                fontWeight: 600,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                padding: "6px 14px",
                borderRadius: "8px",
              }}
            >
              📈 発話速度(WPM)＆弱点分析
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                fontSize: "30px",
                fontWeight: 900,
                letterSpacing: "-0.01em",
                color: "#FFFFFF",
              }}
            >
              Shadow<span style={{ color: "#6366F1" }}>Log</span>
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

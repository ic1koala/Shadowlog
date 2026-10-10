import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "【無料30秒】AI英語発話スピード（WPM）＆推定TOEICスコア診断 | ShadowLog";
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
          backgroundColor: "#0F172A",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(59, 130, 246, 0.25), transparent 45%), radial-gradient(circle at 85% 80%, rgba(147, 51, 234, 0.25), transparent 45%)",
          padding: "60px",
          fontFamily: "sans-serif",
          color: "#FFFFFF",
        }}
      >
        {/* Top Header Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              border: "1px solid rgba(96, 165, 250, 0.4)",
              borderRadius: "9999px",
              padding: "8px 20px",
              color: "#60A5FA",
              fontSize: "22px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
            }}
          >
            ⚡ 登録不要・完全無料 (30秒)
          </div>
          <div
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.2)",
              border: "1px solid rgba(251, 191, 36, 0.4)",
              borderRadius: "9999px",
              padding: "8px 20px",
              color: "#FBBF24",
              fontSize: "22px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
            }}
          >
            👑 先着20名 VIPモニター受付中
          </div>
        </div>

        {/* Main Hero Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "58px",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              background: "linear-gradient(to right, #FFFFFF, #93C5FD)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            AI 英語発音スピード (WPM)
          </div>
          <div
            style={{
              fontSize: "58px",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#38BDF8",
            }}
          >
            ＆ 推定TOEICスコア診断
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#94A3B8",
              marginTop: "8px",
            }}
          >
            3問声に出すだけで、あなたの発声WPM・音の連結弱点・推定TOEIC点数をAIが即時解析！
          </div>
        </div>

        {/* Bottom Feature Chips & Brand */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "22px",
                color: "#CBD5E1",
                fontWeight: 600,
              }}
            >
              🎙️ Whisper AI採点
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "22px",
                color: "#CBD5E1",
                fontWeight: 600,
              }}
            >
              📊 リンキング弱点分析
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "22px",
                color: "#CBD5E1",
                fontWeight: 600,
              }}
            >
              ⏱️ 0秒即時判定
            </div>
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ color: "#3B82F6" }}>ShadowLog</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

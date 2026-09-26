import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Lazy initialization helpers
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://placeholder-project.supabase.co";
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";
  return createClient(supabaseUrl, supabaseServiceKey);
}

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "shadowlog.app@gmail.com";
const FROM_EMAIL = "ShadowLog Support <onboarding@resend.dev>";

const CATEGORY_LABELS: Record<string, string> = {
  bug: "🐛 不具合・エラー報告",
  audio_mic: "🎙️ 音声・マイク関連",
  feature_request: "💡 改善要望・アイデア",
  question: "❓ 使い方・質問",
  other: "📝 その他",
};

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const resend = getResendClient();

    const body = await req.json();
    const { category, email, content, screenshotBase64, environmentInfo, userId } = body;

    // Validation
    if (!category || !email || !content) {
      return NextResponse.json(
        { error: "カテゴリ、メールアドレス、内容は必須です。" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください。" },
        { status: 400 }
      );
    }

    const categoryLabel = CATEGORY_LABELS[category] || category;
    let screenshotUrl: string | null = null;
    let screenshotBuffer: Buffer | null = null;

    // 1. Upload screenshot to Supabase Storage if provided
    if (screenshotBase64 && typeof screenshotBase64 === "string") {
      try {
        const matches = screenshotBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          screenshotBuffer = Buffer.from(base64Data, "base64");
          const extension = mimeType.split("/")[1] || "png";
          const fileName = `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from("feedback-attachments")
            .upload(fileName, screenshotBuffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from("feedback-attachments")
              .getPublicUrl(fileName);
            screenshotUrl = publicUrlData.publicUrl;
          } else {
            console.error("Supabase Storage upload error:", uploadError);
          }
        }
      } catch (err) {
        console.error("Screenshot process error:", err);
      }
    }

    // 2. Persist feedback ticket into Supabase DB
    let ticketId: string | null = null;
    try {
      // Validate UUID format for userId, or null
      const isValidUUID =
        userId &&
        typeof userId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      const { data: insertedData, error: dbError } = await supabaseAdmin
        .from("feedback_tickets")
        .insert({
          user_id: isValidUUID ? userId : null,
          user_email: email,
          category,
          content,
          screenshot_url: screenshotUrl,
          environment_info: environmentInfo || {},
          status: "unread",
        })
        .select("id")
        .single();

      if (dbError) {
        console.error("Supabase DB insert error:", dbError);
      } else if (insertedData) {
        ticketId = insertedData.id;
      }
    } catch (err) {
      console.error("Database persistence error:", err);
    }

    // 3. Send email via Resend
    let adminEmailSent = false;
    let userEmailSent = false;

    if (resend) {
      // A. Admin notification email
      try {
        const envDetails = environmentInfo
          ? Object.entries(environmentInfo)
              .map(([key, val]) => `<tr><td style="padding:4px 8px;font-weight:bold;color:#475569;border-bottom:1px solid #e2e8f0;">${key}</td><td style="padding:4px 8px;color:#1e293b;border-bottom:1px solid #e2e8f0;word-break:break-all;">${typeof val === "object" ? JSON.stringify(val) : String(val)}</td></tr>`)
              .join("")
          : "<tr><td colspan='2' style='padding:8px;color:#64748b;'>なし</td></tr>";

        const adminHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 20px; color: white;">
              <h2 style="margin: 0; font-size: 18px; font-weight: bold;">ShadowLog ユーザー報告</h2>
              <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">新しいお問い合わせ・不具合報告が届きました</p>
            </div>
            
            <div style="padding: 24px;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 120px; color: #64748b;">カテゴリ</td>
                  <td style="padding: 8px; font-weight: bold; color: #2563eb;">${categoryLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #64748b;">送信者</td>
                  <td style="padding: 8px;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: underline;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #64748b;">受信日時</td>
                  <td style="padding: 8px;">${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</td>
                </tr>
                ${ticketId ? `<tr><td style="padding: 8px; font-weight: bold; color: #64748b;">チケットID</td><td style="padding: 8px; font-family: monospace; font-size: 12px;">${ticketId}</td></tr>` : ""}
              </table>

              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 14px; font-weight: bold; color: #475569; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">報告・問い合わせ内容</h3>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">${escapeHtml(content)}</div>
              </div>

              ${screenshotUrl ? `
                <div style="margin-bottom: 24px;">
                  <h3 style="font-size: 14px; font-weight: bold; color: #475569; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">添付スクリーンショット</h3>
                  <div style="text-align: center; background: #0f172a; padding: 12px; border-radius: 8px;">
                    <a href="${screenshotUrl}" target="_blank" rel="noopener noreferrer">
                      <img src="${screenshotUrl}" alt="添付画像" style="max-width: 100%; max-height: 350px; border-radius: 4px; object-fit: contain;" />
                    </a>
                  </div>
                  <p style="margin-top: 6px; font-size: 12px; color: #64748b;"><a href="${screenshotUrl}" target="_blank" style="color: #2563eb;">画像を別タブで拡大表示</a></p>
                </div>
              ` : ""}

              <div>
                <h3 style="font-size: 14px; font-weight: bold; color: #475569; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">送信時環境情報 (自動収集)</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #f8fafc; border-radius: 8px; overflow: hidden;">
                  ${envDetails}
                </table>
              </div>
            </div>

            <div style="background: #f1f5f9; padding: 12px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;">
              このメールに直接返信すると、ユーザー（${email}）に返信されます。
            </div>
          </div>
        `;

        const attachments = screenshotBuffer
          ? [
              {
                filename: "screenshot.png",
                content: screenshotBuffer,
              },
            ]
          : undefined;

        await resend.emails.send({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          replyTo: email,
          subject: `【ShadowLog 報告】[${categoryLabel}] ${email} 様より`,
          html: adminHtml,
          attachments,
        });
        adminEmailSent = true;
      } catch (err) {
        console.error("Resend admin email notification error:", err);
      }

      // B. User confirmation auto-reply email (wrapped safely for sandbox limitations)
      try {
        const userHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 20px; color: white;">
              <h2 style="margin: 0; font-size: 18px; font-weight: bold;">ShadowLog サポート</h2>
              <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">お問い合わせ・ご報告を受け付けました</p>
            </div>
            
            <div style="padding: 24px;">
              <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">
                平素よりShadowLogをご利用いただき誠にありがとうございます。<br />
                以下の内容でお問い合わせ・不具合報告を受け付けいたしました。
              </p>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px;">
                <p style="margin: 0 0 8px 0;"><strong>種別:</strong> ${categoryLabel}</p>
                <p style="margin: 0 0 8px 0;"><strong>受付日時:</strong> ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</p>
                ${ticketId ? `<p style="margin: 0 0 8px 0;"><strong>お問い合わせ番号:</strong> ${ticketId.slice(0, 8)}</p>` : ""}
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                  <strong>送信内容:</strong>
                  <div style="margin-top: 6px; white-space: pre-wrap; color: #334155; line-height: 1.5;">${escapeHtml(content)}</div>
                </div>
              </div>

              <p style="font-size: 13px; color: #475569; line-height: 1.6;">
                内容を確認のうえ、担当者より順次確認・対応を進めさせていただきます。<br />
                今しばらくお待ちいただけますようお願い申し上げます。
              </p>
            </div>

            <div style="background: #f1f5f9; padding: 16px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;">
              © ${new Date().getFullYear()} ShadowLog. All rights reserved.
            </div>
          </div>
        `;

        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `【ShadowLog】お問い合わせを受け付けました`,
          html: userHtml,
        });
        userEmailSent = true;
      } catch (err) {
        // In free sandbox Resend environments, emails to unverified recipients may be blocked
        console.warn("User auto-reply email was skipped or blocked by sandbox:", err);
      }
    }

    return NextResponse.json({
      success: true,
      ticketId,
      screenshotUrl,
      adminEmailSent,
      userEmailSent,
      message: "お問い合わせ・ご報告を受け付けました。",
    });
  } catch (error: unknown) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "処理中にエラーが発生しました。時間をおいて再試行してください。" },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

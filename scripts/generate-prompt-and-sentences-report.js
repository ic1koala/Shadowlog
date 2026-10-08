const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

async function main() {
  console.log('--- Step 1: Loading environment & database ---');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'shadowlog.app@gmail.com';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials missing in env');
  }
  if (!resendApiKey) {
    throw new Error('Resend API Key missing in env');
  }

  const sb = createClient(supabaseUrl, supabaseKey);
  const resend = new Resend(resendApiKey);

  console.log('--- Step 2: Fetching practice_sessions from Supabase ---');
  const { data: sessions, error } = await sb
    .from('practice_sessions')
    .select('id, text_en, text_jp, accuracy_score, wpm, created_at, user_id')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch practice_sessions: ' + error.message);
  }

  console.log(`Fetched ${sessions.length} total sessions from database.`);

  // Deduplicate and aggregate
  const sentenceMap = new Map();
  sessions.forEach((s) => {
    const rawEn = (s.text_en || '').trim();
    if (!rawEn) return;
    if (!sentenceMap.has(rawEn)) {
      sentenceMap.set(rawEn, {
        id: s.id,
        english: rawEn,
        japanese: (s.text_jp || '').trim(),
        firstPracticedAt: s.created_at,
        lastPracticedAt: s.created_at,
        practiceCount: 1,
        bestAccuracy: s.accuracy_score || 0,
        bestWpm: s.wpm || 0,
      });
    } else {
      const item = sentenceMap.get(rawEn);
      item.practiceCount += 1;
      item.lastPracticedAt = s.created_at;
      if ((s.accuracy_score || 0) > item.bestAccuracy) {
        item.bestAccuracy = s.accuracy_score;
      }
      if ((s.wpm || 0) > item.bestWpm) {
        item.bestWpm = s.wpm;
      }
    }
  });

  const uniqueSentences = Array.from(sentenceMap.values());
  console.log(`Extracted ${uniqueSentences.length} unique generated sentences.`);

  // Calculate word count
  uniqueSentences.forEach((s) => {
    s.wordCount = s.english.split(/\s+/).filter(Boolean).length;
  });

  console.log('--- Step 3: Generating HTML Document ---');
  const nowJst = new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>ShadowLog 例文生成プロンプト仕様 ＆ 生成文章全件リスト</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 18mm 15mm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
        font-size: 9pt;
        color: #94a3b8;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 10pt;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .cover {
      page-break-after: always;
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 80vh;
    }
    .brand-badge {
      display: inline-block;
      background: #0284c7;
      color: white;
      font-size: 11pt;
      font-weight: bold;
      padding: 6px 16px;
      border-radius: 9999px;
      margin-bottom: 24px;
      letter-spacing: 1px;
    }
    h1.title {
      font-size: 24pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    p.subtitle {
      font-size: 12pt;
      color: #64748b;
      margin: 0 0 40px 0;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      max-width: 520px;
      margin: 0 auto;
      text-align: left;
      font-size: 10pt;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .meta-row:last-child {
      border-bottom: none;
    }
    .meta-label {
      color: #64748b;
      font-weight: 600;
    }
    .meta-val {
      color: #0f172a;
      font-weight: bold;
    }
    
    .section-title {
      font-size: 15pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 6px;
      margin: 28px 0 14px 0;
      page-break-after: avoid;
    }
    .subsection-title {
      font-size: 12pt;
      font-weight: 700;
      color: #0369a1;
      margin: 18px 0 8px 0;
      page-break-after: avoid;
    }
    p, ul {
      margin: 6px 0 10px 0;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 4px;
    }
    .prompt-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 14px;
      margin: 10px 0 16px 0;
      page-break-inside: avoid;
    }
    .prompt-header {
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0284c7;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    pre.code-block {
      background: #0f172a;
      color: #e2e8f0;
      padding: 10px 12px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 8.5pt;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }
    .highlight-badge {
      display: inline-block;
      font-size: 8pt;
      padding: 2px 8px;
      border-radius: 4px;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: bold;
      margin-right: 4px;
    }
    .sentence-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 12px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .sentence-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .sentence-num {
      font-weight: 800;
      color: #0284c7;
      font-size: 11pt;
    }
    .sentence-meta {
      font-size: 8pt;
      color: #64748b;
    }
    .sentence-en {
      font-size: 10.5pt;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.45;
      margin-bottom: 6px;
    }
    .sentence-jp {
      font-size: 9.5pt;
      color: #475569;
      line-height: 1.4;
    }
    .stat-pill {
      display: inline-block;
      background: #f1f5f9;
      color: #334155;
      font-size: 7.5pt;
      padding: 1px 6px;
      border-radius: 4px;
      margin-left: 4px;
      font-weight: 600;
    }
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover">
    <div>
      <span class="brand-badge">SHADOWLOG SYSTEM REPORT</span>
      <h1 class="title">例文生成プロンプト仕様<br>＆ 生成文章全件リスト</h1>
      <p class="subtitle">AIシャドーイング習慣化SaaS「ShadowLog」公式仕様・出題記録ドキュメント</p>
    </div>

    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">ドキュメント作成日</span>
        <span class="meta-val">${nowJst} (JST)</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">送付先（オーナー）</span>
        <span class="meta-val">${adminEmail}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">AI生成エンジン</span>
        <span class="meta-val">OpenAI GPT-4o-mini + TTS-1</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">現行プロンプト体系</span>
        <span class="meta-val">通常短文 / 3単語マイ単語 (FB-035) / 長文スピーチ</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">累計練習セッション数</span>
        <span class="meta-val">${sessions.length} 件</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">登録ユニーク生成文章数</span>
        <span class="meta-val">${uniqueSentences.length} 文</span>
      </div>
    </div>
  </div>

  <!-- Section 1: Prompt Specification -->
  <div>
    <h2 class="section-title">第1章: 例文生成プロンプト体系 ＆ パラメータ仕様</h2>
    <p>
      ShadowLogでは、ユーザーの難易度（初級・中級・上級）、選択ジャンル（Tech・Business・Marketing・Daily）、四半期/季節感、最新業界トレンド、および苦手単語やマイ指定単語に基づき、<strong>GPT-4o-mini</strong> に最適化されたプロンプトを動的に構築・送信しています。
    </p>

    <div class="subsection-title">1. OpenAI API 共通リクエスト仕様</div>
    <ul>
      <li><strong>モデル</strong>: <code>gpt-4o-mini</code>（高速・低遅延・安定レスポンス）</li>
      <li><strong>レスポンス形式</strong>: <code>response_format: { type: "json_object" }</code> による厳格なJSON出力強制</li>
      <li><strong>音声合成モデル</strong>: <code>tts-1</code>（ボイス: <code>alloy</code>, 出力: mp3 base64）</li>
      <li><strong>生成先読み（Prefetch）</strong>: 1問目練習中に次問を完全バックグラウンドで先読み（待ち時間 <code>0.0秒</code> 遷移）</li>
    </ul>

    <div class="subsection-title">2. パターンA: 通常短文シャドーイング生成（6〜30語）</div>
    <p>毎日の反復練習で無理なく流暢性を養う、1文構成のスタンダード出題プロンプトです。</p>

    <div class="prompt-card">
      <div class="prompt-header">
        <span>System Prompt（システム指示原文）</span>
        <span class="highlight-badge">通常短文モード</span>
      </div>
      <pre class="code-block">You are an expert English language coach specializing in shadowing practice.
Your task is to generate ONE fresh, authentic, contextually rich English sentence along with its natural Japanese translation.
IMPORTANT LEGAL & ORIGINALITY REQUIREMENT: Do NOT quote, reproduce, or copy sentences directly from existing commercial English textbooks, official test sets (e.g., TOEIC, TOEFL), or copyrighted materials. All generated content must be 100% original and dynamically created.
NEVER generate generic, repetitive, or cliché template sentences.

Season & Trend Awareness:
Subtly weave in realistic seasonal timing cues (such as current quarter or annual business cycle themes) and contemporary industry trends (such as modern tech tools, agile business, or digital workflows). The sentence must feel fresh, timely, and relevant to modern professionals, rather than generic textbook English.

Personalization (苦手単語がある場合のみ注入):
The learner struggles with these words: [単語1, 単語2...]. Naturally incorporate 1 to 2 of these words into the sentence without forcing them awkwardly.

Strict Output Format:
Return ONLY a valid JSON object with the following schema:
{
  "english": "The exact English sentence to practice.",
  "japanese": "自然な日本語訳。"
}
Do NOT include markdown fences, extra commentary, or additional fields.</pre>
    </div>

    <div class="prompt-card">
      <div class="prompt-header">
        <span>User Prompt テンプレート ＆ 難易度別語数指定</span>
        <span class="highlight-badge">動的パラメータ注入</span>
      </div>
      <pre class="code-block">Generate a unique shadowing practice sentence with the following specifications:
- Industry/Domain: {tech | business | marketing | daily}
- Context/Situation: {実務シチュエーション}
- Seasonal Timing & Cycle: {季節名} ({四半期Q1〜Q4}) - {季節テーマ}
- Modern Trend Angle: {最新業界トレンド}
- Difficulty Level: {level}
  * 初級 (beginner): Target length: 6 to 10 words. Clear basic vocabulary (A1-A2).
  * 中級 (intermediate): Target length: 12 to 18 words. Business idioms & natural phrasing (B1-B2).
  * 上級 (advanced): Target length: 20 to 30 words. Complex sentence structures & executive rhythm (C1).
- Variation Seed: {ランダムシード}

Requirements:
- Make the vocabulary, syntax, and sentence structure novel and distinct from typical textbook examples.
- Naturally harmonize the context with current seasonal business cycles and modern trends.
- Ensure natural conversational or business cadence and rhythm suitable for oral shadowing practice.</pre>
    </div>

    <div class="subsection-title">3. パターンB: 3単語マイ単語カスタム生成（FB-035 最新仕様）</div>
    <p>
      設定画面でユーザーが登録した3単語（日本語入力・英語入力両対応）をもとにオリジナル英文を作成する独自機能プロンプトです。1文に無理に詰め込まず、選択難易度の語数に合わせた<strong>自然な1〜2文構成</strong>で生成します。
    </p>

    <div class="prompt-card">
      <div class="prompt-header">
        <span>System Prompt（マイ単語指定時の追加注入指示）</span>
        <span class="highlight-badge">FB-035 実装</span>
      </div>
      <pre class="code-block">Custom Topic Words Requirement (CRITICAL):
- The user wants to practice these specific words/keywords: [ユーザー登録3単語].
- If any of the user's words are written in Japanese, translate them into the most natural, idiomatic English words or phrases for this context.
- You MUST naturally incorporate all of these user-specified words into the English text.
- Do NOT awkwardly cram them into a single unnatural clause. Instead, compose 1 to 2 naturally connected sentences matching the target word count for the selected difficulty:
  * 初級 (beginner): Target length: 10 to 14 words across 1 to 2 simple, connected sentences.
  * 中級 (intermediate): Target length: 15 to 20 words across 1 to 2 natural, connected sentences.
  * 上級 (advanced): Target length: 21 to 28 words across 1 to 2 sophisticated, connected sentences.
so the topic flows smoothly and authentically.</pre>
    </div>

    <div class="subsection-title">4. パターンC: 長文スピーチ・プレゼンモード（60〜90語）</div>
    <p>カンファレンス発表やエグゼクティブ向けプレゼンテーションを想定した長文スピーチ出題用プロンプトです。</p>

    <div class="prompt-card">
      <div class="prompt-header">
        <span>System & User Prompt 原文概要</span>
        <span class="highlight-badge">長文モード</span>
      </div>
      <pre class="code-block">System Prompt:
You are an elite executive speechwriter and English speaking coach.
Your task is to generate ONE coherent, inspiring, and natural presentation/speech passage (paragraph of 3 to 5 sentences, 60 to 90 words total) along with its natural Japanese translation.
Avoid formulaic openings like "Good morning everyone". Dive right into substantive, engaging speech content.

User Prompt:
Generate an engaging business presentation or conference speech passage with the following specifications:
- Industry/Domain: {tech | business | marketing | daily}
- Target Word Count: 60 to 90 words (3 to 5 clear, rhythmic sentences)
- Style: Keynote speech, town hall, or executive briefing with natural rhythmic pauses.</pre>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- Section 2: Generated Sentences List -->
  <div>
    <h2 class="section-title">第2章: すでに生成された文章全件リスト（頭に番号付・全${uniqueSentences.length}文）</h2>
    <p>
      データベース（<code>practice_sessions</code>）に記録されている、実際にAIによって動的生成され受講者の練習に供された文章の全件リストです。
      各文章には通し番号（#1 〜 #${uniqueSentences.length}）、語数（Word Count）、初出日時、および日本語訳を掲載しています。
    </p>

    ${uniqueSentences
      .map(
        (s, idx) => `
    <div class="sentence-item">
      <div class="sentence-header">
        <span class="sentence-num">#${idx + 1}</span>
        <div class="sentence-meta">
          <span class="highlight-badge">${s.wordCount} words</span>
          <span class="stat-pill">練習回数: ${s.practiceCount}回</span>
          <span class="stat-pill">初回出題: ${new Date(s.firstPracticedAt).toLocaleDateString('ja-JP')}</span>
        </div>
      </div>
      <div class="sentence-en">${escapeHtml(s.english)}</div>
      <div class="sentence-jp">${escapeHtml(s.japanese)}</div>
    </div>`
      )
      .join('\n')}
  </div>

</body>
</html>`;

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const htmlPath = path.join('/tmp', 'shadowlog_prompt_and_sentences.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`Saved HTML report to ${htmlPath}`);

  console.log('--- Step 4: Compiling PDF via Headless Chrome ---');
  const pdfPath = path.join('/tmp', 'ShadowLog_Prompt_and_Sentence_List.pdf');
  const chromeBin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  
  const cmd = `"${chromeBin}" --headless --disable-gpu --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  execSync(cmd, { stdio: 'pipe' });

  const pdfStats = fs.statSync(pdfPath);
  console.log(`Generated PDF at ${pdfPath} (Size: ${(pdfStats.size / 1024).toFixed(1)} KB)`);

  // Copy to management and brain artifacts
  const managementPdfPath = path.join(process.cwd(), 'management', 'ShadowLog_Prompt_and_Sentence_List.pdf');
  fs.copyFileSync(pdfPath, managementPdfPath);
  console.log(`Copied PDF to ${managementPdfPath}`);

  const brainArtifactPath = '/Users/suzukihideaki/.gemini/antigravity/brain/e4ece4cd-0a8e-4b24-8777-a23d9c79dcfc/ShadowLog_Prompt_and_Sentence_List.pdf';
  try {
    fs.copyFileSync(pdfPath, brainArtifactPath);
    console.log(`Copied PDF to artifact dir: ${brainArtifactPath}`);
  } catch (err) {
    console.warn('Could not copy to artifact dir:', err.message);
  }

  console.log('--- Step 5: Sending Email with PDF via Resend ---');
  const pdfBuffer = fs.readFileSync(pdfPath);

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #0284c7, #4f46e5); padding: 24px; color: white;">
        <span style="background: rgba(255,255,255,0.2); font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: bold; letter-spacing: 0.5px;">SHADOWLOG OFFICIAL REPORT</span>
        <h2 style="margin: 8px 0 0 0; font-size: 20px; font-weight: bold;">例文生成プロンプト仕様 ＆ 生成文章全件リスト</h2>
        <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">現在ShadowLogで送信されている全プロンプトと実稼働文章一覧</p>
      </div>
      
      <div style="padding: 24px; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">
          オーナー様よりご依頼いただいた<strong>「現在例文生成する際に送信されているプロンプト」</strong>および<strong>「すでに生成された文章の全件リスト（頭に番号振付 / 全${uniqueSentences.length}文）」</strong>をまとめたPDF資料を作成し、本メールに添付いたしました。
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 18px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #0284c7;">📊 レポート概要</h3>
          <ul style="margin: 0; padding-left: 20px; color: #334155;">
            <li><strong>AIモデル構成</strong>: OpenAI <code>gpt-4o-mini</code> (JSON Mode) + <code>tts-1</code> (alloy)</li>
            <li><strong>プロンプト体系</strong>: 通常短文（初級/中級/上級）+ 3単語マイ単語カスタム（FB-035）+ 長文スピーチ</li>
            <li><strong>登録ユニーク文章数</strong>: <strong>${uniqueSentences.length} 文</strong>（頭に通し番号 #1 〜 #${uniqueSentences.length} 記載）</li>
            <li><strong>総練習セッション数</strong>: <strong>${sessions.length} 件</strong>（2026/09/25 〜 2026/10/05）</li>
            <li><strong>添付PDFファイル名</strong>: <code>ShadowLog_Prompt_and_Sentence_List.pdf</code> (${(pdfStats.size / 1024).toFixed(1)} KB)</li>
          </ul>
        </div>

        <h3 style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
          📝 出題文章サンプル（抜粋 3選）
        </h3>
        ${uniqueSentences.slice(0, 3).map((s, idx) => `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-top: 10px;">
            <div style="font-weight: bold; color: #0284c7; font-size: 13px;">#${idx + 1} (${s.wordCount} words)</div>
            <div style="font-weight: 600; color: #0f172a; margin: 4px 0;">${escapeHtml(s.english)}</div>
            <div style="color: #64748b; font-size: 13px;">${escapeHtml(s.japanese)}</div>
          </div>
        `).join('')}

        <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
          ※ 全${uniqueSentences.length}文の英文・和訳・語数・練習日時の完全リストは添付のPDFファイルにてご覧いただけます。
        </p>
      </div>

      <div style="background: #f1f5f9; padding: 14px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;">
        ShadowLog System Administrator &copy; 2026
      </div>
    </div>
  `;

  const { data: resendData, error: resendError } = await resend.emails.send({
    from: 'ShadowLog Support <onboarding@resend.dev>',
    to: adminEmail,
    subject: `【ShadowLog】例文生成プロンプト仕様 ＆ 生成文章全件リスト（全${uniqueSentences.length}文・PDF添付）`,
    html: emailHtml,
    attachments: [
      {
        filename: 'ShadowLog_Prompt_and_Sentence_List.pdf',
        content: pdfBuffer,
      },
    ],
  });

  if (resendError) {
    console.error('Resend email error:', resendError);
    throw new Error('Resend email failed: ' + JSON.stringify(resendError));
  }

  console.log('Successfully sent email via Resend! ID:', resendData?.id);
  console.log('--- ALL TASKS COMPLETED SUCCESSFULLY ---');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

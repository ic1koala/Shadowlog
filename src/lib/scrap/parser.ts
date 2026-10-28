/**
 * Scrap & Text Parsing Utility Helpers
 */

/**
 * Extracts YouTube Video ID from various URL formats
 * (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ, https://youtu.be/dQw4w9WgXcQ, etc.)
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split(/[?#]/)[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      // Handle /embed/ID or /v/ID or /shorts/ID
      const parts = parsed.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => ["embed", "v", "shorts"].includes(p));
      if (idx !== -1 && parts[idx + 1]) {
        return parts[idx + 1].split(/[?#]/)[0];
      }
    }
  } catch {
    // Regex fallback
    const match = trimmed.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (match && match[1]) return match[1];
  }
  return null;
}

/**
 * Fetches video metadata via official YouTube oEmbed API (safe, never blocked)
 */
export async function fetchYouTubeOEmbed(videoId: string): Promise<{ title?: string; author?: string }> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return {};
    const data = await res.json();
    return {
      title: typeof data.title === "string" ? data.title : undefined,
      author: typeof data.author_name === "string" ? data.author_name : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Strips HTML tags and excessive whitespace from plain HTML
 */
export function cleanHtmlText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Validates that a URL is a public HTTP/HTTPS target and blocks SSRF (private/loopback/metadata IPs).
 */
export function isSafeExternalUrl(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return false;
  }
  // Disallow private IPv4 ranges (10.x, 192.168.x, 172.16-31.x, 169.254.x [cloud metadata])
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 192 && b === 168) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 0) return false;
  }
  return true;
}

/**
 * Decodes PDF string escape sequences such as \n, \r, \(, \), and octal codes \ddd.
 */
function decodePdfString(str: string): string {
  return str
    .replace(/\\([nrtbf()\\])/g, (_, ch) => {
      if (ch === "n") return "\n";
      if (ch === "r") return "\r";
      if (ch === "t") return " ";
      if (ch === "(") return "(";
      if (ch === ")") return ")";
      if (ch === "\\") return "\\";
      return " ";
    })
    .replace(/\\([0-7]{1,3})/g, (_, oct) => {
      const code = parseInt(oct, 8);
      return code >= 32 && code <= 126 ? String.fromCharCode(code) : " ";
    });
}

/**
 * Extracts readable English/ASCII text from a PDF buffer (supports FlateDecode compressed streams and raw text operators).
 */
export function extractTextFromPdfBuffer(buffer: Buffer): string {
  // Lazy require zlib so parser.ts remains safe when imported in client unit tests if not called
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const zlib = require("zlib") as typeof import("zlib");

  const rawBinary = buffer.toString("latin1");
  const decodedStreams: string[] = [];

  // 1. Decompress FlateDecode streams if present
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(rawBinary)) !== null) {
    const streamData = Buffer.from(match[1], "latin1");
    try {
      const inflated = zlib.inflateSync(streamData);
      decodedStreams.push(inflated.toString("latin1"));
    } catch {
      try {
        const inflatedRaw = zlib.inflateRawSync(streamData);
        decodedStreams.push(inflatedRaw.toString("latin1"));
      } catch {
        // Not a zlib stream or encrypted; keep raw stream segment if it contains text operators
        decodedStreams.push(match[1]);
      }
    }
  }

  const contentPool = decodedStreams.length > 0 ? decodedStreams.join("\n") : rawBinary;
  const extractedFragments: string[] = [];

  // 2. Extract text from TJ arrays: [(Hello) -20 (world)] TJ
  const tjArrayRegex = /\[((?:[^[\]]|\([^()]*\))*)\]\s*TJ/g;
  let tjMatch: RegExpExecArray | null;
  while ((tjMatch = tjArrayRegex.exec(contentPool)) !== null) {
    const inner = tjMatch[1];
    const strParts: string[] = [];
    const literalRegex = /\(((?:\\.|[^\\()])*)\)/g;
    let lit: RegExpExecArray | null;
    while ((lit = literalRegex.exec(inner)) !== null) {
      strParts.push(decodePdfString(lit[1]));
    }
    if (strParts.length > 0) {
      extractedFragments.push(strParts.join(""));
    }
  }

  // 3. Extract text from single literal Tj / ' / " operators: (Hello world) Tj
  const singleTjRegex = /\(((?:\\.|[^\\()])+)\)\s*(?:Tj|'|")/g;
  let sMatch: RegExpExecArray | null;
  while ((sMatch = singleTjRegex.exec(contentPool)) !== null) {
    extractedFragments.push(decodePdfString(sMatch[1]));
  }

  let combined = extractedFragments
    .join(" ")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 4. Fallback: if PDF uses non-standard operators, extract readable English sentences/phrases (>= 4 words)
  if (combined.length < 40) {
    const asciiMatches = contentPool.match(/[A-Za-z][A-Za-z0-9,.'"-]+(?:\s+[A-Za-z][A-Za-z0-9,.'"-]+){3,}/g);
    if (asciiMatches) {
      const filtered = asciiMatches.filter(
        (line) =>
          !/obj|endobj|stream|endstream|Filter|FlateDecode|Type|Font|Page|Parent|Resources|MediaBox/i.test(
            line
          )
      );
      combined = filtered.join(" ").replace(/\s+/g, " ").trim();
    }
  }

  return combined.slice(0, 12000);
}

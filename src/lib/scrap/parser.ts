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
    const [_, a, b] = ipv4Match.map(Number);
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 192 && b === 168) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 0) return false;
  }
  return true;
}

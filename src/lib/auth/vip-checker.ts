/**
 * VIP / Tester Whitelist & Invite Eligibility Checker
 * Handles permanent whitelist testers, invitation URL holders, and Free Member Beta Testing.
 */

// Campaign Dates (JST)
// Registration Cutoff: 2026-10-20 23:59:59 JST
export const CAMPAIGN_REGISTRATION_DEADLINE = "2026-10-20T23:59:59+09:00";
// Campaign VIP Expiration: 2026-10-30 23:59:59 JST
export const CAMPAIGN_EXPIRATION_DATE = "2026-10-30T23:59:59+09:00";

export const KEY_INVITED_VIP = "shadowlog_invited_vip";

export function getVipTesterEmails(): string[] {
  const envEmails = process.env.NEXT_PUBLIC_VIP_TESTER_EMAILS || process.env.VIP_TESTER_EMAILS || "";
  const baseList = envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Default fallback VIP emails
  if (!baseList.includes("shadowlog.app@gmail.com")) {
    baseList.push("shadowlog.app@gmail.com");
  }

  return baseList;
}

/**
 * Checks whether an email is in the permanent VIP tester whitelist.
 */
export function isVipEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const vipList = getVipTesterEmails();
  return vipList.includes(normalized);
}

/**
 * Checks whether the current client device has an active VIP invitation flag.
 */
export function isInvitedVip(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY_INVITED_VIP) === "true";
  } catch {
    return false;
  }
}

/**
 * Persists or clears the VIP invitation flag in localStorage.
 */
export function setInvitedVip(enabled: boolean = true): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      localStorage.setItem(KEY_INVITED_VIP, "true");
    } else {
      localStorage.removeItem(KEY_INVITED_VIP);
    }
  } catch {
    // ignore
  }
}

/**
 * Inspects URL search parameters for VIP tester invitation tokens.
 * Supported query formats:
 * - ?vip=true or ?vip=1
 * - ?tester=vip
 * - ?invite=vip
 * - ?mode=vip
 *
 * Automatically records the invitation into localStorage if detected.
 */
export function checkAndApplyVipInviteFromUrl(searchString?: string): boolean {
  if (typeof window === "undefined" && !searchString) return false;
  try {
    const rawSearch =
      searchString !== undefined
        ? searchString
        : typeof window !== "undefined"
        ? window.location.search
        : "";

    if (!rawSearch) return isInvitedVip();

    const searchParams = new URLSearchParams(rawSearch);
    const vipParam = searchParams.get("vip")?.toLowerCase();
    const testerParam = searchParams.get("tester")?.toLowerCase();
    const inviteParam = searchParams.get("invite")?.toLowerCase();
    const modeParam = searchParams.get("mode")?.toLowerCase();

    const isMatch =
      vipParam === "true" ||
      vipParam === "1" ||
      testerParam === "vip" ||
      inviteParam === "vip" ||
      modeParam === "vip";

    if (isMatch) {
      setInvitedVip(true);
      return true;
    }
  } catch {
    // ignore
  }

  return isInvitedVip();
}

/**
 * Backwards compatibility helper for previous campaign VIP.
 * Under current Beta testing specifications, normal registrations are assigned
 * to Free Member Beta Testing (20 tickets) rather than automatic VIP.
 */
export function isCampaignVip(
  _registeredAt?: string | Date | null,
  _now: Date = new Date()
): boolean {
  return false;
}

export type VipType = "whitelist" | "invite" | "campaign" | null;

/**
 * Determines VIP type:
 * - "whitelist": Permanent tester (from email whitelist or quick login)
 * - "invite": Invited via URL parameter (?vip=true etc.)
 * - null: Regular user / Free Beta tester
 */
export function getVipType({
  email,
  registeredAt,
  isInvited,
  now = new Date(),
}: {
  email?: string | null;
  registeredAt?: string | Date | null;
  isInvited?: boolean;
  now?: Date;
} = {}): VipType {
  if (isVipEmail(email)) return "whitelist";
  if (isInvited ?? isInvitedVip()) return "invite";
  return null;
}

/**
 * Convenience helper returning whether user is currently any form of VIP.
 */
export function isVipUser(params: {
  email?: string | null;
  registeredAt?: string | Date | null;
  isInvited?: boolean;
  now?: Date;
} = {}): boolean {
  return getVipType(params) !== null;
}


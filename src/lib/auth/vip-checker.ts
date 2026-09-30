/**
 * VIP / Tester Whitelist & Campaign Eligibility Checker
 * Handles both permanent whitelist testers and the limited-time Beta campaign.
 */

// Campaign Dates (JST)
// Registration Cutoff: 2026-10-20 23:59:59 JST
export const CAMPAIGN_REGISTRATION_DEADLINE = "2026-10-20T23:59:59+09:00";
// Campaign VIP Expiration: 2026-10-30 23:59:59 JST
export const CAMPAIGN_EXPIRATION_DATE = "2026-10-30T23:59:59+09:00";

export function getVipTesterEmails(): string[] {
  const envEmails = process.env.NEXT_PUBLIC_VIP_TESTER_EMAILS || process.env.VIP_TESTER_EMAILS || "";
  const baseList = envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Default fallback VIP emails
  const defaultVips = [
    "shadowlog.app@gmail.com",
    "jabonbolivar@gmail.com",
    "koala.hs@gmail.com",
  ];
  for (const v of defaultVips) {
    if (!baseList.includes(v)) {
      baseList.push(v);
    }
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
 * Checks whether user qualifies for the October Beta Campaign VIP.
 * Conditions:
 * 1. User registered on or before 2026-10-20 23:59:59 JST
 * 2. Current time is on or before 2026-10-30 23:59:59 JST
 */
export function isCampaignVip(
  registeredAt?: string | Date | null,
  now: Date = new Date()
): boolean {
  if (!registeredAt) return false;
  const regDate = new Date(registeredAt);
  if (isNaN(regDate.getTime())) return false;

  const deadline = new Date(CAMPAIGN_REGISTRATION_DEADLINE);
  const expiration = new Date(CAMPAIGN_EXPIRATION_DATE);

  return regDate <= deadline && now <= expiration;
}

export type VipType = "whitelist" | "campaign" | null;

/**
 * Determines VIP type:
 * - "whitelist": Permanent tester (from email whitelist)
 * - "campaign": Campaign VIP (registered <= 10/20, active <= 10/30)
 * - null: Regular user
 */
export function getVipType({
  email,
  registeredAt,
  now = new Date(),
}: {
  email?: string | null;
  registeredAt?: string | Date | null;
  now?: Date;
}): VipType {
  if (isVipEmail(email)) return "whitelist";
  if (isCampaignVip(registeredAt, now)) return "campaign";
  return null;
}

/**
 * Convenience helper returning whether user is currently any form of VIP.
 */
export function isVipUser(params: {
  email?: string | null;
  registeredAt?: string | Date | null;
  now?: Date;
}): boolean {
  return getVipType(params) !== null;
}

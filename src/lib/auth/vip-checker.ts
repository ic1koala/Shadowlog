/**
 * VIP / Tester Whitelist Checker
 * Checks whether a given user email is eligible for unlimited VIP access.
 */

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

export function isVipEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const vipList = getVipTesterEmails();
  return vipList.includes(normalized);
}

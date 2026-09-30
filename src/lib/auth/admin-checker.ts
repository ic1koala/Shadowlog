/**
 * Admin Access Checker
 * Validates whether a user email has administrative access to ShadowLog.
 */

export const DEFAULT_ADMIN_EMAIL = "shadowlog.app@gmail.com";

export function getAdminEmails(): string[] {
  const envAdmin =
    process.env.ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    "";

  const customList = envAdmin
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const baseList = [DEFAULT_ADMIN_EMAIL.toLowerCase()];

  for (const email of customList) {
    if (!baseList.includes(email)) {
      baseList.push(email);
    }
  }

  return baseList;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const adminList = getAdminEmails();
  return adminList.includes(normalized);
}

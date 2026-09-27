import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isAdminEmail, getAdminEmails, DEFAULT_ADMIN_EMAIL } from "@/lib/auth/admin-checker";

describe("Admin Access Checker", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("recognizes default admin email", () => {
    expect(isAdminEmail("shadowlog.app@gmail.com")).toBe(true);
    expect(isAdminEmail("SHADOWLOG.APP@GMAIL.COM")).toBe(true);
    expect(isAdminEmail("  shadowlog.app@gmail.com  ")).toBe(true);
  });

  it("rejects non-admin emails", () => {
    expect(isAdminEmail("user@example.com")).toBe(false);
    expect(isAdminEmail("admin@gmail.com")).toBe(false);
    expect(isAdminEmail("")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("supports additional admin emails via environment variables", () => {
    process.env.ADMIN_EMAIL = "superadmin@shadowlog.com, coadmin@shadowlog.com";
    expect(isAdminEmail("superadmin@shadowlog.com")).toBe(true);
    expect(isAdminEmail("coadmin@shadowlog.com")).toBe(true);
    // Still includes default admin email
    expect(isAdminEmail(DEFAULT_ADMIN_EMAIL)).toBe(true);
  });
});

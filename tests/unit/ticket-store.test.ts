import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getTicketStatus,
  consumeTicket,
  upgradeGuestToRegisteredUser,
  setCurrentUserEmail,
  setCurrentUserCreatedAt,
  GUEST_MAX_TICKETS,
  REGISTERED_TOTAL_TICKETS,
  PRO_TRIAL_MAX_TICKETS,
  isInvitedVip,
  setInvitedVip,
  checkAndApplyVipInviteFromUrl,
} from "@/lib/storage/ticket-store";
import {
  isVipEmail,
  getVipType,
} from "@/lib/auth/vip-checker";
import { setPlanType } from "@/lib/storage/user-learning-store";

describe("Ticket Store & VIP Whitelist & Beta Specs", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("initializes as guest with 5 free tickets and 0 pro trials", () => {
    const status = getTicketStatus();
    expect(status.isRegistered).toBe(false);
    expect(status.isVip).toBe(false);
    expect(status.plan).toBe("guest");
    expect(status.totalTickets).toBe(GUEST_MAX_TICKETS);
    expect(status.availableTickets).toBe(5);
    expect(status.canPracticeShort).toBe(true);
    expect(status.canPracticePro).toBe(false);
  });

  it("consumes guest tickets until 0 and then rejects", () => {
    for (let i = 0; i < GUEST_MAX_TICKETS; i++) {
      expect(consumeTicket("short")).toBe(true);
    }

    const exhaustedStatus = getTicketStatus();
    expect(exhaustedStatus.availableTickets).toBe(0);
    expect(exhaustedStatus.canPracticeShort).toBe(false);

    // 6th attempt should fail
    expect(consumeTicket("short")).toBe(false);
  });

  it("upgrades guest to registered user as free member, granting 20 total tickets and 2 Pro trials", () => {
    // Guest uses 2 tickets first
    consumeTicket("short");
    consumeTicket("short");
    expect(getTicketStatus().availableTickets).toBe(3);

    // Normal registration during beta testing
    upgradeGuestToRegisteredUser("regular_user@example.com", "2026-10-15T12:00:00+09:00");

    const status = getTicketStatus(undefined, "2026-10-15T12:00:00+09:00");
    expect(status.isRegistered).toBe(true);
    expect(status.plan).toBe("free");
    expect(status.isVip).toBe(false);
    expect(status.vipType).toBeNull();
    expect(status.totalTickets).toBe(REGISTERED_TOTAL_TICKETS); // 20
    expect(status.usedTickets).toBe(2);
    expect(status.availableTickets).toBe(18);
    expect(status.canPracticeShort).toBe(true);

    // Pro trials granted
    expect(status.totalProTrials).toBe(PRO_TRIAL_MAX_TICKETS); // 2
    expect(status.availableProTrials).toBe(2);
    expect(status.canPracticePro).toBe(true);
  });

  it("consumes Pro trials for registered non-VIP users up to 2 times", () => {
    upgradeGuestToRegisteredUser("user@example.com", "2026-10-15T12:00:00+09:00");

    // 1st Pro trial
    expect(consumeTicket("long")).toBe(true);
    expect(getTicketStatus().availableProTrials).toBe(1);

    // 2nd Pro trial
    expect(consumeTicket("long")).toBe(true);
    expect(getTicketStatus().availableProTrials).toBe(0);
    expect(getTicketStatus().canPracticePro).toBe(false);

    // 3rd Pro attempt should fail
    expect(consumeTicket("long")).toBe(false);
  });

  it("detects VIP invitation URL (?vip=true etc.) and grants unlimited Pro access", () => {
    expect(isInvitedVip()).toBe(false);

    // Detect from URL query
    const applied = checkAndApplyVipInviteFromUrl("?vip=true");
    expect(applied).toBe(true);
    expect(isInvitedVip()).toBe(true);

    // Even without address registered yet, user has VIP conditions (unlimited Pro)
    const guestVipStatus = getTicketStatus();
    expect(guestVipStatus.isVip).toBe(true);
    expect(guestVipStatus.vipType).toBe("invite");
    expect(guestVipStatus.plan).toBe("pro");
    expect(guestVipStatus.availableTickets).toBe(Infinity);
    expect(guestVipStatus.availableProTrials).toBe(Infinity);
    expect(guestVipStatus.canPracticeShort).toBe(true);
    expect(guestVipStatus.canPracticePro).toBe(true);

    // After registering email, user retains Pro VIP
    upgradeGuestToRegisteredUser("tester_with_url@example.com");
    const regStatus = getTicketStatus();
    expect(regStatus.isVip).toBe(true);
    expect(regStatus.plan).toBe("pro");

    // VIP should never consume tickets
    expect(consumeTicket("short")).toBe(true);
    expect(consumeTicket("long")).toBe(true);
    expect(getTicketStatus().availableTickets).toBe(Infinity);
  });

  it("detects alternate VIP invitation URL parameters (tester=vip, invite=vip, mode=vip)", () => {
    setInvitedVip(false);
    expect(checkAndApplyVipInviteFromUrl("?tester=vip")).toBe(true);
    expect(isInvitedVip()).toBe(true);

    setInvitedVip(false);
    expect(checkAndApplyVipInviteFromUrl("?invite=vip")).toBe(true);
    expect(isInvitedVip()).toBe(true);

    setInvitedVip(false);
    expect(checkAndApplyVipInviteFromUrl("?mode=vip")).toBe(true);
    expect(isInvitedVip()).toBe(true);
  });

  it("identifies VIP tester email (shadowlog.app@gmail.com) and grants permanent unlimited access", () => {
    expect(isVipEmail("shadowlog.app@gmail.com")).toBe(true);
    expect(isVipEmail("SHADOWLOG.APP@GMAIL.COM ")).toBe(true); // Case and whitespace insensitive
    expect(isVipEmail("other@example.com")).toBe(false);

    upgradeGuestToRegisteredUser("shadowlog.app@gmail.com");

    const vipStatus = getTicketStatus();
    expect(vipStatus.isVip).toBe(true);
    expect(vipStatus.vipType).toBe("whitelist");
    expect(vipStatus.plan).toBe("pro");
    expect(vipStatus.availableTickets).toBe(Infinity);
    expect(vipStatus.availableProTrials).toBe(Infinity);
    expect(vipStatus.canPracticeShort).toBe(true);
    expect(vipStatus.canPracticePro).toBe(true);

    // VIP should never consume tickets
    expect(consumeTicket("short")).toBe(true);
    expect(consumeTicket("long")).toBe(true);
    expect(getTicketStatus().availableTickets).toBe(Infinity);
  });

  it("retains VIP access for existing Pro tester accounts", () => {
    setPlanType("pro");
    setCurrentUserEmail("existing_tester@example.com");

    const status = getTicketStatus();
    expect(status.isVip).toBe(true);
    expect(status.plan).toBe("pro");
    expect(status.availableTickets).toBe(Infinity);
    expect(status.canPracticeShort).toBe(true);
    expect(status.canPracticePro).toBe(true);
  });
});


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
} from "@/lib/storage/ticket-store";
import {
  isVipEmail,
  isCampaignVip,
  getVipType,
  CAMPAIGN_REGISTRATION_DEADLINE,
  CAMPAIGN_EXPIRATION_DATE,
} from "@/lib/auth/vip-checker";

describe("Ticket Store & VIP Whitelist & Campaign Tests", () => {
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

  it("upgrades guest to registered user outside campaign, granting 20 total tickets and 2 Pro trials", () => {
    // Guest uses 2 tickets first
    consumeTicket("short");
    consumeTicket("short");
    expect(getTicketStatus().availableTickets).toBe(3);

    // User registered AFTER campaign deadline (2026-10-25)
    upgradeGuestToRegisteredUser("regular_user@example.com", "2026-10-25T12:00:00+09:00");

    const status = getTicketStatus(undefined, "2026-10-25T12:00:00+09:00");
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
    upgradeGuestToRegisteredUser("user@example.com", "2026-10-25T12:00:00+09:00");

    // 1st Pro trial
    expect(consumeTicket("long")).toBe(true);
    expect(getTicketStatus(undefined, "2026-10-25T12:00:00+09:00").availableProTrials).toBe(1);

    // 2nd Pro trial
    expect(consumeTicket("long")).toBe(true);
    expect(getTicketStatus(undefined, "2026-10-25T12:00:00+09:00").availableProTrials).toBe(0);
    expect(getTicketStatus(undefined, "2026-10-25T12:00:00+09:00").canPracticePro).toBe(false);

    // 3rd Pro attempt should fail
    expect(consumeTicket("long")).toBe(false);
  });

  it("grants October Campaign VIP (unlimited Pro) to users registered on or before 10/20", () => {
    // Registered on 2026-10-10, evaluated on 2026-10-15
    const regDate = "2026-10-10T12:00:00+09:00";
    const evalDate = new Date("2026-10-15T12:00:00+09:00");

    upgradeGuestToRegisteredUser("campaign_user@example.com", regDate);

    const status = getTicketStatus(undefined, regDate, evalDate);
    expect(status.isVip).toBe(true);
    expect(status.vipType).toBe("campaign");
    expect(status.plan).toBe("pro");
    expect(status.availableTickets).toBe(Infinity);
    expect(status.availableProTrials).toBe(Infinity);
    expect(status.canPracticeShort).toBe(true);
    expect(status.canPracticePro).toBe(true);

    // Tickets are not consumed for campaign VIP
    expect(consumeTicket("short")).toBe(true);
    expect(consumeTicket("long")).toBe(true);
  });

  it("expires Campaign VIP access after 2026-10-30", () => {
    // Registered on 2026-10-10, but evaluated on 2026-11-01 (post-campaign)
    const regDate = "2026-10-10T12:00:00+09:00";
    const evalDate = new Date("2026-11-01T00:00:00+09:00");

    expect(isCampaignVip(regDate, evalDate)).toBe(false);

    upgradeGuestToRegisteredUser("campaign_user@example.com", regDate);

    const status = getTicketStatus(undefined, regDate, evalDate);
    expect(status.isVip).toBe(false);
    expect(status.vipType).toBeNull();
    // Reverts to free plan
    expect(status.plan).toBe("free");
    expect(status.totalTickets).toBe(REGISTERED_TOTAL_TICKETS);
  });

  it("identifies VIP tester email (shadowlog.app@gmail.com) and grants permanent unlimited access", () => {
    expect(isVipEmail("shadowlog.app@gmail.com")).toBe(true);
    expect(isVipEmail("SHADOWLOG.APP@GMAIL.COM ")).toBe(true); // Case and whitespace insensitive
    expect(isVipEmail("other@example.com")).toBe(false);

    upgradeGuestToRegisteredUser("shadowlog.app@gmail.com");

    // Even after 2026-10-30, permanent whitelist VIP remains active
    const postCampaignDate = new Date("2026-12-01T00:00:00+09:00");
    const vipStatus = getTicketStatus(undefined, undefined, postCampaignDate);
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
    expect(getTicketStatus(undefined, undefined, postCampaignDate).availableTickets).toBe(Infinity);
  });
});

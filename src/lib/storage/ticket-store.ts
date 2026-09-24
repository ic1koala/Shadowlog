import { UserPlanType } from "@/types";
import { isVipEmail } from "@/lib/auth/vip-checker";
import { getPlanType, setPlanType } from "@/lib/storage/user-learning-store";

// Ticket Configuration
export const GUEST_MAX_TICKETS = 5;
export const REGISTERED_EXTRA_TICKETS = 15;
export const REGISTERED_TOTAL_TICKETS = GUEST_MAX_TICKETS + REGISTERED_EXTRA_TICKETS; // 20
export const PRO_TRIAL_MAX_TICKETS = 2;

// LocalStorage Keys
const KEY_GUEST_TICKETS_USED = "shadowlog_guest_tickets_used";
const KEY_USER_TICKETS_USED = "shadowlog_user_tickets_used";
const KEY_PRO_TRIAL_USED = "shadowlog_pro_trial_used";
const KEY_USER_EMAIL = "shadowlog_user_email";

export interface TicketStatus {
  isVip: boolean;
  isRegistered: boolean;
  plan: UserPlanType;
  availableTickets: number;
  usedTickets: number;
  totalTickets: number;
  availableProTrials: number;
  usedProTrials: number;
  totalProTrials: number;
  canPracticeShort: boolean;
  canPracticePro: boolean;
}

/**
 * Gets the current stored user email if logged in
 */
export function getCurrentUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY_USER_EMAIL);
  } catch {
    return null;
  }
}

/**
 * Sets current user email upon login/signup
 */
export function setCurrentUserEmail(email: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (email) {
      localStorage.setItem(KEY_USER_EMAIL, email);
    } else {
      localStorage.removeItem(KEY_USER_EMAIL);
    }
  } catch {
    // ignore
  }
}

/**
 * Retrieves the comprehensive ticket status of the user
 */
export function getTicketStatus(emailOverride?: string | null): TicketStatus {
  if (typeof window === "undefined") {
    return {
      isVip: false,
      isRegistered: false,
      plan: "guest",
      availableTickets: GUEST_MAX_TICKETS,
      usedTickets: 0,
      totalTickets: GUEST_MAX_TICKETS,
      availableProTrials: 0,
      usedProTrials: 0,
      totalProTrials: PRO_TRIAL_MAX_TICKETS,
      canPracticeShort: true,
      canPracticePro: false,
    };
  }

  const email = emailOverride !== undefined ? emailOverride : getCurrentUserEmail();
  const isVip = isVipEmail(email);
  const currentPlan = getPlanType();

  // If VIP, automatically grant unlimited Pro access
  if (isVip) {
    return {
      isVip: true,
      isRegistered: true,
      plan: "pro",
      availableTickets: Infinity,
      usedTickets: 0,
      totalTickets: Infinity,
      availableProTrials: Infinity,
      usedProTrials: 0,
      totalProTrials: Infinity,
      canPracticeShort: true,
      canPracticePro: true,
    };
  }

  // If paid Pro user
  if (currentPlan === "pro") {
    return {
      isVip: false,
      isRegistered: true,
      plan: "pro",
      availableTickets: Infinity,
      usedTickets: 0,
      totalTickets: Infinity,
      availableProTrials: Infinity,
      usedProTrials: 0,
      totalProTrials: Infinity,
      canPracticeShort: true,
      canPracticePro: true,
    };
  }

  // If paid Base user (月500円 / 1日20回)
  if (currentPlan === "base") {
    return {
      isVip: false,
      isRegistered: true,
      plan: "base",
      availableTickets: Infinity,
      usedTickets: 0,
      totalTickets: Infinity,
      availableProTrials: 0,
      usedProTrials: 0,
      totalProTrials: PRO_TRIAL_MAX_TICKETS,
      canPracticeShort: true,
      canPracticePro: false,
    };
  }

  // Free or Guest tier
  const isRegistered = currentPlan === "free" || !!email;

  const usedShort = isRegistered
    ? parseInt(localStorage.getItem(KEY_USER_TICKETS_USED) || "0", 10)
    : parseInt(localStorage.getItem(KEY_GUEST_TICKETS_USED) || "0", 10);

  const usedPro = parseInt(localStorage.getItem(KEY_PRO_TRIAL_USED) || "0", 10);

  const totalTickets = isRegistered ? REGISTERED_TOTAL_TICKETS : GUEST_MAX_TICKETS;
  const availableTickets = Math.max(0, totalTickets - usedShort);

  const totalProTrials = isRegistered ? PRO_TRIAL_MAX_TICKETS : 0;
  const availableProTrials = Math.max(0, totalProTrials - usedPro);

  return {
    isVip: false,
    isRegistered,
    plan: isRegistered ? "free" : "guest",
    availableTickets,
    usedTickets: usedShort,
    totalTickets,
    availableProTrials,
    usedProTrials: usedPro,
    totalProTrials,
    canPracticeShort: availableTickets > 0,
    canPracticePro: availableProTrials > 0,
  };
}

/**
 * Consumes a ticket when a practice session is scored.
 * Returns true if consumption succeeded, false if quota was already 0.
 */
export function consumeTicket(
  mode: "short" | "long" = "short",
  emailOverride?: string | null
): boolean {
  if (typeof window === "undefined") return true;

  const status = getTicketStatus(emailOverride);

  // VIP or Pro plan doesn't consume tickets
  if (status.isVip || status.plan === "pro" || status.plan === "base") {
    return true;
  }

  if (mode === "long") {
    if (!status.canPracticePro) return false;
    const currentUsed = parseInt(localStorage.getItem(KEY_PRO_TRIAL_USED) || "0", 10);
    localStorage.setItem(KEY_PRO_TRIAL_USED, String(currentUsed + 1));
    return true;
  }

  // Standard Short mode
  if (!status.canPracticeShort) return false;

  if (status.isRegistered) {
    const currentUsed = parseInt(localStorage.getItem(KEY_USER_TICKETS_USED) || "0", 10);
    localStorage.setItem(KEY_USER_TICKETS_USED, String(currentUsed + 1));
  } else {
    const currentUsed = parseInt(localStorage.getItem(KEY_GUEST_TICKETS_USED) || "0", 10);
    localStorage.setItem(KEY_GUEST_TICKETS_USED, String(currentUsed + 1));
  }

  return true;
}

/**
 * Upgrades guest data to registered user (called after user signs in / signs up)
 */
export function upgradeGuestToRegisteredUser(email: string): void {
  if (typeof window === "undefined") return;

  setCurrentUserEmail(email);
  const isVip = isVipEmail(email);

  if (isVip) {
    setPlanType("pro");
  } else if (getPlanType() === "guest") {
    setPlanType("free");
  }

  // Transfer guest tickets used into user tickets used
  const guestUsed = parseInt(localStorage.getItem(KEY_GUEST_TICKETS_USED) || "0", 10);
  if (!localStorage.getItem(KEY_USER_TICKETS_USED)) {
    localStorage.setItem(KEY_USER_TICKETS_USED, String(guestUsed));
  }
}

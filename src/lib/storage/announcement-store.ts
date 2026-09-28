import { Announcement } from "@/types";
import rawAnnouncements from "@/data/announcements.json";

const KEY_READ_ANNOUNCEMENTS = "shadowlog_read_announcements";
const KEY_LATER_ANNOUNCEMENTS = "shadowlog_later_announcements";

export const allAnnouncements: Announcement[] = rawAnnouncements as Announcement[];

export function getReadAnnouncementIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_READ_ANNOUNCEMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLaterAnnouncementIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_LATER_ANNOUNCEMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
  * Marks an announcement as completely read (Dismissed & Confirmed)
  */
export function markAsRead(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const readList = getReadAnnouncementIds();
    if (!readList.includes(id)) {
      readList.push(id);
      localStorage.setItem(KEY_READ_ANNOUNCEMENTS, JSON.stringify(readList));
    }
    // Remove from later list if it was there
    const laterList = getLaterAnnouncementIds().filter((item) => item !== id);
    localStorage.setItem(KEY_LATER_ANNOUNCEMENTS, JSON.stringify(laterList));

    window.dispatchEvent(new Event("shadowlog:announcements-update"));
  } catch {
    // ignore
  }
}

/**
  * Marks an announcement as "Read Later" (Sucks into Settings & Lights Red Dot)
  */
export function markAsLater(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const laterList = getLaterAnnouncementIds();
    if (!laterList.includes(id)) {
      laterList.push(id);
      localStorage.setItem(KEY_LATER_ANNOUNCEMENTS, JSON.stringify(laterList));
    }
    window.dispatchEvent(new Event("shadowlog:announcements-update"));
  } catch {
    // ignore
  }
}

/**
  * Returns true if there are any unread "read later" announcements that require red dot on settings
  */
export function hasUnreadLaterAnnouncements(): boolean {
  const laterIds = getLaterAnnouncementIds();
  const readIds = getReadAnnouncementIds();
  // Unread later items = items in laterIds that are NOT in readIds
  const unreadLater = laterIds.filter((id) => !readIds.includes(id));
  return unreadLater.length > 0;
}

/**
  * Finds the latest active announcement that the user has neither read nor saved to "later"
  */
export function getPendingAnnouncement(): Announcement | null {
  if (allAnnouncements.length === 0) return null;
  const readIds = getReadAnnouncementIds();
  const laterIds = getLaterAnnouncementIds();

  for (const ann of allAnnouncements) {
    if (!readIds.includes(ann.id) && !laterIds.includes(ann.id)) {
      return ann;
    }
  }
  return null;
}

/**
 * Admin Experimental Feature Preview Store
 * Manages feature flags visible and toggleable exclusively by Admin accounts.
 */

const ADMIN_PREVIEW_STORAGE_KEY = "shadowlog_admin_preview";

export interface AdminPreviewSettings {
  chunkSlash: boolean;
}

const DEFAULT_SETTINGS: AdminPreviewSettings = {
  chunkSlash: false,
};

export function getAdminPreviewSettings(): AdminPreviewSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(ADMIN_PREVIEW_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      chunkSlash: Boolean(parsed?.chunkSlash),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setAdminPreviewSettings(
  updates: Partial<AdminPreviewSettings>
): AdminPreviewSettings {
  const current = getAdminPreviewSettings();
  const next: AdminPreviewSettings = {
    ...current,
    ...updates,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ADMIN_PREVIEW_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  return next;
}

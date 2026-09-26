const STORAGE_KEY = "pdf-reader-device-id";

/**
 * Stable per-device identifier used to scope reading progress and bookmarks
 * while the app has no authentication (Stage 1).
 *
 * Stage 2 / auth: replace the returned value with the signed-in user id and
 * write it to the `user_id` column that already exists on both tables.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";

  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

import { useEffect, useState } from "react";

export type QuranBookmark = { page: number; surah?: number; ayah?: number; label: string; at: number };
export type LastRead = { page: number; surah?: number; ayah?: number; at: number };

const BM = "quran-bookmarks";
const LR = "quran-last-read";
const EVT = "quran-store";

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVT));
}

function useStore<T>(key: string, fallback: T): T {
  const [v, setV] = useState<T>(fallback);
  useEffect(() => {
    const sync = () => setV(read(key, fallback));
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return v;
}

export const useBookmarks = () => useStore<QuranBookmark[]>(BM, []);
export const useLastRead = () => useStore<LastRead | null>(LR, null);

export function setLastRead(v: Omit<LastRead, "at">) {
  write(LR, { ...v, at: Date.now() });
}

const same = (a: QuranBookmark, b: Partial<QuranBookmark>) =>
  a.page === b.page && a.surah === b.surah && a.ayah === b.ayah;

export function toggleBookmark(b: Omit<QuranBookmark, "at">) {
  const list = read<QuranBookmark[]>(BM, []);
  const exists = list.some((x) => same(x, b));
  write(BM, exists ? list.filter((x) => !same(x, b)) : [{ ...b, at: Date.now() }, ...list]);
  return !exists;
}

export function removeBookmark(b: QuranBookmark) {
  write(BM, read<QuranBookmark[]>(BM, []).filter((x) => !same(x, b)));
}

export const isBookmarked = (list: QuranBookmark[], b: Partial<QuranBookmark>) =>
  list.some((x) => same(x, b));

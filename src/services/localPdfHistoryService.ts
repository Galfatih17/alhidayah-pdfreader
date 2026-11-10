import { META_STORE, PDF_STORE, idbDelete, idbGet, idbKeys, idbPut } from "@/lib/offlineDb";
import { createLocalPdf, type LocalPdf, type LocalPdfHistoryEntry } from "@/lib/localPdf";
import { clearCachedPages } from "@/lib/pageRenderCache";

const HISTORY_KEY = "local-pdf-history:v1";
const FILE_KEY_PREFIX = "local-pdf-blob:";

const fileKey = (id: string) => `${FILE_KEY_PREFIX}${id}`;

async function readEntries(): Promise<LocalPdfHistoryEntry[]> {
  const value = await idbGet<LocalPdfHistoryEntry[]>(META_STORE, HISTORY_KEY);
  return Array.isArray(value) ? value : [];
}

export async function listLocalPdfHistory(): Promise<LocalPdfHistoryEntry[]> {
  const entries = await readEntries();
  const storedKeys = new Set((await idbKeys(PDF_STORE)).map(String));
  const available = entries.filter(
    (entry) => entry && typeof entry.id === "string" && storedKeys.has(fileKey(entry.id)),
  );

  if (available.length !== entries.length) {
    await idbPut(META_STORE, HISTORY_KEY, available);
  }

  return available.sort(
    (a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime(),
  );
}

function storageError(error: unknown): Error {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return new Error(
      "Penyimpanan perangkat tidak cukup. Hapus PDF dari riwayat lokal, lalu coba lagi.",
    );
  }
  if (error instanceof Error && error.message.includes("IndexedDB")) return error;
  return new Error(
    "PDF gagal disimpan ke penyimpanan perangkat. Periksa ruang penyimpanan browser.",
  );
}

export async function saveLocalPdf(file: File): Promise<LocalPdf> {
  const id = `local-${crypto.randomUUID()}`;
  const entry: LocalPdfHistoryEntry = {
    id,
    title: file.name.replace(/\.pdf$/i, "") || file.name,
    fileName: file.name,
    fileSize: file.size,
    lastModified: file.lastModified,
    lastOpenedAt: new Date().toISOString(),
  };
  const key = fileKey(id);

  try {
    await idbPut(PDF_STORE, key, file);
    const current = await readEntries();
    await idbPut(META_STORE, HISTORY_KEY, [entry, ...current.filter((item) => item.id !== id)]);
  } catch (error) {
    await idbDelete(PDF_STORE, key).catch(() => undefined);
    throw storageError(error);
  }

  return createLocalPdf(file, id);
}

export async function openLocalPdfHistory(id: string): Promise<LocalPdf> {
  const entries = await listLocalPdfHistory();
  const entry = entries.find((item) => item.id === id);
  if (!entry) throw new Error("PDF lokal tidak ditemukan di penyimpanan perangkat.");

  const stored = await idbGet<Blob>(PDF_STORE, fileKey(id));
  if (!stored) throw new Error("Salinan PDF sudah tidak tersedia di penyimpanan browser.");

  const file = new File([stored], entry.fileName, {
    type: stored.type || "application/pdf",
    lastModified: entry.lastModified,
  });
  const updated = { ...entry, lastOpenedAt: new Date().toISOString() };
  await idbPut(META_STORE, HISTORY_KEY, [
    updated,
    ...entries.filter((item) => item.id !== id),
  ]).catch(() => undefined);

  return createLocalPdf(file, id);
}

export async function deleteLocalPdfHistory(id: string): Promise<void> {
  const entries = await readEntries();
  await idbDelete(PDF_STORE, fileKey(id));
  await clearCachedPages(id);
  await idbPut(
    META_STORE,
    HISTORY_KEY,
    entries.filter((entry) => entry.id !== id),
  );
}

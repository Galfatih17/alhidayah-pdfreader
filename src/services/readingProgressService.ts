import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import { progressPercent } from "@/lib/format";
import type { PdfDocument, ReadingProgress, RecentDocument } from "./types";

// The database only allows each device to reach its own rows, matched by this header.
const DEVICE_HEADER = "x-device-id";

export async function getProgress(pdfId: string): Promise<ReadingProgress | null> {
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("pdf_id", pdfId)
    .eq("device_id", getDeviceId())
    .maybeSingle()
    .setHeader(DEVICE_HEADER, getDeviceId());

  if (error) throw new Error(error.message);
  return (data as ReadingProgress | null) ?? null;
}

export async function listRecent(limit = 20): Promise<RecentDocument[]> {
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*, document:pdf_documents(*)")
    .eq("device_id", getDeviceId())
    .order("last_read_at", { ascending: false })
    .limit(limit)
    .setHeader(DEVICE_HEADER, getDeviceId());

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RecentDocument[]).filter((row) => Boolean(row.document));
}

export async function saveProgress(params: {
  pdfId: string;
  currentPage: number;
  totalPages: number | null;
}): Promise<void> {
  const { error } = await supabase
    .from("reading_progress")
    .upsert(
      {
        pdf_id: params.pdfId,
        device_id: getDeviceId(),
        current_page: params.currentPage,
        total_pages: params.totalPages,
        progress_percentage: progressPercent(params.currentPage, params.totalPages),
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "pdf_id,device_id" },
    )
    .setHeader(DEVICE_HEADER, getDeviceId());

  if (error) throw new Error(error.message);
}

export async function clearProgress(pdfId: string): Promise<void> {
  const { error } = await supabase
    .from("reading_progress")
    .delete()
    .eq("pdf_id", pdfId)
    .eq("device_id", getDeviceId())
    .setHeader(DEVICE_HEADER, getDeviceId());
  if (error) throw new Error(error.message);
}

export function documentOf(row: RecentDocument): PdfDocument {
  return row.document;
}

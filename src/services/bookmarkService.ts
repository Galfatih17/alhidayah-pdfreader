import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import type { Bookmark, BookmarkWithDocument } from "./types";

export async function listBookmarks(): Promise<BookmarkWithDocument[]> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*, document:pdf_documents(*)")
    .eq("device_id", getDeviceId())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as BookmarkWithDocument[]).filter((row) =>
    Boolean(row.document),
  );
}

export async function listBookmarksForDocument(pdfId: string): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("pdf_id", pdfId)
    .eq("device_id", getDeviceId())
    .order("page_number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Bookmark[];
}

export async function createBookmark(params: {
  pdfId: string;
  pageNumber: number;
  title?: string;
  note?: string;
}): Promise<Bookmark> {
  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      pdf_id: params.pdfId,
      device_id: getDeviceId(),
      page_number: params.pageNumber,
      title: params.title?.trim() || null,
      note: params.note?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Bookmark;
}

export async function updateBookmark(
  id: string,
  params: { title?: string | null; note?: string | null },
): Promise<void> {
  const { error } = await supabase
    .from("bookmarks")
    .update({
      title: params.title?.trim() || null,
      note: params.note?.trim() || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBookmark(id: string): Promise<void> {
  const { error } = await supabase.from("bookmarks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

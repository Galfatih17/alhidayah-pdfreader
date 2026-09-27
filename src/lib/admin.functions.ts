import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, timingSafeEqual } from "node:crypto";

const PDF_BUCKET = "pdf-files";
const THUMBNAIL_BUCKET = "pdf-thumbnails";

function checkPassword(input: string) {
  const expected = process.env["UPLOAD_PASSWORD"];
  if (!expected) throw new Error("Password unggah belum diatur.");
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  if (!timingSafeEqual(a, b)) throw new Error("Password salah.");
}

const safe = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);

export const verifyUploadPassword = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ password: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    try {
      checkPassword(data.password);
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  });

export const createUploadUrls = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        password: z.string().max(200),
        fileName: z.string().min(1).max(300),
        thumbName: z.string().max(300).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const documentId = crypto.randomUUID();
    const filePath = `${documentId}/${safe(data.fileName)}`;
    const pdf = await supabaseAdmin.storage.from(PDF_BUCKET).createSignedUploadUrl(filePath);
    if (pdf.error) throw new Error(pdf.error.message);
    let thumb: { path: string; token: string } | null = null;
    if (data.thumbName) {
      const path = `${documentId}/${safe(data.thumbName)}`;
      const t = await supabaseAdmin.storage.from(THUMBNAIL_BUCKET).createSignedUploadUrl(path);
      if (t.error) throw new Error(t.error.message);
      thumb = { path, token: t.data.token };
    }
    return { documentId, filePath, token: pdf.data.token, thumb };
  });

export const finalizeUpload = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        password: z.string().max(200),
        documentId: z.string().uuid(),
        title: z.string().trim().min(1).max(200),
        description: z.string().max(2000).nullable(),
        filePath: z.string().max(500),
        thumbnailPath: z.string().max(500).nullable(),
        fileSize: z.number().int().nonnegative(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    if (!data.filePath.startsWith(`${data.documentId}/`)) throw new Error("Path tidak valid.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("pdf_documents").insert({
      id: data.documentId,
      title: data.title,
      description: data.description?.trim() || null,
      file_path: data.filePath,
      thumbnail_path: data.thumbnailPath,
      file_size: data.fileSize,
    });
    if (error) {
      await supabaseAdmin.storage.from(PDF_BUCKET).remove([data.filePath]);
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteDocumentAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ password: z.string().max(200), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc } = await supabaseAdmin
      .from("pdf_documents")
      .select("file_path, thumbnail_path")
      .eq("id", data.id)
      .maybeSingle();
    await supabaseAdmin.from("bookmarks").delete().eq("pdf_id", data.id);
    await supabaseAdmin.from("reading_progress").delete().eq("pdf_id", data.id);
    const { error } = await supabaseAdmin.from("pdf_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (doc?.file_path) await supabaseAdmin.storage.from(PDF_BUCKET).remove([doc.file_path]);
    if (doc?.thumbnail_path)
      await supabaseAdmin.storage.from(THUMBNAIL_BUCKET).remove([doc.thumbnail_path]);
    return { ok: true };
  });

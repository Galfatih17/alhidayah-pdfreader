import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Records a document's page count once; visitors can no longer edit documents directly. */
export const setDocumentTotalPages = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), totalPages: z.number().int().min(1).max(100000) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pdf_documents")
      .update({ total_pages: data.totalPages })
      .eq("id", data.id)
      .is("total_pages", null);
    if (error) throw new Error("Gagal menyimpan jumlah halaman.");
    return { ok: true };
  });

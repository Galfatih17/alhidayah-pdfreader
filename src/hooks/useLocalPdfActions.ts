import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createLocalPdf, type LocalPdf } from "@/lib/localPdf";
import { openLocalPdfHistory, saveLocalPdf } from "@/services/localPdfHistoryService";

export function useLocalPdfActions() {
  const queryClient = useQueryClient();
  const [localPdf, setLocalPdf] = useState<LocalPdf | null>(null);
  const [saving, setSaving] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const saveAndOpen = (file: File) => {
    if (saving || openingId) return;

    const pdf = createLocalPdf(file);
    const toastId = `local-pdf-save-${pdf.document.id}`;
    setLocalPdf(pdf);
    setSaving(true);
    toast.loading("PDF dibuka. Menyimpan salinan ke riwayat...", { id: toastId });

    void saveLocalPdf(file, pdf.document.id)
      .then(() => {
        void queryClient
          .invalidateQueries({ queryKey: ["local-pdf-history"] })
          .catch(() => undefined);
        toast.success("PDF tersimpan di riwayat lokal.", { id: toastId });
      })
      .catch((error: unknown) => {
        const detail = error instanceof Error ? error.message : "Penyimpanan lokal gagal.";
        toast.error(
          `${detail} PDF tetap terbuka untuk sesi ini, tetapi tidak tersedia di riwayat setelah ditutup.`,
          { id: toastId },
        );
      })
      .finally(() => setSaving(false));
  };

  const openFromHistory = async (id: string) => {
    if (saving || openingId) return;
    setOpeningId(id);
    try {
      const pdf = await openLocalPdfHistory(id);
      setLocalPdf(pdf);
      await queryClient.invalidateQueries({ queryKey: ["local-pdf-history"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF lokal tidak dapat dibuka.");
    } finally {
      setOpeningId(null);
    }
  };

  return {
    localPdf,
    saving,
    openingId,
    saveAndOpen,
    openFromHistory,
    closeLocal: () => setLocalPdf(null),
  };
}

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LocalPdf } from "@/lib/localPdf";
import { openLocalPdfHistory, saveLocalPdf } from "@/services/localPdfHistoryService";

export function useLocalPdfActions() {
  const queryClient = useQueryClient();
  const [localPdf, setLocalPdf] = useState<LocalPdf | null>(null);
  const [saving, setSaving] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const saveAndOpen = async (file: File) => {
    if (saving || openingId) return;
    setSaving(true);
    try {
      const pdf = await saveLocalPdf(file);
      setLocalPdf(pdf);
      await queryClient.invalidateQueries({ queryKey: ["local-pdf-history"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF gagal disimpan di perangkat.");
    } finally {
      setSaving(false);
    }
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

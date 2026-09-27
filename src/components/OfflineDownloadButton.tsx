import { useEffect, useState } from "react";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { pdfStorageService, subscribeOffline } from "@/services/pdfStorageService";

export function useIsOffline(filePath: string) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let alive = true;
    const check = () =>
      pdfStorageService.isAvailableOffline(filePath).then((v) => alive && setAvailable(v));
    check();
    const unsub = subscribeOffline(check);
    return () => {
      alive = false;
      unsub();
    };
  }, [filePath]);
  return available;
}

export function OfflineDownloadButton({ filePath }: { filePath: string }) {
  const available = useIsOffline(filePath);
  const [busy, setBusy] = useState(false);

  if (available)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
        <CheckCircle2 className="size-3.5" /> Tersedia offline
      </span>
    );

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="gap-1.5 rounded-lg"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await pdfStorageService.downloadPdf(filePath);
          toast.success("PDF tersimpan untuk dibaca offline.");
        } catch {
          toast.error("Gagal mengunduh. Periksa koneksi internet.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
      {busy ? "Mengunduh..." : "Unduh"}
    </Button>
  );
}

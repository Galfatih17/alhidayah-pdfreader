import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, History, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatFileSize, formatRelativeTime } from "@/lib/format";
import type { LocalPdfHistoryEntry } from "@/lib/localPdf";
import { deleteLocalPdfHistory, listLocalPdfHistory } from "@/services/localPdfHistoryService";

export function LocalPdfHistory({
  onOpen,
  openingId,
}: {
  onOpen: (id: string) => void;
  openingId: string | null;
}) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<LocalPdfHistoryEntry | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["local-pdf-history"],
    queryFn: listLocalPdfHistory,
    enabled: typeof window !== "undefined",
  });
  const deleteMutation = useMutation({
    mutationFn: deleteLocalPdfHistory,
    onSuccess: async () => {
      setDeleteTarget(null);
      toast.success("Salinan PDF dihapus dari perangkat.");
      await queryClient.invalidateQueries({ queryKey: ["local-pdf-history"] });
    },
    onError: () => toast.error("PDF lokal gagal dihapus."),
  });

  return (
    <section className="space-y-3" aria-labelledby="local-pdf-history-title">
      <div>
        <h2 id="local-pdf-history-title" className="font-display text-lg font-semibold">
          Riwayat PDF lokal
        </h2>
        <p className="text-xs text-muted-foreground">Tersimpan hanya di perangkat ini.</p>
      </div>

      {isLoading || (!data && !isError) ? (
        <div className="space-y-2">
          {[0, 1].map((item) => (
            <Skeleton key={item} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={History}
          title="Riwayat lokal tidak dapat dimuat."
          description="Periksa apakah penyimpanan browser tersedia."
        />
      ) : !data?.length ? (
        <EmptyState
          icon={History}
          title="Belum ada PDF lokal."
          description="PDF yang dibuka dari perangkat akan muncul di sini."
        />
      ) : (
        <div className="max-h-[28rem] space-y-2 overflow-y-auto overscroll-contain pr-1">
          {data.map((entry) => (
            <div key={entry.id} className="card-surface flex items-center gap-2 p-3">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => onOpen(entry.id)}
                disabled={openingId !== null}
                aria-label={`Buka kembali ${entry.fileName}`}
              >
                {openingId === entry.id ? (
                  <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
                ) : (
                  <FileText className="size-5 shrink-0 text-primary" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{entry.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatRelativeTime(entry.lastOpenedAt)}
                    {formatFileSize(entry.fileSize) ? ` · ${formatFileSize(entry.fileSize)}` : ""}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive disabled:opacity-40"
                onClick={() => setDeleteTarget(entry)}
                disabled={deleteMutation.isPending || openingId !== null}
                aria-label={`Hapus ${entry.fileName} dari riwayat lokal`}
                title="Hapus PDF lokal"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus PDF dari riwayat lokal?</AlertDialogTitle>
            <AlertDialogDescription>
              Salinan “{deleteTarget?.fileName}” akan dihapus dari penyimpanan browser. File asli di
              perangkat tidak dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              Hapus salinan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

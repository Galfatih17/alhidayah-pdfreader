import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { RecentDocumentCard } from "./RecentDocumentCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { listRecent } from "@/services/readingProgressService";

export function RecentDocuments({ query }: { query: string }) {
  const online = useOnlineStatus();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recent-documents"],
    queryFn: () => listRecent(),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Clock}
        title="Gagal memuat riwayat"
        description="Periksa koneksi internet dan coba lagi."
      />
    );
  }

  const term = query.trim().toLowerCase();
  const items = (data ?? []).filter((item) =>
    term
      ? `${item.document.title} ${item.document.description ?? ""}`.toLowerCase().includes(term)
      : true,
  );

  if (!items.length) {
    return term ? (
      <EmptyState icon={Clock} title="Dokumen tidak ditemukan." />
    ) : (
      <EmptyState
        icon={Clock}
        title="Belum ada dokumen yang dibaca."
        description="Pilih dokumen dari Library untuk mulai membaca."
        action={
          <Button asChild variant="outline" size="sm" className="mt-1">
            <Link to="/library">Buka Library</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <RecentDocumentCard key={item.id} item={item} online={online} />
      ))}
    </div>
  );
}

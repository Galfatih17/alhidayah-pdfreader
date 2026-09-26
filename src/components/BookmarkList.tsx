import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark as BookmarkIcon } from "lucide-react";
import { toast } from "sonner";
import { BookmarkCard } from "./BookmarkCard";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteBookmark, listBookmarks } from "@/services/bookmarkService";

export function BookmarkList({ query = "" }: { query?: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: listBookmarks,
  });

  const removeMutation = useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => {
      toast.success("Bookmark dihapus.");
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
    onError: () => toast.error("Bookmark gagal dihapus."),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={BookmarkIcon}
        title="Gagal memuat bookmark"
        description="Periksa koneksi internet dan coba lagi."
      />
    );
  }

  const term = query.trim().toLowerCase();
  const items = (data ?? []).filter((item) =>
    term
      ? `${item.document.title} ${item.title ?? ""} ${item.note ?? ""}`
          .toLowerCase()
          .includes(term)
      : true,
  );

  if (!items.length) {
    return term ? (
      <EmptyState icon={BookmarkIcon} title="Dokumen tidak ditemukan." />
    ) : (
      <EmptyState
        icon={BookmarkIcon}
        title="Belum ada bookmark."
        description="Bookmark halaman penting saat membaca PDF."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={(id) => removeMutation.mutate(id)}
        />
      ))}
    </div>
  );
}

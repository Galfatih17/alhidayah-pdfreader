import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BookmarkEditDialog } from "./BookmarkEditDialog";
import {
  createBookmark,
  deleteBookmark,
  listBookmarksForDocument,
  updateBookmark,
} from "@/services/bookmarkService";

export function BookmarkButton({ pdfId, pageNumber }: { pdfId: string; pageNumber: number }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: bookmarks } = useQuery({
    queryKey: ["bookmarks", pdfId],
    queryFn: () => listBookmarksForDocument(pdfId),
  });
  const existing = bookmarks?.find((b) => b.page_number === pageNumber);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] });

  const saveMutation = useMutation({
    mutationFn: (v: { title: string; note: string }) =>
      existing
        ? updateBookmark(existing.id, v)
        : createBookmark({ pdfId, pageNumber, ...v }).then(() => undefined),
    onSuccess: () => {
      toast.success(existing ? "Bookmark diperbarui." : `Bookmark halaman ${pageNumber} tersimpan.`);
      setOpen(false);
      invalidate();
    },
    onError: () => toast.error("Bookmark gagal disimpan."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBookmark(id),
    onSuccess: () => {
      toast.success("Bookmark dihapus.");
      setOpen(false);
      invalidate();
    },
    onError: () => toast.error("Bookmark gagal dihapus."),
  });

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={existing ? "Edit bookmark halaman ini" : "Bookmark halaman ini"}
        aria-pressed={Boolean(existing)}
        onClick={() => setOpen(true)}
        className="size-10 rounded-xl text-reader-foreground hover:bg-reader-foreground/10 hover:text-reader-foreground"
      >
        {existing ? <BookmarkCheck className="size-5 text-primary" /> : <Bookmark className="size-5" />}
      </Button>
      <BookmarkEditDialog
        open={open}
        onOpenChange={setOpen}
        pageNumber={pageNumber}
        initialTitle={existing?.title}
        initialNote={existing?.note}
        isEditing={Boolean(existing)}
        pending={saveMutation.isPending || deleteMutation.isPending}
        onSave={(v) => saveMutation.mutate(v)}
        onDelete={existing ? () => deleteMutation.mutate(existing.id) : undefined}
      />
    </>
  );
}

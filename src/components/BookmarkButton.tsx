import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createBookmark,
  deleteBookmark,
  listBookmarksForDocument,
} from "@/services/bookmarkService";

export function BookmarkButton({
  pdfId,
  pageNumber,
}: {
  pdfId: string;
  pageNumber: number;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  const { data: bookmarks } = useQuery({
    queryKey: ["bookmarks", pdfId],
    queryFn: () => listBookmarksForDocument(pdfId),
  });

  const existing = bookmarks?.find((b) => b.page_number === pageNumber);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["bookmarks", pdfId] });
    queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
  };

  const createMutation = useMutation({
    mutationFn: () => createBookmark({ pdfId, pageNumber, title, note }),
    onSuccess: () => {
      toast.success(`Bookmark halaman ${pageNumber} tersimpan.`);
      setOpen(false);
      setTitle("");
      setNote("");
      invalidate();
    },
    onError: () => toast.error("Bookmark gagal disimpan."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBookmark(id),
    onSuccess: () => {
      toast.success("Bookmark dihapus.");
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
        aria-label={existing ? "Hapus bookmark halaman ini" : "Bookmark halaman ini"}
        aria-pressed={Boolean(existing)}
        onClick={() => (existing ? deleteMutation.mutate(existing.id) : setOpen(true))}
        className="size-10 rounded-xl text-reader-foreground hover:bg-reader-foreground/10 hover:text-reader-foreground"
      >
        {existing ? (
          <BookmarkCheck className="size-5 text-primary" />
        ) : (
          <Bookmark className="size-5" />
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Bookmark halaman {pageNumber}</DialogTitle>
            <DialogDescription>Tambahkan label dan catatan singkat (opsional).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bookmark-title">Label</Label>
              <Input
                id="bookmark-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bab 3 — Pembahasan"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bookmark-note">Catatan</Label>
              <Textarea
                id="bookmark-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Materi penting"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

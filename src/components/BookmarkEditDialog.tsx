import { useEffect, useState } from "react";
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

export function BookmarkEditDialog({
  open,
  onOpenChange,
  pageNumber,
  initialTitle,
  initialNote,
  isEditing,
  pending,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageNumber: number;
  initialTitle?: string | null;
  initialNote?: string | null;
  isEditing: boolean;
  pending?: boolean;
  onSave: (values: { title: string; note: string }) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initialTitle ?? "");
      setNote(initialNote ?? "");
    }
  }, [open, initialTitle, initialNote]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Edit bookmark" : "Bookmark"} halaman {pageNumber}
          </DialogTitle>
          <DialogDescription>Label dan catatan singkat (opsional).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bookmark-title">Label</Label>
            <Input
              id="bookmark-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bab 3 — Pembahasan"
              maxLength={120}
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
              maxLength={1000}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {isEditing && onDelete ? (
            <Button variant="outline" className="text-destructive" onClick={onDelete} disabled={pending}>
              Hapus
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
          )}
          <Button onClick={() => onSave({ title, note })} disabled={pending}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

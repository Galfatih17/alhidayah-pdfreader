import { Link } from "@tanstack/react-router";
import { House, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "./BookmarkButton";

export function PdfToolbar({
  pdfId,
  pageNumber,
  title,
  hasOutline,
  onOpenOutline,
}: {
  pdfId: string;
  pageNumber: number;
  title: string;
  hasOutline: boolean;
  onOpenOutline: () => void;
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-40 border-b border-border/40 bg-background/70 pt-[env(safe-area-inset-top,0px)] text-reader-foreground backdrop-blur-sm">
      <div className="grid h-12 grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] items-center gap-2 px-1.5 sm:px-3">
        <div className="flex items-center">
          <Button asChild variant="ghost" size="icon" className="size-10" title="Kembali ke Library">
            <Link to="/library" aria-label="Kembali ke Library"><House className="size-5" /></Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 disabled:opacity-30"
            onClick={onOpenOutline}
            disabled={!hasOutline}
            aria-label={hasOutline ? "Buka daftar isi" : "Dokumen tidak memiliki daftar isi"}
            title={hasOutline ? "Daftar Isi" : "Tidak ada daftar isi"}
          >
            <ListTree className="size-5" />
          </Button>
        </div>
        <span className="min-w-0 truncate text-center text-xs font-medium text-muted-foreground" title={title}>{title}</span>
        <div className="flex justify-end"><BookmarkButton pdfId={pdfId} pageNumber={pageNumber} /></div>
      </div>
    </header>
  );
}

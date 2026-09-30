import { Link } from "@tanstack/react-router";
import { House } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "./BookmarkButton";

export function PdfToolbar({
  pdfId,
  pageNumber,
  title,
}: {
  pdfId: string;
  pageNumber: number;
  title: string;
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-40 border-b border-border/40 bg-background/70 pt-[env(safe-area-inset-top,0px)] text-reader-foreground backdrop-blur-sm">
      <div className="grid h-12 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 px-1.5 sm:px-3">
        <Button asChild variant="ghost" size="icon" className="size-10" title="Kembali ke Library">
          <Link to="/library" aria-label="Kembali ke Library"><House className="size-5" /></Link>
        </Button>
        <span className="min-w-0 truncate text-center text-xs font-medium text-muted-foreground" title={title}>{title}</span>
        <BookmarkButton pdfId={pdfId} pageNumber={pageNumber} />
      </div>
    </header>
  );
}

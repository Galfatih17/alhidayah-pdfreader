import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Maximize2, Minimize2, MoveHorizontal, ZoomIn, ZoomOut } from "lucide-react";
import { BookmarkButton } from "./BookmarkButton";
import { Button } from "@/components/ui/button";

export function PdfToolbar({
  title,
  pdfId,
  pageNumber,
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onToggleFullscreen,
}: {
  title: string;
  pdfId: string;
  pageNumber: number;
  isFullscreen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onToggleFullscreen: () => void;
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-reader-foreground/10 bg-reader/95 text-reader-foreground backdrop-blur-md">
      <div className="mx-auto grid max-w-3xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Kembali"
          onClick={() => navigate({ to: "/library" })}
          className="size-10 shrink-0 rounded-xl text-reader-foreground hover:bg-reader-foreground/10 hover:text-reader-foreground"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="truncate font-display text-base font-semibold">{title}</h1>
        <div className="flex shrink-0 items-center">
          <BookmarkButton pdfId={pdfId} pageNumber={pageNumber} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
            onClick={onToggleFullscreen}
            className="size-10 rounded-xl text-reader-foreground hover:bg-reader-foreground/10 hover:text-reader-foreground"
          >
            {isFullscreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
          </Button>
        </div>
      </div>
      <div className="mx-auto flex max-w-3xl items-center gap-1 px-2 pb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Perkecil"
          onClick={onZoomOut}
          className="size-10 rounded-xl text-reader-foreground hover:bg-reader-foreground/10 hover:text-reader-foreground"
        >
          <ZoomOut className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Perbesar"
          onClick={onZoomIn}
          className="size-10 rounded-xl text-reader-foreground hover:bg-reader-foreground/10 hover:text-reader-foreground"
        >
          <ZoomIn className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onFitWidth}
          className="h-10 gap-1.5 rounded-xl px-3 text-sm text-reader-foreground hover:bg-reader-foreground/10 hover:text-reader-foreground"
        >
          <MoveHorizontal className="size-4" />
          Fit width
        </Button>
      </div>
    </header>
  );
}

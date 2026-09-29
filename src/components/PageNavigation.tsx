import { ChevronLeft, ChevronRight, House, MoveHorizontal, ZoomIn, ZoomOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function PageNavigation({
  page,
  totalPages,
  onPrev,
  onNext,
  onJump,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitWidth,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (page: number) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
}) {
  const [draft, setDraft] = useState(String(page));
  useEffect(() => setDraft(String(page)), [page]);
  const commit = () => {
    const value = Number(draft);
    if (Number.isInteger(value) && value >= 1 && value <= totalPages) onJump(value);
    else setDraft(String(page));
  };
  return (
    <div className="reader-nav-bottom fixed inset-x-2 z-40 mx-auto max-w-3xl rounded-lg border border-border bg-background/95 text-foreground shadow-lg backdrop-blur-md sm:inset-x-4">
      <div className="flex items-center justify-center gap-1 border-b border-border px-2 py-1.5">
        <Button asChild variant="ghost" size="icon" aria-label="Kembali ke Library" title="Kembali ke Library" className="size-9 shrink-0"><Link to="/library"><House className="size-4" /></Link></Button>
        <span className="ml-auto text-xs text-muted-foreground">Zoom {zoom}%</span>
        <Button variant="ghost" size="icon" aria-label="Perkecil" title="Perkecil" onClick={onZoomOut} className="size-9"><ZoomOut className="size-4" /></Button>
        <Button variant="ghost" size="icon" aria-label="Perbesar" title="Perbesar" onClick={onZoomIn} className="size-9"><ZoomIn className="size-4" /></Button>
        <Button variant="ghost" size="sm" onClick={onFitWidth} title="Fit Layar" className="h-9 gap-1"><MoveHorizontal className="size-4" /> Fit Layar</Button>
      </div>
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrev}
          disabled={page <= 1}
          className="h-10 gap-1 px-2 disabled:opacity-40"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="size-5" /> <span className="hidden sm:inline">Sebelumnya</span>
        </Button>
        <label className="flex items-center gap-2 text-sm tabular-nums">
          <span className="sr-only">Nomor halaman</span>
          <input aria-label="Nomor halaman" type="number" inputMode="numeric" min="1" max={totalPages || undefined} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") { commit(); e.currentTarget.blur(); } }} className="h-9 w-14 rounded-md border border-input bg-background text-center outline-none focus:ring-2 focus:ring-ring" />
          <span className="text-muted-foreground">/ {totalPages || "?"}</span>
        </label>
        <Button
          type="button"
          variant="ghost"
          onClick={onNext}
          disabled={!totalPages || page >= totalPages}
          className="h-10 gap-1 px-2 disabled:opacity-40"
          aria-label="Halaman berikutnya"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageNavigation({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-reader-foreground/10 bg-reader/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrev}
          disabled={page <= 1}
          className="h-11 gap-1 rounded-xl px-4 text-reader-foreground hover:bg-reader-foreground/10 hover:text-reader-foreground disabled:opacity-40"
        >
          <ChevronLeft className="size-5" />
          Sebelumnya
        </Button>
        <span className="shrink-0 text-sm font-medium text-reader-foreground/80 tabular-nums">
          {page} / {totalPages || "?"}
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={onNext}
          disabled={!totalPages || page >= totalPages}
          className="h-11 gap-1 rounded-xl px-4 text-reader-foreground hover:bg-reader-foreground/10 hover:text-reader-foreground disabled:opacity-40"
        >
          Berikutnya
          <ChevronRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}

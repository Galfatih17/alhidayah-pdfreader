import { Link } from "@tanstack/react-router";
import { BookOpenText, Upload } from "lucide-react";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <BookOpenText className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg leading-tight font-semibold">
              PDF Reader
            </span>
            {subtitle ? (
              <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
            ) : null}
          </span>
        </Link>
        <Link
          to="/admin"
          aria-label="Tambah dokumen"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Upload className="size-4" />
        </Link>
      </div>
    </header>
  );
}

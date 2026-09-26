import { Link } from "@tanstack/react-router";
import { Bookmark as BookmarkIcon, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
import type { BookmarkWithDocument } from "@/services/types";

export function BookmarkCard({
  bookmark,
  onDelete,
}: {
  bookmark: BookmarkWithDocument;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="card-surface p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <Link
          to="/reader/$id"
          params={{ id: bookmark.pdf_id }}
          search={{ page: bookmark.page_number }}
          className="min-w-0 space-y-1.5"
        >
          <h3 className="truncate font-display text-base font-semibold">
            {bookmark.document.title}
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-primary">
            <BookmarkIcon className="size-4 shrink-0" />
            Halaman {bookmark.page_number}
          </p>
          {bookmark.title ? (
            <p className="truncate text-sm font-medium">{bookmark.title}</p>
          ) : null}
          {bookmark.note ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{bookmark.note}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Dibuat {formatRelativeTime(bookmark.created_at)}
          </p>
        </Link>
        <button
          type="button"
          onClick={() => onDelete(bookmark.id)}
          aria-label="Hapus bookmark"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

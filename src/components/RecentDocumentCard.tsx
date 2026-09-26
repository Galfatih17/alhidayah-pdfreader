import { Link } from "@tanstack/react-router";
import { Wifi, WifiOff } from "lucide-react";
import { DocumentThumbnail } from "./DocumentThumbnail";
import { ReadingProgressBar } from "./ReadingProgress";
import { formatRelativeTime, progressPercent } from "@/lib/format";
import type { RecentDocument } from "@/services/types";

export function RecentDocumentCard({
  item,
  online,
}: {
  item: RecentDocument;
  online: boolean;
}) {
  const total = item.total_pages ?? item.document.total_pages;
  const percent = Math.round(Number(item.progress_percentage)) ||
    progressPercent(item.current_page, total);

  return (
    <Link
      to="/reader/$id"
      params={{ id: item.pdf_id }}
      className="card-surface block p-4 hover:shadow-lift"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
        <DocumentThumbnail thumbnailPath={item.document.thumbnail_path} title={item.document.title} />
        <div className="min-w-0 space-y-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
            <h3 className="truncate font-display text-base font-semibold">
              {item.document.title}
            </h3>
            <span
              className="mt-0.5 shrink-0 text-muted-foreground"
              title={online ? "Tersedia online" : "Tidak ada koneksi"}
            >
              {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
            </span>
          </div>
          <ReadingProgressBar
            currentPage={item.current_page}
            totalPages={total}
            percentage={percent}
          />
          <p className="text-xs text-muted-foreground">
            Terakhir dibaca {formatRelativeTime(item.last_read_at)}
          </p>
        </div>
      </div>
    </Link>
  );
}

import { Link } from "@tanstack/react-router";
import { DocumentThumbnail } from "./DocumentThumbnail";
import { Button } from "@/components/ui/button";
import { OfflineDownloadButton } from "./OfflineDownloadButton";
import { formatFileSize } from "@/lib/format";
import type { PdfDocument } from "@/services/types";

export function PdfCard({ document }: { document: PdfDocument }) {
  const meta = [
    document.total_pages ? `${document.total_pages} halaman` : null,
    formatFileSize(document.file_size),
  ].filter(Boolean);

  return (
    <article className="card-surface p-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
        <DocumentThumbnail
          thumbnailPath={document.thumbnail_path}
          title={document.title}
          className="size-16"
        />
        <div className="min-w-0 space-y-2">
          <h3 className="truncate font-display text-base font-semibold">{document.title}</h3>
          {document.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{document.description}</p>
          ) : null}
          {meta.length ? (
            <p className="text-xs text-muted-foreground">{meta.join(" · ")}</p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="rounded-lg">
              <Link to="/reader/$id" params={{ id: document.id }}>
                Buka
              </Link>
            </Button>
            <OfflineDownloadButton filePath={document.file_path} />
          </div>
        </div>
      </div>
    </article>
  );
}

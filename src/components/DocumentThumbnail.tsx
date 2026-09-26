import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { pdfStorageService } from "@/services/pdfStorageService";
import { cn } from "@/lib/utils";

export function DocumentThumbnail({
  thumbnailPath,
  title,
  className,
}: {
  thumbnailPath?: string | null;
  title: string;
  className?: string;
}) {
  const { data: url } = useQuery({
    queryKey: ["thumbnail", thumbnailPath],
    queryFn: () => pdfStorageService.getThumbnail(thumbnailPath),
    enabled: Boolean(thumbnailPath),
    staleTime: 30 * 60 * 1000,
  });

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-secondary",
        className ?? "size-14",
      )}
    >
      {url ? (
        <img src={url} alt={title} className="size-full object-cover" loading="lazy" />
      ) : (
        <FileText className="size-6 text-muted-foreground" />
      )}
    </div>
  );
}

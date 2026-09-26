import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Document, Page, pdfjs } from "react-pdf";
import { FileWarning, Loader2 } from "lucide-react";
import { toast } from "sonner";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { PageNavigation } from "./PageNavigation";
import { PdfToolbar } from "./PdfToolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pdfStorageService } from "@/services/pdfStorageService";
import { updateTotalPages } from "@/services/pdfService";
import { getProgress, saveProgress } from "@/services/readingProgressService";
import type { PdfDocument } from "@/services/types";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SAVE_DEBOUNCE_MS = 1200;

export function PdfReader({
  document: doc,
  initialPage,
}: {
  document: PdfDocument;
  initialPage?: number;
}) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [page, setPage] = useState(initialPage ?? 1);
  const [numPages, setNumPages] = useState(doc.total_pages ?? 0);
  const [scale, setScale] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [restored, setRestored] = useState(initialPage != null);

  const {
    data: fileUrl,
    isLoading: urlLoading,
    isError: urlError,
    refetch,
  } = useQuery({
    queryKey: ["pdf-url", doc.file_path, reloadKey],
    queryFn: () => pdfStorageService.getPdf(doc.file_path),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const { data: progress } = useQuery({
    queryKey: ["reading-progress", doc.id],
    queryFn: () => getProgress(doc.id),
    enabled: initialPage == null,
  });

  // Resume from the last saved page when no explicit page was requested.
  useEffect(() => {
    if (restored || initialPage != null) return;
    if (progress === undefined) return;
    if (progress?.current_page) setPage(progress.current_page);
    setRestored(true);
  }, [progress, restored, initialPage]);

  // Track container width for fit-width rendering.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(window.document.fullscreenElement));
    window.document.addEventListener("fullscreenchange", onChange);
    return () => window.document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Debounced progress persistence.
  useEffect(() => {
    if (!restored || !numPages) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgress({ pdfId: doc.id, currentPage: page, totalPages: numPages })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["recent-documents"] });
        })
        .catch(() => toast.error("Progress membaca gagal disimpan."));
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [page, numPages, doc.id, restored, queryClient]);

  const onLoadSuccess = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      setRenderError(null);
      setPage((current) => Math.min(Math.max(1, current), total));
      if (doc.total_pages !== total) {
        updateTotalPages(doc.id, total).catch(() => undefined);
      }
    },
    [doc.id, doc.total_pages],
  );

  const pageWidth = useMemo(() => {
    if (!containerWidth) return undefined;
    const base = Math.min(containerWidth, 900);
    return fitWidth ? base : base * scale;
  }, [containerWidth, fitWidth, scale]);

  const zoom = (delta: number) => {
    setFitWidth(false);
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number((s + delta).toFixed(2)))));
  };

  const toggleFullscreen = () => {
    const el = containerRef.current?.parentElement ?? window.document.documentElement;
    if (window.document.fullscreenElement) {
      window.document.exitFullscreen().catch(() => undefined);
    } else {
      el.requestFullscreen?.().catch(() => toast.error("Layar penuh tidak didukung."));
    }
  };

  const retry = () => {
    setRenderError(null);
    setReloadKey((k) => k + 1);
    refetch();
  };

  const failed = urlError || renderError;

  return (
    <div className="flex min-h-screen flex-col bg-reader">
      <PdfToolbar
        title={doc.title}
        pdfId={doc.id}
        pageNumber={page}
        isFullscreen={isFullscreen}
        onZoomIn={() => zoom(0.25)}
        onZoomOut={() => zoom(-0.25)}
        onFitWidth={() => {
          setFitWidth(true);
          setScale(1);
        }}
        onToggleFullscreen={toggleFullscreen}
      />

      <div ref={containerRef} className="mx-auto w-full max-w-3xl flex-1 px-3 pt-4 pb-24">
        {failed ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-reader-foreground/20 px-6 py-16 text-center text-reader-foreground">
            <FileWarning className="size-8 opacity-70" />
            <p className="font-display text-base font-semibold">PDF tidak dapat dimuat.</p>
            <p className="max-w-xs text-sm opacity-70">
              Periksa koneksi internet dan coba lagi.
            </p>
            <Button onClick={retry} className="mt-1">
              Coba Lagi
            </Button>
          </div>
        ) : urlLoading || !fileUrl ? (
          <Skeleton className="h-[70vh] w-full rounded-xl" />
        ) : (
          <Document
            key={reloadKey}
            file={fileUrl}
            onLoadSuccess={onLoadSuccess}
            onLoadError={() => setRenderError("load")}
            onSourceError={() => setRenderError("source")}
            loading={<Skeleton className="h-[70vh] w-full rounded-xl" />}
            error={<div />}
            className="pdf-page-canvas flex justify-center"
          >
            <Page
              pageNumber={page}
              width={pageWidth}
              renderAnnotationLayer={false}
              renderTextLayer
              onRenderError={() => setRenderError("render")}
              loading={
                <div className="grid h-[70vh] w-full place-items-center">
                  <Loader2 className="size-6 animate-spin text-reader-foreground/60" />
                </div>
              }
            />
          </Document>
        )}
      </div>

      <PageNavigation
        page={page}
        totalPages={numPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1))}
      />
    </div>
  );
}

export default PdfReader;

import "@/lib/mapPolyfill";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileWarning, Loader2 } from "lucide-react";
import { toast } from "sonner";
import "react-pdf/dist/Page/AnnotationLayer.css";

import { PageNavigation } from "./PageNavigation";
import { PdfToolbar } from "./PdfToolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pdfStorageService } from "@/services/pdfStorageService";
import { updateTotalPages } from "@/services/pdfService";
import { getProgress, saveProgress } from "@/services/readingProgressService";
import type { PdfDocument } from "@/services/types";

if (!pdfjs.GlobalWorkerOptions.workerPort) {
  pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("../lib/pdf.worker.ts", import.meta.url), { type: "module" });
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const clamp = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

export function PdfReader({ document: doc, initialPage }: { document: PdfDocument; initialPage?: number }) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
  const [page, setPage] = useState(initialPage ?? 1);
  const [numPages, setNumPages] = useState(doc.total_pages ?? 0);
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(0);
  const [progressPercent, setProgressPercent] = useState<number | null>(0);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [restored, setRestored] = useState(initialPage != null);
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", containScroll: false, watchDrag: (_, event) => !(event instanceof TouchEvent && event.touches.length > 1) });

  const { data: fileUrl, isLoading, isError } = useQuery({
    queryKey: ["pdf-url", doc.file_path, reloadKey],
    queryFn: () => pdfStorageService.getPdf(doc.file_path, setProgressPercent),
    retry: 1,
    staleTime: Infinity,
  });
  const { data: progress } = useQuery({
    queryKey: ["reading-progress", doc.id],
    queryFn: () => getProgress(doc.id),
    enabled: initialPage == null,
  });

  useEffect(() => {
    if (restored || initialPage != null || progress === undefined) return;
    if (progress?.current_page) setPage(progress.current_page);
    setRestored(true);
  }, [progress, restored, initialPage]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setWidth(entry.contentRect.width); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!embla) return;
    const selected = () => setPage(embla.selectedScrollSnap() + 1);
    embla.on("select", selected);
    return () => { embla.off("select", selected); };
  }, [embla]);

  useEffect(() => {
    if (embla && restored && numPages) embla.scrollTo(Math.max(0, Math.min(page - 1, numPages - 1)), true);
  }, [embla, restored, numPages]);

  useEffect(() => {
    if (!restored || !numPages) return;
    const timer = setTimeout(() => {
      saveProgress({ pdfId: doc.id, currentPage: page, totalPages: numPages })
        .then(() => queryClient.invalidateQueries({ queryKey: ["recent-documents"] }))
        .catch(() => toast.error("Progress membaca gagal disimpan."));
    }, 1200);
    return () => clearTimeout(timer);
  }, [page, numPages, doc.id, restored, queryClient]);

  const onLoadSuccess = useCallback(({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    setError(false);
    setPage((current) => Math.min(Math.max(1, current), total));
    if (doc.total_pages !== total) void updateTotalPages(doc.id, total).catch(() => undefined);
  }, [doc.id, doc.total_pages]);

  const goTo = (value: number) => {
    if (value < 1 || value > numPages) return;
    setPage(value);
    embla?.scrollTo(value - 1);
  };
  const distance = (touches: React.TouchList) => {
    const first = touches.item(0);
    const second = touches.item(1);
    if (!first || !second) return 0;
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  };
  const onTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) pinchRef.current = { distance: distance(event.touches), scale };
  };
  const onTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length !== 2 || !pinchRef.current) return;
    setScale(clamp(pinchRef.current.scale * distance(event.touches) / pinchRef.current.distance));
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-reader">
      <PdfToolbar pdfId={doc.id} pageNumber={page} />
      <div ref={containerRef} className="mx-auto w-full max-w-5xl flex-1 px-2 pt-12 pb-36 sm:px-4">
        {error || isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-reader-foreground">
            <FileWarning className="size-8 opacity-70" />
            <p className="font-display text-base font-semibold">PDF tidak dapat dimuat.</p>
            <p className="text-sm opacity-70">Periksa koneksi internet atau ruang penyimpanan, lalu coba lagi.</p>
            <Button onClick={() => { setError(false); setReloadKey((key) => key + 1); }}>Coba Lagi</Button>
          </div>
        ) : isLoading || !fileUrl ? (
          <div className="space-y-3" role="status" aria-label="Mengunduh PDF">
            <div className="flex items-center gap-2 text-sm text-reader-foreground"><Loader2 className="size-4 animate-spin" /> {progressPercent === null ? "Mengunduh PDF..." : `Mengunduh PDF ${progressPercent}%`}</div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progressPercent ?? 10}%` }} /></div>
            <Skeleton className="h-[65vh] w-full" />
          </div>
        ) : (
          <Document file={fileUrl} onLoadSuccess={onLoadSuccess} onLoadError={() => setError(true)} onSourceError={() => setError(true)} loading={<Skeleton className="h-[65vh] w-full" />} error={<div />}>
            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex touch-pan-y items-start">
                {Array.from({ length: numPages }, (_, index) => (
                  <div key={index} className="min-w-0 shrink-0 grow-0 basis-full overflow-auto">
                    {Math.abs(index + 1 - page) <= 1 ? (
                      <div className="pdf-page-canvas flex min-h-[50vh] justify-center" style={{ touchAction: "pan-y" }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => { pinchRef.current = null; }}>
                        <div className="origin-top transition-transform duration-150" style={{ transform: `scale(${scale})` }}>
                          <Page pageNumber={index + 1} {...(width ? { width: Math.min(width, 900) } : {})} renderAnnotationLayer={false} renderTextLayer={false} devicePixelRatio={Math.min(window.devicePixelRatio || 1, 2)} loading={<div className="grid h-[60vh] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>} onRenderError={() => setError(true)} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </Document>
        )}
      </div>
      <PageNavigation page={page} totalPages={numPages} onPrev={() => goTo(page - 1)} onNext={() => goTo(page + 1)} onJump={goTo} zoom={Math.round(scale * 100)} onZoomIn={() => setScale((value) => clamp(value + .25))} onZoomOut={() => setScale((value) => clamp(value - .25))} onFitWidth={() => setScale(1)} />
    </div>
  );
}

export default PdfReader;
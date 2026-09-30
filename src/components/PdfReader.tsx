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
  const pageViewportRef = useRef<HTMLDivElement>(null);
  const pageContentRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ distance: number; scale: number; offset: { x: number; y: number }; center: { x: number; y: number } } | null>(null);
  const dragRef = useRef<{ x: number; y: number; offset: { x: number; y: number } } | null>(null);
  const [page, setPage] = useState(initialPage ?? 1);
  const [numPages, setNumPages] = useState(doc.total_pages ?? 0);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pinching, setPinching] = useState(false);
  const [width, setWidth] = useState(0);
  const [progressPercent, setProgressPercent] = useState<number | null>(0);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [restored, setRestored] = useState(initialPage != null);
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", containScroll: false, watchDrag: scale <= 1 ? (_, event) => !(event instanceof TouchEvent && event.touches.length > 1) : false });

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
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setPage(value);
    embla?.scrollTo(value - 1);
  };
  const constrainedOffset = (next: { x: number; y: number }, zoom: number) => {
    const viewport = pageViewportRef.current;
    const content = pageContentRef.current;
    if (!viewport || !content) return next;
    const { clientWidth: viewWidth, clientHeight: viewHeight } = viewport;
    const baseWidth = content.offsetWidth;
    const baseHeight = content.offsetHeight;
    const baseX = (viewWidth - baseWidth) / 2;
    const scaledWidth = baseWidth * zoom;
    const scaledHeight = baseHeight * zoom;
    return {
      x: scaledWidth <= viewWidth
        ? (viewWidth - scaledWidth) / 2 - baseX
        : Math.max(viewWidth - scaledWidth - baseX, Math.min(-baseX, next.x)),
      y: scaledHeight <= viewHeight
        ? 0
        : Math.max(viewHeight - scaledHeight, Math.min(0, next.y)),
    };
  };
  const changeZoom = (next: number) => {
    const zoom = clamp(next);
    if (zoom === 1) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
      return;
    }
    const viewport = pageViewportRef.current;
    const content = pageContentRef.current;
    if (viewport && content) {
      const center = { x: viewport.clientWidth / 2 - (viewport.clientWidth - content.offsetWidth) / 2, y: viewport.clientHeight / 2 };
      const ratio = zoom / scale;
      setOffset(constrainedOffset({ x: center.x - (center.x - offset.x) * ratio, y: center.y - (center.y - offset.y) * ratio }, zoom));
    }
    setScale(zoom);
  };
  const distance = (touches: React.TouchList) => {
    const first = touches.item(0);
    const second = touches.item(1);
    if (!first || !second) return 0;
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  };
  const onTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      const viewport = pageViewportRef.current;
      const content = pageContentRef.current;
      if (!viewport || !content) return;
      const rect = viewport.getBoundingClientRect();
      const first = event.touches.item(0);
      const second = event.touches.item(1);
      if (!first || !second) return;
      const center = {
        x: (first.clientX + second.clientX) / 2 - rect.left - (viewport.clientWidth - content.offsetWidth) / 2,
        y: (first.clientY + second.clientY) / 2 - rect.top + viewport.scrollTop,
      };
      pinchRef.current = { distance: distance(event.touches), scale, offset, center };
      dragRef.current = null;
      setPinching(true);
    } else if (event.touches.length === 1 && scale > 1) {
      const touch = event.touches.item(0);
      if (touch) dragRef.current = { x: touch.clientX, y: touch.clientY, offset };
    }
  };
  const onTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length === 2 && pinchRef.current) {
      const { center, offset: start, distance: initialDistance, scale: initialScale } = pinchRef.current;
      if (!initialDistance) return;
      const zoom = clamp(initialScale * distance(event.touches) / initialDistance);
      const ratio = zoom / initialScale;
      setOffset(constrainedOffset({ x: center.x - (center.x - start.x) * ratio, y: center.y - (center.y - start.y) * ratio }, zoom));
      setScale(zoom);
    } else if (event.touches.length === 1 && dragRef.current && scale > 1) {
      const touch = event.touches.item(0);
      if (!touch) return;
      setOffset(constrainedOffset({ x: dragRef.current.offset.x + touch.clientX - dragRef.current.x, y: dragRef.current.offset.y + touch.clientY - dragRef.current.y }, scale));
    }
  };
  const onTouchEnd = () => { pinchRef.current = null; dragRef.current = null; setPinching(false); };

  return (
    <div className="relative h-dvh overflow-hidden bg-reader">
      <PdfToolbar pdfId={doc.id} pageNumber={page} title={doc.title} />
      <div ref={containerRef} className="reader-stage mx-auto w-full overflow-hidden pt-[calc(env(safe-area-inset-top,0px)+3rem)]">
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
            <div ref={emblaRef} className="h-full overflow-hidden">
              <div className="flex h-full items-start">
                {Array.from({ length: numPages }, (_, index) => (
                  <div key={index} className="h-full min-w-0 shrink-0 grow-0 basis-full overflow-hidden">
                    {Math.abs(index + 1 - page) <= 1 ? (
                      <div ref={index + 1 === page ? pageViewportRef : null} className={`pdf-page-canvas h-full w-full overflow-hidden ${scale > 1 ? "cursor-grab touch-none active:cursor-grabbing" : "overflow-y-auto touch-pan-y"}`} onTouchStart={index + 1 === page ? onTouchStart : undefined} onTouchMove={index + 1 === page ? onTouchMove : undefined} onTouchEnd={index + 1 === page ? onTouchEnd : undefined} onTouchCancel={index + 1 === page ? onTouchEnd : undefined} onPointerDown={index + 1 === page && scale > 1 ? (event) => { if (event.pointerType !== "mouse") return; event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY, offset }; } : undefined} onPointerMove={index + 1 === page && scale > 1 ? (event) => { if (event.pointerType !== "mouse" || !dragRef.current) return; setOffset(constrainedOffset({ x: dragRef.current.offset.x + event.clientX - dragRef.current.x, y: dragRef.current.offset.y + event.clientY - dragRef.current.y }, scale)); } : undefined} onPointerUp={() => { dragRef.current = null; }}>
                        <div ref={index + 1 === page ? pageContentRef : null} className={`mx-auto w-max origin-top-left ${pinching || scale > 1 ? "" : "transition-transform duration-150"}`} style={index + 1 === page ? { transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` } : undefined}>
                          <Page pageNumber={index + 1} {...(width ? { width: Math.min(width - (width < 640 ? 16 : 32), 900) } : {})} renderAnnotationLayer={false} renderTextLayer={false} devicePixelRatio={Math.min(window.devicePixelRatio || 1, 2)} loading={<div className="grid h-[60vh] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>} onRenderError={() => setError(true)} />
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
      <PageNavigation page={page} totalPages={numPages} onPrev={() => goTo(page - 1)} onNext={() => goTo(page + 1)} onJump={goTo} zoom={Math.round(scale * 100)} onZoomIn={() => changeZoom(scale + .25)} onZoomOut={() => changeZoom(scale - .25)} onFitWidth={() => changeZoom(1)} />
    </div>
  );
}

export default PdfReader;
import "@/lib/mapPolyfill";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import { Document, pdfjs } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getCachedPage, putCachedPage, renderPageToBlob } from "@/lib/pageRenderCache";
import { FileWarning, Loader2 } from "lucide-react";
import { toast } from "sonner";
import "react-pdf/dist/Page/AnnotationLayer.css";

import { PageNavigation } from "./PageNavigation";
import { PdfToolbar } from "./PdfToolbar";
import { OutlineSheet, type OutlineNode } from "./OutlineSheet";
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
const pageLoading = <div className="min-h-[60vh] w-full bg-background" />;

// Cached page image: stays mounted once ready; zoom scales the image via CSS (no re-render).
const CachedPdfPage = memo(function CachedPdfPage({ url, width, number }: { url: string | undefined; width: number; number: number }) {
  if (!url) return pageLoading;
  return <img src={url} alt={`Halaman ${number}`} width={width} style={{ width }} draggable={false} decoding="async" className="block max-w-none select-none" />;
});

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
  const [outline, setOutline] = useState<OutlineNode[]>([]);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [pinching, setPinching] = useState(false);
  const [width, setWidth] = useState(0);
  const [progressPercent, setProgressPercent] = useState<number | null>(0);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [restored, setRestored] = useState(initialPage != null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [urls, setUrls] = useState<Record<number, string>>({});
  const pageRef = useRef(page);
  pageRef.current = page;
  const renderWidth = width ? Math.round(Math.min(width, 1200)) : 0;
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

  const onLoadSuccess = useCallback((proxy: PDFDocumentProxy) => {
    const total = proxy.numPages;
    setPdf(proxy);
    setNumPages(total);
    setError(false);
    setPage((current) => Math.min(Math.max(1, current), total));
    if (doc.total_pages !== total) void updateTotalPages(doc.id, total).catch(() => undefined);
  }, [doc.id, doc.total_pages]);

  // Fill page images: cache hit first, otherwise render once with pdf.js and store.
  // Order: current page, then outward neighbours, progressively the whole document.
  useEffect(() => {
    if (!pdf || !renderWidth || !numPages) return;
    let cancelled = false;
    const created: string[] = [];
    const done = new Set<number>();
    setUrls({});
    const nextPage = () => {
      const current = pageRef.current;
      for (let d = 0; d < numPages; d++) {
        for (const n of [current + d, current - d]) if (n >= 1 && n <= numPages && !done.has(n)) return n;
      }
      return 0;
    };
    void (async () => {
      while (!cancelled) {
        const n = nextPage();
        if (!n) break;
        done.add(n);
        try {
          let blob = await getCachedPage(doc.id, n, renderWidth);
          if (!blob) {
            blob = await renderPageToBlob(pdf, n, renderWidth);
            void putCachedPage(doc.id, n, renderWidth, blob);
          }
          if (cancelled) break;
          const url = URL.createObjectURL(blob);
          created.push(url);
          setUrls((prev) => ({ ...prev, [n]: url }));
        } catch {
          if (!cancelled && n === pageRef.current) setError(true);
        }
        if (Math.abs(n - pageRef.current) > 2) await new Promise((r) => setTimeout(r, 40));
      }
    })();
    return () => { cancelled = true; created.forEach((u) => URL.revokeObjectURL(u)); };
  }, [pdf, renderWidth, numPages, doc.id]);

  // Read the PDF's built-in outline (table of contents) and resolve each entry to a page number.
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    type RawItem = { title: string; dest: unknown; items: RawItem[] };
    const resolvePage = async (dest: unknown): Promise<number | null> => {
      try {
        const explicit = typeof dest === "string" ? await pdf.getDestination(dest) : dest;
        if (!Array.isArray(explicit) || !explicit[0]) return null;
        const ref = explicit[0];
        if (typeof ref === "number") return ref + 1;
        return (await pdf.getPageIndex(ref)) + 1;
      } catch {
        return null;
      }
    };
    const build = (items: RawItem[]): Promise<OutlineNode[]> =>
      Promise.all(items.map(async (item) => ({ title: item.title, page: await resolvePage(item.dest), children: await build(item.items ?? []) })));
    void pdf.getOutline().then(async (raw) => {
      const nodes = raw ? await build(raw as unknown as RawItem[]) : [];
      if (!cancelled) setOutline(nodes);
    }).catch(() => { if (!cancelled) setOutline([]); });
    return () => { cancelled = true; };
  }, [pdf]);

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
  const contentPoint = (clientX: number, clientY: number) => {
    const viewport = pageViewportRef.current;
    const content = pageContentRef.current;
    if (!viewport || !content) return null;
    const rect = viewport.getBoundingClientRect();
    return {
      x: clientX - rect.left - (viewport.clientWidth - content.offsetWidth) / 2,
      y: clientY - rect.top + viewport.scrollTop,
    };
  };
  const toggleZoomAt = (clientX: number, clientY: number) => {
    if (scale > 1) { setScale(1); setOffset({ x: 0, y: 0 }); return; }
    const point = contentPoint(clientX, clientY);
    if (!point) return;
    const zoom = 2;
    const ratio = zoom / scale;
    setOffset(constrainedOffset({ x: point.x - (point.x - offset.x) * ratio, y: point.y - (point.y - offset.y) * ratio }, zoom));
    setScale(zoom);
  };
  const tapRef = useRef<{ x: number; y: number; time: number; moved: boolean; multi: boolean } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const overshootRef = useRef(0);
  const onTouchStart = (event: React.TouchEvent) => {
    const firstTouch = event.touches.item(0);
    if (event.touches.length === 1 && firstTouch) tapRef.current = { x: firstTouch.clientX, y: firstTouch.clientY, time: Date.now(), moved: false, multi: false };
    else if (tapRef.current) tapRef.current.multi = true;
    overshootRef.current = 0;
    if (event.touches.length === 2) {
      const first = event.touches.item(0);
      const second = event.touches.item(1);
      if (!first || !second) return;
      const center = contentPoint((first.clientX + second.clientX) / 2, (first.clientY + second.clientY) / 2);
      if (!center) return;
      pinchRef.current = { distance: distance(event.touches), scale, offset, center };
      dragRef.current = null;
      setPinching(true);
    } else if (event.touches.length === 1 && scale > 1) {
      const touch = event.touches.item(0);
      if (touch) dragRef.current = { x: touch.clientX, y: touch.clientY, offset };
    }
  };
  const onTouchMove = (event: React.TouchEvent) => {
    const t = event.touches.item(0);
    if (tapRef.current && t && Math.hypot(t.clientX - tapRef.current.x, t.clientY - tapRef.current.y) > 10) tapRef.current.moved = true;
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
      const desired = { x: dragRef.current.offset.x + touch.clientX - dragRef.current.x, y: dragRef.current.offset.y + touch.clientY - dragRef.current.y };
      const next = constrainedOffset(desired, scale);
      // Distance pushed past the left/right edge of the zoomed page.
      overshootRef.current = desired.x - next.x;
      setOffset(next);
    }
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    const overshoot = overshootRef.current;
    const tap = tapRef.current;
    pinchRef.current = null; dragRef.current = null; overshootRef.current = 0; setPinching(false);
    if (event.touches.length > 0) return;
    tapRef.current = null;
    if (scale > 1 && Math.abs(overshoot) > 70) {
      goTo(overshoot > 0 ? page - 1 : page + 1);
      return;
    }
    if (!tap || tap.moved || tap.multi || Date.now() - tap.time > 250) return;
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && now - last.time < 300 && Math.hypot(tap.x - last.x, tap.y - last.y) < 40) {
      lastTapRef.current = null;
      event.preventDefault();
      toggleZoomAt(tap.x, tap.y);
    } else {
      lastTapRef.current = { x: tap.x, y: tap.y, time: now };
    }
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-reader">
      <PdfToolbar pdfId={doc.id} pageNumber={page} title={doc.title} hasOutline={outline.length > 0} onOpenOutline={() => setOutlineOpen(true)} />
      <OutlineSheet open={outlineOpen} onOpenChange={setOutlineOpen} outline={outline} onSelect={goTo} />
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
                     {(
                      <div ref={index + 1 === page ? pageViewportRef : null} className={`pdf-page-canvas h-full w-full overflow-hidden ${scale > 1 ? "cursor-grab touch-none active:cursor-grabbing" : "overflow-y-auto touch-pan-y"}`} onTouchStart={index + 1 === page ? onTouchStart : undefined} onTouchMove={index + 1 === page ? onTouchMove : undefined} onTouchEnd={index + 1 === page ? onTouchEnd : undefined} onTouchCancel={index + 1 === page ? onTouchEnd : undefined} onPointerDown={index + 1 === page && scale > 1 ? (event) => { if (event.pointerType !== "mouse") return; event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY, offset }; } : undefined} onPointerMove={index + 1 === page && scale > 1 ? (event) => { if (event.pointerType !== "mouse" || !dragRef.current) return; setOffset(constrainedOffset({ x: dragRef.current.offset.x + event.clientX - dragRef.current.x, y: dragRef.current.offset.y + event.clientY - dragRef.current.y }, scale)); } : undefined} onPointerUp={() => { dragRef.current = null; }} onDoubleClick={index + 1 === page ? (event) => toggleZoomAt(event.clientX, event.clientY) : undefined}>
                        <div ref={index + 1 === page ? pageContentRef : null} className={`mx-auto w-max origin-top-left ${pinching || scale > 1 ? "" : "transition-transform duration-150"}`} style={index + 1 === page ? { transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` } : undefined}>
                            <CachedPdfPage number={index + 1} width={renderWidth} url={urls[index + 1]} />
                        </div>
                      </div>
                    )}
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
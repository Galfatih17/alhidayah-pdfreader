import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Home, ListOrdered } from "lucide-react";
import { MushafPage } from "@/components/MushafPage";
import { TOTAL_PAGES, juzOfPage, surahOfPage } from "@/lib/quran";
import { isBookmarked, setLastRead, toggleBookmark, useBookmarks } from "@/lib/quranStore";

export const Route = createFileRoute("/mushaf/$page")({
  head: ({ params }) => ({
    meta: [
      { title: `Mushaf Halaman ${params.page} — Alhidayah` },
      { name: "description", content: `Baca halaman ${params.page} mushaf Al-Qur'an standar 604 halaman.` },
      { property: "og:title", content: `Mushaf Halaman ${params.page} — Alhidayah` },
      { property: "og:description", content: `Baca halaman ${params.page} mushaf Al-Qur'an.` },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MushafReader,
});

const PAGES = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

function MushafReader() {
  const { page: param } = Route.useParams();
  const navigate = useNavigate();
  const start = Math.min(TOTAL_PAGES, Math.max(1, Number(param) || 1));
  const [page, setPage] = useState(start);
  const [ui, setUi] = useState(true);
  const bookmarks = useBookmarks();
  const [ref, api] = useEmblaCarousel({ direction: "rtl", startIndex: start - 1, duration: 22 });

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setPage(api.selectedScrollSnap() + 1);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (api && api.selectedScrollSnap() !== start - 1) api.scrollTo(start - 1, true);
  }, [api, start]);

  useEffect(() => {
    const surah = surahOfPage(page);
    setLastRead({ page, surah: surah.n });
    const t = setTimeout(() => {
      navigate({ to: "/mushaf/$page", params: { page: String(page) }, replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [page, navigate]);

  const go = useCallback((p: number) => api?.scrollTo(Math.min(TOTAL_PAGES, Math.max(1, p)) - 1), [api]);
  const surah = surahOfPage(page);
  const marked = isBookmarked(bookmarks, { page });

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <div ref={ref} className="h-full overflow-hidden" dir="rtl" onClick={() => setUi((v) => !v)}>
        <div className="flex h-full touch-pan-y">
          {PAGES.map((p) => (
            <div key={p} className="h-full min-w-0 flex-[0_0_100%] overflow-y-auto overscroll-contain">
              {Math.abs(p - page) <= 2 ? <MushafPage page={p} active /> : null}
            </div>
          ))}
        </div>
      </div>

      <header
        className={`absolute inset-x-0 top-0 flex items-center gap-2 border-b border-border bg-background/90 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md transition-transform duration-200 ${ui ? "" : "-translate-y-full"}`}
      >
        <Link to="/" className="grid size-10 place-items-center rounded-full hover:bg-accent" aria-label="Beranda">
          <Home className="size-5" />
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold text-foreground">{surah.lat}</p>
          <p className="text-xs text-muted-foreground">Juz {juzOfPage(page)} · Hlm {page}</p>
        </div>
        <Link to="/surah/$id" params={{ id: String(surah.n) }} className="grid size-10 place-items-center rounded-full hover:bg-accent" aria-label="Mode per ayat" title="Mode per ayat & terjemahan">
          <ListOrdered className="size-5" />
        </Link>
        <button
          onClick={() => toggleBookmark({ page, surah: surah.n, label: `${surah.lat} · Hlm ${page}` })}
          className="grid size-10 place-items-center rounded-full text-primary hover:bg-accent"
          aria-label="Bookmark halaman"
        >
          {marked ? <BookmarkCheck className="size-5 fill-current" /> : <Bookmark className="size-5" />}
        </button>
      </header>

      <div
        className={`app-nav-bottom absolute inset-x-0 mx-auto flex w-max items-center gap-1 rounded-full border border-border bg-background/60 p-1 shadow-lg backdrop-blur-md transition-all duration-200 ${ui ? "" : "pointer-events-none translate-y-6 opacity-0"}`}
      >
        <button onClick={() => go(page + 1)} className="grid size-10 place-items-center rounded-full hover:bg-accent" aria-label="Halaman berikutnya">
          <ChevronLeft className="size-5" />
        </button>
        <input
          type="number"
          min={1}
          max={TOTAL_PAGES}
          key={page}
          defaultValue={page}
          onKeyDown={(e) => e.key === "Enter" && go(Number((e.target as HTMLInputElement).value))}
          className="w-16 rounded-full bg-transparent text-center text-sm outline-none"
          aria-label="Nomor halaman"
        />
        <button onClick={() => go(page - 1)} className="grid size-10 place-items-center rounded-full hover:bg-accent" aria-label="Halaman sebelumnya">
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}

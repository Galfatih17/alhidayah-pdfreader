import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, BookmarkCheck, BookOpen, Copy } from "lucide-react";
import { toast } from "sonner";
import { BISMILLAH_TEXT, fetchSurah, showBismillah, surahOf, toArabicDigits } from "@/lib/quran";
import { isBookmarked, setLastRead, toggleBookmark, useBookmarks } from "@/lib/quranStore";

export const Route = createFileRoute("/surah/$id")({
  head: ({ params }) => {
    const s = surahOf(Number(params.id)) ?? surahOf(1);
    const title = `Surah ${s.lat} (${s.id}) — Alhidayah`;
    const desc = `Baca Surah ${s.lat}, ${s.ayat} ayat, teks Arab per ayat dengan terjemahan Bahasa Indonesia.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SurahPage,
});

function SurahPage() {
  const { id } = Route.useParams();
  const n = Math.min(114, Math.max(1, Number(id) || 1));
  const s = surahOf(n);
  const bookmarks = useBookmarks();
  const { data, isError, refetch } = useQuery({ queryKey: ["quran-surah", n], queryFn: () => fetchSurah(n), staleTime: Infinity });

  useEffect(() => {
    setLastRead({ page: s.page, surah: n });
  }, [n, s.page]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/90 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md">
        <Link to="/" className="grid size-10 place-items-center rounded-full hover:bg-accent" aria-label="Kembali">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{s.lat}</p>
          <p className="text-xs text-muted-foreground">{s.id} · {s.ayat} ayat · {s.type}</p>
        </div>
        <Link to="/mushaf/$page" params={{ page: String(s.page) }} className="grid size-10 place-items-center rounded-full hover:bg-accent" aria-label="Mode halaman mushaf" title="Mode halaman mushaf">
          <BookOpen className="size-5" />
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4">
        <div className="my-6 rounded-2xl bg-primary p-6 text-center text-primary-foreground">
          <p className="font-quran text-3xl" dir="rtl">{s.ar}</p>
          <p className="mt-1 text-sm opacity-80">{s.lat} · {s.id}</p>
          {showBismillah(n) && <p className="font-quran mt-4 text-2xl" dir="rtl">{BISMILLAH_TEXT}</p>}
        </div>

        {isError && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Surah belum tersimpan. Periksa koneksi internet.
            <button onClick={() => refetch()} className="ml-2 text-primary underline">Coba lagi</button>
          </div>
        )}
        {!data && !isError && <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>}

        <ol className="divide-y divide-border">
          {data?.map((a) => {
            const marked = isBookmarked(bookmarks, { page: a.page, surah: n, ayah: a.numberInSurah });
            return (
              <li key={a.number} className="py-5">
                <div className="mb-3 flex items-center gap-1">
                  <span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{a.numberInSurah}</span>
                  <span className="flex-1 text-xs text-muted-foreground">Juz {a.juz} · Hlm {a.page}{a.sajda ? " · Sajdah" : ""}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`${a.text}\n\n${a.translation ?? ""}\n(QS. ${s.lat}: ${a.numberInSurah})`);
                      toast.success("Ayat disalin");
                    }}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                    aria-label="Salin ayat"
                  >
                    <Copy className="size-4" />
                  </button>
                  <button
                    onClick={() => toggleBookmark({ page: a.page, surah: n, ayah: a.numberInSurah, label: `${s.lat} : ${a.numberInSurah}` })}
                    className="grid size-8 place-items-center rounded-full text-primary hover:bg-accent"
                    aria-label="Bookmark ayat"
                  >
                    {marked ? <BookmarkCheck className="size-4 fill-current" /> : <Bookmark className="size-4" />}
                  </button>
                </div>
                <p dir="rtl" className="font-quran text-right text-[1.7rem] leading-[2.4] text-foreground">
                  {a.text} <span className="text-lg text-primary">﴿{toArabicDigits(a.numberInSurah)}﴾</span>
                </p>
                {a.translation && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a.translation}</p>}
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex justify-between gap-3">
          {n > 1 ? <Link to="/surah/$id" params={{ id: String(n - 1) }} className="rounded-full border border-border px-4 py-2 text-sm">← {surahOf(n - 1).lat}</Link> : <span />}
          {n < 114 && <Link to="/surah/$id" params={{ id: String(n + 1) }} className="rounded-full border border-border px-4 py-2 text-sm">{surahOf(n + 1).lat} →</Link>}
        </div>
      </main>
    </div>
  );
}

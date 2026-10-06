import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Search } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";
import { JUZ, SURAHS, surahOf, surahOfPage } from "@/lib/quran";
import { useLastRead } from "@/lib/quranStore";

const TITLE = "Alhidayah — Mushaf Al-Qur'an Digital";
const DESC = "Baca Al-Qur'an per halaman mushaf atau per ayat dengan terjemahan, lengkap indeks surah dan juz, bisa offline.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<"surah" | "juz">("surah");
  const [q, setQ] = useState("");
  const last = useLastRead();

  const surahs = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!s) return SURAHS;
    return SURAHS.filter(
      (x) => String(x.n) === s || x.lat.toLowerCase().replace(/[^a-z0-9]/g, "").includes(s) || x.id.toLowerCase().includes(q.trim().toLowerCase()),
    );
  }, [q]);

  return (
    <div className="app-shell min-h-screen pb-28">
      <header className="mx-auto max-w-3xl px-4 pt-6">
        <p className="text-sm text-muted-foreground">Assalamu'alaikum</p>
        <h1 className="text-2xl font-semibold text-foreground">Alhidayah</h1>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        {last && (
          <Link
            to="/mushaf/$page"
            params={{ page: String(last.page) }}
            className="flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground shadow-md"
          >
            <BookOpen className="size-8 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs opacity-80">Terakhir dibaca</p>
              <p className="truncate text-lg font-semibold">
                {(last.surah ? surahOf(last.surah) : surahOfPage(last.page)).lat}
              </p>
              <p className="text-sm opacity-80">Halaman {last.page}</p>
            </div>
          </Link>
        )}

        <div className="flex rounded-full bg-muted p-1">
          {(["surah", "juz"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {t === "surah" ? "Surah" : "Juz"}
            </button>
          ))}
        </div>

        {tab === "surah" ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau nomor surah..." className="h-11 rounded-full pl-9" />
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {surahs.map((s) => (
                <li key={s.n} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{s.n}</span>
                  <Link to="/mushaf/$page" params={{ page: String(s.page) }} className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{s.lat}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.id} · {s.ayat} ayat · {s.type} · hlm {s.page}
                    </p>
                  </Link>
                  <Link to="/surah/$id" params={{ id: String(s.n) }} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground" title="Baca per ayat">
                    Ayat
                  </Link>
                  <span className="font-quran w-16 text-right text-xl text-primary" dir="rtl">{s.ar}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {JUZ.map((j) => (
              <li key={j.n}>
                <Link to="/mushaf/$page" params={{ page: String(j.page) }} className="block rounded-2xl border border-border bg-card p-4">
                  <p className="font-semibold text-foreground">Juz {j.n}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {surahOf(j.s).lat} : {j.a}
                  </p>
                  <p className="text-xs text-muted-foreground">Halaman {j.page}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
}

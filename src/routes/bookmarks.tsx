import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { removeBookmark, useBookmarks } from "@/lib/quranStore";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmark — Alhidayah" },
      { name: "description", content: "Halaman dan ayat Al-Qur'an yang kamu tandai." },
      { property: "og:title", content: "Bookmark — Alhidayah" },
      { property: "og:description", content: "Halaman dan ayat Al-Qur'an yang kamu tandai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const list = useBookmarks();
  return (
    <div className="app-shell min-h-screen pb-28">
      <header className="mx-auto max-w-3xl px-4 pt-6">
        <h1 className="text-2xl font-semibold text-foreground">Bookmark</h1>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5">
        {list.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Belum ada bookmark. Tandai halaman atau ayat saat membaca.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {list.map((b) => (
              <li key={`${b.page}-${b.surah}-${b.ayah}`} className="flex items-center gap-3 px-4 py-3">
                {b.ayah && b.surah ? (
                  <Link to="/surah/$id" params={{ id: String(b.surah) }} className="flex-1 font-medium text-foreground">{b.label}</Link>
                ) : (
                  <Link to="/mushaf/$page" params={{ page: String(b.page) }} className="flex-1 font-medium text-foreground">{b.label}</Link>
                )}
                <button onClick={() => removeBookmark(b)} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent" aria-label="Hapus bookmark">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
}

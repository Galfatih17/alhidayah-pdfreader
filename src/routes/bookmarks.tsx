import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { BookmarkList } from "@/components/BookmarkList";
import { BottomNavigation } from "@/components/BottomNavigation";
import { SearchBar } from "@/components/SearchBar";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmark — PDF Reader" },
      { name: "description", content: "Semua halaman penting yang kamu tandai saat membaca." },
      { property: "og:title", content: "Bookmark — PDF Reader" },
      {
        property: "og:description",
        content: "Semua halaman penting yang kamu tandai saat membaca.",
      },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);

  return (
    <div className="app-shell min-h-screen">
      <AppHeader subtitle="Halaman yang ditandai" />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        <SearchBar value={query} onChange={setQuery} placeholder="Cari bookmark..." />
        <BookmarkList query={debounced} />
      </main>
      <BottomNavigation />
    </div>
  );
}

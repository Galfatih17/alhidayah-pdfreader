import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { MainTabs } from "@/components/MainTabs";
import { SearchBar } from "@/components/SearchBar";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDF Reader — Baca & Lanjutkan Dokumen" },
      {
        name: "description",
        content:
          "Baca dokumen PDF di ponsel, lanjutkan dari halaman terakhir, dan simpan bookmark halaman penting.",
      },
      { property: "og:title", content: "PDF Reader — Baca & Lanjutkan Dokumen" },
      {
        property: "og:description",
        content:
          "Baca dokumen PDF di ponsel, lanjutkan dari halaman terakhir, dan simpan bookmark halaman penting.",
      },
       { property: "og:type", content: "website" },
       { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);

  return (
    <div className="app-shell min-h-screen">
      <AppHeader subtitle="Lanjutkan membaca" />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        <SearchBar value={query} onChange={setQuery} />
        <MainTabs query={debounced} />
      </main>
      <BottomNavigation />
    </div>
  );
}

import { lazy, Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { LocalPdfHistory } from "@/components/LocalPdfHistory";
import { LocalPdfPicker } from "@/components/LocalPdfPicker";
import { MainTabs } from "@/components/MainTabs";
import { SearchBar } from "@/components/SearchBar";
import { useLocalPdfActions } from "@/hooks/useLocalPdfActions";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

const PdfReader = lazy(() =>
  import("@/components/PdfReader").then((module) => ({ default: module.PdfReader })),
);

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
  const { localPdf, saving, openingId, saveAndOpen, openFromHistory, closeLocal } =
    useLocalPdfActions();

  if (localPdf) {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-reader" />}>
        <PdfReader
          document={localPdf.document}
          localFile={localPdf.file}
          onCloseLocal={closeLocal}
        />
      </Suspense>
    );
  }

  return (
    <div className="app-shell min-h-screen">
      <AppHeader subtitle="Lanjutkan membaca" />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        <LocalPdfPicker onSelect={saveAndOpen} className="h-12 w-full gap-2" disabled={saving} />
        <p className="-mt-3 text-center text-xs text-muted-foreground">
          PDF disimpan di perangkat ini dan tidak diunggah.
        </p>
        <LocalPdfHistory onOpen={openFromHistory} openingId={openingId} />
        <SearchBar value={query} onChange={setQuery} />
        <MainTabs query={debounced} />
      </main>
      <BottomNavigation />
    </div>
  );
}

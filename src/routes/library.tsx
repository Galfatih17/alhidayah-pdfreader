import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Library as LibraryIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { pdfStorageService } from "@/services/pdfStorageService";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { EmptyState } from "@/components/EmptyState";
import { PdfCard } from "@/components/PdfCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { listDocuments } from "@/services/pdfService";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — PDF Reader" },
      { name: "description", content: "Semua dokumen PDF yang tersedia untuk dibaca." },
      { property: "og:title", content: "Library — PDF Reader" },
      {
        property: "og:description",
        content: "Semua dokumen PDF yang tersedia untuk dibaca.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const debounced = useDebouncedValue(query, 250);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pdf-documents"],
    queryFn: listDocuments,
  });

  const [downloading, setDownloading] = useState(false);
  const downloadAll = async () => {
    if (!data?.length) return;
    setDownloading(true);
    let failed = 0;
    for (const doc of data) {
      try {
        await pdfStorageService.downloadPdf(doc.file_path);
      } catch {
        failed++;
      }
    }
    setDownloading(false);
    if (failed) toast.error(`${failed} dokumen gagal diunduh.`);
    else toast.success("Semua PDF tersimpan untuk dibaca offline.");
  };

  const term = debounced.trim().toLowerCase();
  const filtered = (data ?? []).filter((doc) =>
    term ? `${doc.title} ${doc.description ?? ""}`.toLowerCase().includes(term) : true,
  );
  const shown = filtered.slice(0, visible);

  return (
    <div className="app-shell min-h-screen">
      <AppHeader subtitle="Semua dokumen" />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        <SearchBar value={query} onChange={setQuery} />
        {data?.length ? (
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={downloading}
            onClick={downloadAll}
          >
            {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {downloading ? "Mengunduh semua PDF..." : "Unduh semua untuk offline"}
          </Button>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={LibraryIcon}
            title="Gagal memuat dokumen"
            description="Periksa koneksi internet dan coba lagi."
          />
        ) : !filtered.length ? (
          term ? (
            <EmptyState icon={LibraryIcon} title="Dokumen tidak ditemukan." />
          ) : (
            <EmptyState
              icon={LibraryIcon}
              title="Belum ada dokumen."
              description="Tambahkan file PDF terlebih dahulu untuk mulai membaca."
              action={
                <Button asChild size="sm" className="mt-1">
                  <Link to="/admin">Tambah dokumen</Link>
                </Button>
              }
            />
          )
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {shown.map((doc) => (
                <PdfCard key={doc.id} document={doc} />
              ))}
            </div>
            {filtered.length > shown.length ? (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Muat lebih banyak
                </Button>
              </div>
            ) : null}
          </>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
}

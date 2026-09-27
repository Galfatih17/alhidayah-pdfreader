import { Suspense, lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { FileWarning } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/lib/useHydrated";
import { getDocument } from "@/services/pdfService";

const PdfReader = lazy(() =>
  import("@/components/PdfReader").then((m) => ({ default: m.PdfReader })),
);

const searchSchema = z.object({
  page: fallback(z.number().int(), 0).default(0),
});

export const Route = createFileRoute("/reader/$id")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Baca Dokumen — PDF Reader" },
      { name: "description", content: "Baca dokumen PDF, simpan progress, dan tandai halaman." },
      { property: "og:title", content: "Baca Dokumen — PDF Reader" },
      {
        property: "og:description",
        content: "Baca dokumen PDF, simpan progress, dan tandai halaman.",
      },
    ],
  }),
  component: ReaderPage,
});

function ReaderLoading() {
  return (
    <div className="min-h-screen bg-reader p-4">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="mt-4 h-[70vh] w-full rounded-xl" />
    </div>
  );
}

function ReaderPage() {
  const { id } = Route.useParams();
  const { page } = Route.useSearch();
  const hydrated = useHydrated();

  const { data: document, isLoading, isError } = useQuery({
    queryKey: ["pdf-document", id],
    queryFn: () => getDocument(id),
  });

  if (isLoading || !hydrated) return <ReaderLoading />;

  if (isError || !document) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-reader px-6 text-center text-reader-foreground">
        <FileWarning className="size-8 opacity-70" />
        <p className="font-display text-lg font-semibold">Dokumen tidak ditemukan.</p>
        <p className="max-w-xs text-sm opacity-70">
          Dokumen mungkin sudah dihapus. Kembali ke library untuk memilih dokumen lain.
        </p>
        <Button asChild className="mt-2">
          <Link to="/library">Buka Library</Link>
        </Button>
      </div>
    );
  }

  const clampedPage = page && page > 0 ? page : undefined;

  return (
    <Suspense fallback={<ReaderLoading />}>
      <PdfReader
        document={document}
        {...(clampedPage !== undefined ? { initialPage: clampedPage } : {})}
      />
    </Suspense>
  );
}

import { BookmarkButton } from "./BookmarkButton";

export function PdfToolbar({
  pdfId,
  pageNumber,
}: {
  pdfId: string;
  pageNumber: number;
}) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 text-reader-foreground">
      <div className="mx-auto flex max-w-3xl justify-end p-2">
        <div className="pointer-events-auto rounded-lg bg-background/90 shadow-sm backdrop-blur-md">
          <BookmarkButton pdfId={pdfId} pageNumber={pageNumber} />
        </div>
      </div>
    </header>
  );
}

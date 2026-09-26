export function ReadingProgressBar({
  currentPage,
  totalPages,
  percentage,
}: {
  currentPage: number;
  totalPages?: number | null;
  percentage: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Halaman {currentPage}
        {totalPages ? ` dari ${totalPages}` : ""} · {percentage}%
      </p>
    </div>
  );
}

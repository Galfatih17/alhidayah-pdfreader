import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar({
  value,
  onChange,
  placeholder = "Cari dokumen...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        inputMode="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Cari dokumen"
        className="h-12 rounded-xl border-border bg-card pr-10 pl-10 text-base shadow-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Bersihkan pencarian"
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

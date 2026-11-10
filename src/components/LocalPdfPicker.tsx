import { useRef } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MAX_PDF_BYTES } from "@/services/pdfService";

export function LocalPdfPicker({
  onSelect,
  className,
  disabled = false,
}: {
  onSelect: (file: File) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Pilih file PDF yang valid.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error("Ukuran PDF maksimal 500 MB.");
      return;
    }

    void onSelect(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-label="Pilih file PDF dari perangkat"
        disabled={disabled}
        onChange={handleChange}
      />
      <Button
        type="button"
        className={className}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {disabled ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
        {disabled ? "Menyimpan PDF..." : "Buka PDF dari perangkat"}
      </Button>
    </>
  );
}

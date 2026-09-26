import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatFileSize } from "@/lib/format";
import { deleteDocument, listDocuments, uploadDocument } from "@/services/pdfService";
import type { PdfDocument } from "@/services/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Tambah Dokumen — PDF Reader" },
      { name: "description", content: "Unggah file PDF baru beserta judul dan deskripsinya." },
      { property: "og:title", content: "Tambah Dokumen — PDF Reader" },
      {
        property: "og:description",
        content: "Unggah file PDF baru beserta judul dan deskripsinya.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const { data: documents } = useQuery({
    queryKey: ["pdf-documents"],
    queryFn: listDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: () => uploadDocument({ title, description, file: file!, thumbnail }),
    onSuccess: () => {
      toast.success("Dokumen berhasil ditambahkan.");
      setTitle("");
      setDescription("");
      setFile(null);
      setThumbnail(null);
      queryClient.invalidateQueries({ queryKey: ["pdf-documents"] });
    },
    onError: (error: Error) => toast.error(error.message || "Dokumen gagal diunggah."),
  });

  const deleteMutation = useMutation({
    mutationFn: (doc: PdfDocument) => deleteDocument(doc),
    onSuccess: () => {
      toast.success("Dokumen dihapus.");
      queryClient.invalidateQueries({ queryKey: ["pdf-documents"] });
      queryClient.invalidateQueries({ queryKey: ["recent-documents"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
    onError: () => toast.error("Dokumen gagal dihapus."),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      toast.error("Pilih file PDF terlebih dahulu.");
      return;
    }
    if (!title.trim()) {
      toast.error("Judul dokumen wajib diisi.");
      return;
    }
    uploadMutation.mutate();
  };

  return (
    <div className="app-shell min-h-screen">
      <AppHeader subtitle="Tambah dokumen" />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-5">
        <form onSubmit={submit} className="card-surface space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Alhidayah 3-1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dokumen pembelajaran"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="file">File PDF</Label>
            <Input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="thumbnail">Thumbnail (opsional)</Label>
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" disabled={uploadMutation.isPending} className="w-full gap-2">
            <Upload className="size-4" />
            {uploadMutation.isPending ? "Mengunggah..." : "Simpan dokumen"}
          </Button>
        </form>

        {documents?.length ? (
          <section className="space-y-3">
            <h2 className="font-display text-base font-semibold">Dokumen tersimpan</h2>
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="card-surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[doc.total_pages ? `${doc.total_pages} halaman` : null, formatFileSize(doc.file_size)]
                      .filter(Boolean)
                      .join(" · ") || "Belum dibuka"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Hapus ${doc.title}`}
                  onClick={() => deleteMutation.mutate(doc)}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </section>
        ) : null}
      </main>
      <BottomNavigation />
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { verifyUploadPassword } from "@/lib/admin.functions";
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

const PW_KEY = "upload-password";

function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  useEffect(() => {
    setPassword(sessionStorage.getItem(PW_KEY));
  }, []);
  if (!password)
    return (
      <PasswordGate
        onUnlock={(pw) => {
          sessionStorage.setItem(PW_KEY, pw);
          setPassword(pw);
        }}
      />
    );
  return <AdminContent password={password} />;
}

function PasswordGate({ onUnlock }: { onUnlock: (pw: string) => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await verifyUploadPassword({ data: { password: value } });
      if (res.ok) onUnlock(value);
      else toast.error("Password salah.");
    } catch {
      toast.error("Gagal memeriksa password.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="app-shell min-h-screen">
      <AppHeader subtitle="Khusus pemilik" />
      <main className="mx-auto max-w-sm px-4 py-10">
        <form onSubmit={submit} className="card-surface space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <h2 className="font-display text-base font-semibold">Masukkan password</h2>
          </div>
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Password unggah"
          />
          <Button type="submit" disabled={busy || !value} className="w-full">
            {busy ? "Memeriksa..." : "Masuk"}
          </Button>
        </form>
      </main>
      <BottomNavigation />
    </div>
  );
}

function AdminContent({ password }: { password: string }) {
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
    mutationFn: () => uploadDocument({ password, title, description, file: file!, thumbnail }),
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
    mutationFn: (doc: PdfDocument) => deleteDocument(doc, password),
    onSuccess: () => {
      toast.success("Dokumen dihapus.");
      queryClient.invalidateQueries({ queryKey: ["pdf-documents"] });
      queryClient.invalidateQueries({ queryKey: ["recent-documents"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
    onError: (e: Error) => toast.error(e.message || "Dokumen gagal dihapus."),
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

import { useEffect, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startPwa } from "@/lib/pwa";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PwaNotices() {
  const [update, setUpdate] = useState<(() => Promise<void>) | null>(null);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => startPwa((next) => setUpdate(() => next)), []);
  useEffect(() => {
    const offer = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt); };
    const installed = () => setInstall(null);
    window.addEventListener("beforeinstallprompt", offer);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", offer); window.removeEventListener("appinstalled", installed); };
  }, []);

  if (!update && (!install || dismissed)) return null;
  return (
    <aside className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-sm items-center gap-2 rounded-lg border border-border bg-background p-3 shadow-lg" role="status">
      <span className="min-w-0 flex-1 text-sm font-medium">{update ? "Versi baru tersedia" : "Install Aplikasi"}</span>
      {update ? (
        <Button size="sm" onClick={() => void update()}><RefreshCw className="size-4" /> Perbarui</Button>
      ) : (
        <Button size="sm" onClick={async () => { await install?.prompt(); await install?.userChoice; setInstall(null); }}><Download className="size-4" /> Install</Button>
      )}
      <Button size="icon" variant="ghost" aria-label="Tutup" className="size-8" onClick={() => { setDismissed(true); setUpdate(null); }}><X className="size-4" /></Button>
    </aside>
  );
}
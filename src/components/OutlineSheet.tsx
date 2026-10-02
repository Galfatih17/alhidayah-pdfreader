import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type OutlineNode = { title: string; page: number | null; children: OutlineNode[] };

function OutlineItem({ node, depth, onSelect }: { node: OutlineNode; depth: number; onSelect: (page: number) => void }) {
  const [open, setOpen] = useState(depth === 0 && false);
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <div className="flex items-center gap-1 rounded-md hover:bg-muted" style={{ paddingLeft: depth * 14 }}>
        {hasChildren ? (
          <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Ciutkan" : "Bentangkan"} aria-expanded={open} className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
            <ChevronRight className={`size-4 transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        ) : <span className="w-8 shrink-0" />}
        <button type="button" disabled={node.page == null} onClick={() => node.page != null && onSelect(node.page)} className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left text-sm text-foreground disabled:opacity-50">
          <span className="min-w-0 flex-1 truncate">{node.title || "Tanpa judul"}</span>
          {node.page != null && <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{node.page}</span>}
        </button>
      </div>
      {hasChildren && open && (
        <ul>{node.children.map((child, i) => <OutlineItem key={i} node={child} depth={depth + 1} onSelect={onSelect} />)}</ul>
      )}
    </li>
  );
}

export function OutlineSheet({ open, onOpenChange, outline, onSelect }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outline: OutlineNode[];
  onSelect: (page: number) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-[85vw] max-w-sm flex-col gap-0 bg-reader p-0 text-reader-foreground">
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle className="font-display text-base">Daftar Isi</SheetTitle>
          <SheetDescription className="text-xs">Ketuk judul untuk melompat ke halaman.</SheetDescription>
        </SheetHeader>
        <ul className="flex-1 overflow-y-auto p-2">
          {outline.map((node, i) => (
            <OutlineItem key={i} node={node} depth={0} onSelect={(page) => { onOpenChange(false); onSelect(page); }} />
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

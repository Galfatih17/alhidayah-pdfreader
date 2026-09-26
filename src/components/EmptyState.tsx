import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {description ? (
        <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

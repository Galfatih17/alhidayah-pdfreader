import { Link } from "@tanstack/react-router";
import { Bookmark, Home, Library } from "lucide-react";

const items = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/library", label: "Library", icon: Library },
  { to: "/bookmarks", label: "Bookmark", icon: Bookmark },
] as const;

export function BottomNavigation() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
      <ul className="mx-auto flex max-w-3xl items-stretch">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ "data-active": "true" }}
              className="group flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground transition-colors data-[active=true]:text-primary"
            >
              <span className="grid h-7 w-14 place-items-center rounded-full transition-colors group-data-[active=true]:bg-accent">
                <Icon className="size-5" />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

import { Link } from "@tanstack/react-router";
import { Bookmark, Home, Library } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/library", label: "Library", icon: Library },
  { to: "/bookmarks", label: "Bookmark", icon: Bookmark },
] as const;

export function BottomNavigation() {
  return (
    <nav aria-label="Navigasi utama" className="app-nav-bottom fixed inset-x-0 z-40 mx-auto w-max rounded-full border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-md">
      <ul className="flex items-center gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Button asChild variant="ghost" size="icon" className="size-11 rounded-full text-muted-foreground [&[data-active=true]]:bg-accent [&[data-active=true]]:text-primary">
              <Link to={to} activeOptions={{ exact: to === "/" }} activeProps={{ "data-active": "true" }} aria-label={label} title={label}>
                <Icon className="size-5" />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

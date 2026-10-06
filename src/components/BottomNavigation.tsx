import { Link } from "@tanstack/react-router";
import { BookOpen, Bookmark, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BottomNavigation() {
  return (
    <nav aria-label="Navigasi utama" className="app-nav-bottom fixed inset-x-0 z-40 mx-auto w-max rounded-full border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-md">
      <ul className="flex items-center gap-1">
        <li>
          <Button asChild variant="ghost" size="icon" className="size-11 rounded-full text-muted-foreground [&[data-active=true]]:bg-accent [&[data-active=true]]:text-primary">
            <Link to="/" activeOptions={{ exact: true }} activeProps={{ "data-active": "true" }} aria-label="Beranda" title="Beranda">
              <Home className="size-5" />
            </Link>
          </Button>
        </li>
        <li>
          <Button asChild variant="ghost" size="icon" className="size-11 rounded-full text-muted-foreground">
            <Link to="/mushaf/$page" params={{ page: "1" }} aria-label="Mushaf" title="Mushaf">
              <BookOpen className="size-5" />
            </Link>
          </Button>
        </li>
        <li>
          <Button asChild variant="ghost" size="icon" className="size-11 rounded-full text-muted-foreground [&[data-active=true]]:bg-accent [&[data-active=true]]:text-primary">
            <Link to="/bookmarks" activeProps={{ "data-active": "true" }} aria-label="Bookmark" title="Bookmark">
              <Bookmark className="size-5" />
            </Link>
          </Button>
        </li>
      </ul>
    </nav>
  );
}

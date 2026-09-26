import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkList } from "./BookmarkList";
import { RecentDocuments } from "./RecentDocuments";

export function MainTabs({ query }: { query: string }) {
  return (
    <Tabs defaultValue="recent" className="w-full">
      <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-secondary p-1">
        <TabsTrigger value="recent" className="rounded-lg text-sm">
          Terakhir Dibaca
        </TabsTrigger>
        <TabsTrigger value="bookmarks" className="rounded-lg text-sm">
          Bookmark
        </TabsTrigger>
      </TabsList>
      <TabsContent value="recent" className="mt-4">
        <RecentDocuments query={query} />
      </TabsContent>
      <TabsContent value="bookmarks" className="mt-4">
        <BookmarkList query={query} />
      </TabsContent>
    </Tabs>
  );
}

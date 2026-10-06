import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BISMILLAH_TEXT, fetchPage, showBismillah, surahOf, toArabicDigits } from "@/lib/quran";

export const MushafPage = memo(function MushafPage({ page, active }: { page: number; active: boolean }) {
  const { data, isError, refetch } = useQuery({
    queryKey: ["quran-page", page],
    queryFn: () => fetchPage(page),
    enabled: active,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });

  if (isError)
    return (
      <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
        <div>
          <p>Halaman belum tersimpan. Periksa koneksi internet.</p>
          <button onClick={() => refetch()} className="mt-3 rounded-full bg-primary px-4 py-2 text-primary-foreground">Coba lagi</button>
        </div>
      </div>
    );
  if (!data) return <div className="h-full animate-pulse bg-muted/40" />;

  return (
    <div dir="rtl" className="font-quran mx-auto max-w-2xl px-5 pb-28 pt-20 text-justify text-[1.6rem] leading-[2.6] text-foreground sm:text-3xl">
      {data.map((a) => (
        <span key={a.number}>
          {a.numberInSurah === 1 && (
            <span className="my-3 block text-center">
              <span className="block rounded-xl border border-primary/30 bg-accent/60 py-1 text-xl text-primary">
                سورة {surahOf(a.surah).ar}
              </span>
              {showBismillah(a.surah) && <span className="mt-2 block text-2xl">{BISMILLAH_TEXT}</span>}
            </span>
          )}
          {a.text}{" "}
          <span className="mx-1 inline-grid size-9 place-items-center rounded-full border border-primary/40 align-middle text-base leading-none text-primary">
            {toArabicDigits(a.numberInSurah)}
          </span>{" "}
          {a.sajda && <span className="text-base text-primary">۩ </span>}
        </span>
      ))}
      <p className="mt-6 text-center text-base text-muted-foreground">{toArabicDigits(page)}</p>
    </div>
  );
});

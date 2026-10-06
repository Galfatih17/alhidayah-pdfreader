import meta from "@/data/quran-meta.json";

export type Surah = (typeof meta.surahs)[number];
export type Juz = (typeof meta.juz)[number];
export const SURAHS: Surah[] = meta.surahs;
export const JUZ: Juz[] = meta.juz;
export const TOTAL_PAGES = 604;

export type Ayah = {
  number: number;
  numberInSurah: number;
  text: string;
  surah: number;
  juz: number;
  page: number;
  sajda: boolean;
  translation?: string;
};

const API = "https://api.alquran.cloud/v1";
const CACHE = "quran-data-v1";
const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

/** Fetch JSON, storing it on-device so it opens offline next time. */
async function cachedJson(url: string): Promise<any> {
  const cache = typeof caches !== "undefined" ? await caches.open(CACHE) : null;
  const hit = await cache?.match(url);
  if (hit) return hit.json();
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal memuat data Al-Qur'an");
  await cache?.put(url, res.clone());
  return res.json();
}

function clean(text: string, surah: number, numberInSurah: number) {
  if (numberInSurah === 1 && surah !== 1 && text.startsWith(BISMILLAH)) {
    return text.slice(BISMILLAH.length).trim();
  }
  return text;
}

function mapAyah(a: any): Ayah {
  const surah = a.surah.number;
  return {
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: clean(a.text, surah, a.numberInSurah),
    surah,
    juz: a.juz,
    page: a.page,
    sajda: Boolean(a.sajda),
  };
}

export async function fetchPage(page: number): Promise<Ayah[]> {
  const json = await cachedJson(`${API}/page/${page}/quran-uthmani`);
  return json.data.ayahs.map(mapAyah);
}

export async function fetchSurah(n: number): Promise<Ayah[]> {
  const json = await cachedJson(`${API}/surah/${n}/editions/quran-uthmani,id.indonesian`);
  const [ar, tr] = json.data;
  return ar.ayahs.map((a: any, i: number) => ({
    ...mapAyah({ ...a, surah: { number: n } }),
    translation: tr.ayahs[i]?.text,
  }));
}

export const surahOf = (n: number): Surah => SURAHS[n - 1] ?? SURAHS[0]!;
export const showBismillah = (surah: number) => surah !== 1 && surah !== 9;
export const BISMILLAH_TEXT = BISMILLAH;

export function toArabicDigits(n: number) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)] ?? d);
}

export function juzOfPage(page: number) {
  let j = 1;
  for (const z of JUZ) if (z.page <= page) j = z.n;
  return j;
}

export function surahOfPage(page: number) {
  let s: Surah = SURAHS[0]!;
  for (const x of SURAHS) if (x.page <= page) s = x;
  return s;
}

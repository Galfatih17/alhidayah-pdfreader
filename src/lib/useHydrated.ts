import { useEffect, useState } from "react";

/** True only after the client has hydrated. Use to gate browser-only UI. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

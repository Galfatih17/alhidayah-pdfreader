import { registerSW } from "virtual:pwa-register";

export function startPwa(onUpdate: (update: () => Promise<void>) => void) {
  if (!("serviceWorker" in navigator)) return;
  const host = location.hostname;
  const blocked = !import.meta.env.PROD || window !== window.top || host.startsWith("id-preview--") || host.startsWith("preview--") || ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"].some((domain) => host === domain || host.endsWith(`.${domain}`)) || new URLSearchParams(location.search).get("sw") === "off";
  if (blocked) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.filter((registration) => registration.active?.scriptURL.endsWith("/sw.js") || registration.waiting?.scriptURL.endsWith("/sw.js") || registration.installing?.scriptURL.endsWith("/sw.js")).forEach((registration) => void registration.unregister());
    });
    return;
  }

  let update: (reloadPage?: boolean) => Promise<void> = async () => {};
  update = registerSW({
    immediate: true,
    onNeedRefresh: () => onUpdate(() => update(true)),
  });

  // Check when visitors return to an open installation.
  const check = () => void navigator.serviceWorker.getRegistration().then((registration) => registration?.update());
  const visible = () => { if (document.visibilityState === "visible") check(); };
  document.addEventListener("visibilitychange", visible);
  return () => document.removeEventListener("visibilitychange", visible);
}
import { normalizeLocale } from "@/i18n/locales";

export const VERSION_RELOAD_KEY = "6529:version-reload";
export const VERSION_RELOAD_ATTRIBUTE = "data-version-reload";
export const VERSION_RELOAD_LOCALE_ATTRIBUTE = "data-version-reload-locale";
export const VERSION_RELOAD_SCREEN_ID = "version-reload-screen";
const MARKER_MAX_AGE_MS = 60_000;
const SCREEN_TIMEOUT_MS = 30_000;
const IMAGE_TIMEOUT_MS = 1_000;
let reloadPending = false;

/** Prepare the actual cover image, not just a separate browser-cache entry. */
export function prepareVersionReloadImage(): Promise<void> {
  const image = document
    .getElementById(VERSION_RELOAD_SCREEN_ID)
    ?.querySelector("img");
  if (!image) return Promise.resolve();

  return new Promise((resolve) => {
    const finish = () => {
      globalThis.clearTimeout(timeout);
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      resolve();
    };
    const timeout = globalThis.setTimeout(finish, IMAGE_TIMEOUT_MS);
    if (typeof image.decode === "function") {
      void image.decode().then(finish).catch(finish);
    } else if (image.complete) {
      finish();
    } else {
      image.addEventListener("load", finish);
      image.addEventListener("error", finish);
    }
  });
}

function afterCoverPaint(): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      globalThis.clearTimeout(timeout);
      resolve();
    };
    const timeout = globalThis.setTimeout(finish, 150);
    globalThis.requestAnimationFrame(() =>
      globalThis.requestAnimationFrame(finish)
    );
  });
}

function finishVersionReload() {
  reloadPending = false;
  document.documentElement.removeAttribute(VERSION_RELOAD_ATTRIBUTE);
  document.documentElement.removeAttribute(VERSION_RELOAD_LOCALE_ATTRIBUTE);
  try {
    sessionStorage.removeItem(VERSION_RELOAD_KEY);
  } catch {
    // Restricted storage must not prevent the app from becoming usable.
  }
}

/** Dismiss the incoming cover as a whole after its image and app shell are ready. */
export async function finishVersionReloadWhenReady() {
  if (!canFinishVersionReload()) return;
  await prepareVersionReloadImage();
  await afterCoverPaint();
  if (canFinishVersionReload()) finishVersionReload();
}

function canFinishVersionReload() {
  return (
    !reloadPending &&
    document.documentElement.hasAttribute(VERSION_RELOAD_ATTRIBUTE)
  );
}

/** Show feedback before navigating; the next document restores it before paint. */
export function beginVersionReload(reload: () => void) {
  if (
    reloadPending ||
    document.documentElement.hasAttribute(VERSION_RELOAD_ATTRIBUTE)
  )
    return;
  reloadPending = true;
  void prepareVersionReloadImage().then(() => {
    if (!reloadPending) return;
    void showVersionReload(reload);
  });
}

async function showVersionReload(reload: () => void) {
  const locale = normalizeLocale(navigator.languages[0] ?? navigator.language);
  try {
    sessionStorage.setItem(
      VERSION_RELOAD_KEY,
      JSON.stringify({ at: Date.now(), locale })
    );
  } catch {
    // Reload still works when session storage is unavailable.
  }
  document.documentElement.setAttribute(
    VERSION_RELOAD_LOCALE_ATTRIBUTE,
    locale
  );
  document.documentElement.setAttribute(VERSION_RELOAD_ATTRIBUTE, "true");
  document.getElementById(VERSION_RELOAD_SCREEN_ID)?.focus();
  globalThis.setTimeout(finishVersionReload, SCREEN_TIMEOUT_MS);

  // Give the screen one paint; the timeout handles throttled/background frames.
  await afterCoverPaint();
  reload();
}

// Static inline bootstrap: no remote content or user strings are inserted into HTML.
export const VERSION_RELOAD_BOOTSTRAP_SCRIPT = `(()=>{try{
const raw=sessionStorage.getItem(${JSON.stringify(VERSION_RELOAD_KEY)});
if(!raw)return;
sessionStorage.removeItem(${JSON.stringify(VERSION_RELOAD_KEY)});
const marker=JSON.parse(raw),age=Date.now()-marker.at;
if(!Number.isFinite(age)||age<0||age>${MARKER_MAX_AGE_MS})return;
const locale=['en-US','en-GB','fr-FR','es-ES','de-DE'].includes(marker.locale)?marker.locale:'en-US';
document.documentElement.setAttribute('${VERSION_RELOAD_LOCALE_ATTRIBUTE}',locale);
document.documentElement.setAttribute('${VERSION_RELOAD_ATTRIBUTE}','true');
setTimeout(()=>{document.documentElement.removeAttribute('${VERSION_RELOAD_ATTRIBUTE}');document.documentElement.removeAttribute('${VERSION_RELOAD_LOCALE_ATTRIBUTE}');},${SCREEN_TIMEOUT_MS});
}catch{}})();`;

import "next/dist/compiled/server-only";

/**
 * The frontend's root folder at run time, which holds `public/` and
 * `content/`. The desktop app's server does not run from that folder, so the
 * app names it in DESKTOP_RENDERER_DIR.
 */
export function getFrontendRoot(): string {
  const desktopRendererDir = process.env["DESKTOP_RENDERER_DIR"];
  return desktopRendererDir === undefined || desktopRendererDir === ""
    ? process.cwd()
    : desktopRendererDir;
}

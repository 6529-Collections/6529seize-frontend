import "next/dist/compiled/server-only";

function getDesktopRendererDir(): string | undefined {
  const desktopRendererDir = process.env["DESKTOP_RENDERER_DIR"];
  return desktopRendererDir === undefined || desktopRendererDir === ""
    ? undefined
    : desktopRendererDir;
}

/**
 * The frontend's root folder at run time, which holds `public/` and
 * `content/`. The desktop app's server does not run from that folder, so the
 * app names it in DESKTOP_RENDERER_DIR.
 */
export function getFrontendRoot(): string {
  return getDesktopRendererDir() ?? process.cwd();
}

/**
 * Whether this server runs inside the desktop app, which carries none of the
 * site's server configuration.
 */
export function isDesktopRenderer(): boolean {
  return getDesktopRendererDir() !== undefined;
}

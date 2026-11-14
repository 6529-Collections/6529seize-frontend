"use client";

import DesktopTitleStrip from "@/components/header/titlebar/DesktopTitleStrip";
import { useWindowChrome } from "@/hooks/useWindowChrome";

/**
 * Inside 6529 Desktop, draws the title strip when the host asks for an
 * overlay title bar. The page's top offset comes from CSS
 * (`:root[data-desktop-titlebar="overlay"]` in globals.css), which the host
 * sets before first paint, so the layout does not move when the strip
 * appears after hydration. Nothing on the web or with a native title bar.
 */
export default function DesktopWindowChrome() {
  const chrome = useWindowChrome();
  if (chrome?.style !== "overlay") return null;
  return <DesktopTitleStrip />;
}

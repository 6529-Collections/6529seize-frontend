import { isCollectedCardAnchorId } from "@/helpers/profile-collected-navigation";
import { useEffect, useRef } from "react";

export function useCollectedCardScrollRestoration(cards: readonly unknown[]) {
  const restoredAnchorRef = useRef<string | null>(null);

  useEffect(() => {
    const anchor = globalThis.location.hash.slice(1);
    if (
      !isCollectedCardAnchorId(anchor) ||
      restoredAnchorRef.current === anchor
    ) {
      return;
    }

    const cardElement = globalThis.document.getElementById(anchor);
    if (!cardElement) {
      return;
    }

    restoredAnchorRef.current = anchor;
    const cardLink = cardElement.querySelector<HTMLAnchorElement>("a[href]");
    cardLink?.focus({ preventScroll: true });
    cardElement.scrollIntoView({ block: "center" });
  }, [cards]);
}

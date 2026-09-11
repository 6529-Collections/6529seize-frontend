import { useEffect } from "react";
import { getTooltipWindow } from "./tooltipPositioning";

export function useTooltipReposition(
  isVisible: boolean,
  calculatePosition: () => void
): void {
  useEffect(() => {
    if (!isVisible) return undefined;

    const browserWindow = getTooltipWindow();
    if (browserWindow === null) return undefined;

    let rafId: number | null = null;
    const handleReposition = () => {
      if (rafId !== null) return;

      rafId = browserWindow.requestAnimationFrame(() => {
        rafId = null;
        calculatePosition();
      });
    };

    const visualViewport = browserWindow.visualViewport;
    browserWindow.addEventListener("resize", handleReposition);
    browserWindow.addEventListener("scroll", handleReposition, true);
    visualViewport?.addEventListener("resize", handleReposition);
    visualViewport?.addEventListener("scroll", handleReposition);

    return () => {
      browserWindow.removeEventListener("resize", handleReposition);
      browserWindow.removeEventListener("scroll", handleReposition, true);
      visualViewport?.removeEventListener("resize", handleReposition);
      visualViewport?.removeEventListener("scroll", handleReposition);

      if (rafId !== null) {
        browserWindow.cancelAnimationFrame(rafId);
      }
    };
  }, [calculatePosition, isVisible]);
}

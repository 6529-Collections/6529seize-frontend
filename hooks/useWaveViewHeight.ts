import { useMemo } from "react";
import useCapacitor from "./useCapacitor";

/**
 * Enum for the different views in a wave
 */
export enum WaveView {
  CHAT = "chat",
  LEADERBOARD = "leaderboard",
  WINNERS = "winners",
  OUTCOME = "outcome",
}

interface UseWaveViewHeightOptions {
  /**
   * Whether this is a Memes wave
   */
  isMemesWave?: boolean;

  /**
   * Whether this is a simple wave (no decision points, not rolling, not memes)
   */
  isSimpleWave?: boolean;
}

/**
 * Hook to calculate the height for different wave views consistently across components
 *
 * @param view The view to calculate height for
 * @param options Additional options to consider when calculating height
 * @returns A string with the Tailwind height class
 */
export function useWaveViewHeight(
  view: WaveView,
  options: UseWaveViewHeightOptions = {}
): string {
  const { isCapacitor } = useCapacitor();
  const { isMemesWave = false, isSimpleWave = false } = options;

  return useMemo(() => {
    if (isCapacitor) {
      return "tw-h-[calc(100vh-18rem)]";
    }

    // Special case for Memes waves
    if (isMemesWave) {
      // All view types in Memes wave have the same height
      return "tw-h-[calc(100vh-12rem)] lg:tw-h-[calc(100vh-12rem)] min-[1200px]:tw-h-[calc(100vh-12.875rem)]";
    }

    // Special case for simple waves (Chat view only)
    if (isSimpleWave && view === WaveView.CHAT) {
      return "tw-h-[calc(100vh-9rem)] lg:tw-h-[calc(100vh-9rem)] min-[1200px]:tw-h-[calc(100vh-9.875rem)]";
    }

    // Standard heights for each view type with consistent breakpoints
    switch (view) {
      case WaveView.CHAT:
        return "tw-h-[calc(100vh-10.5rem)] lg:tw-h-[calc(100vh-10.5rem)] min-[1200px]:tw-h-[calc(100vh-10.5rem)]";
      case WaveView.LEADERBOARD:
        return "tw-h-[calc(100vh-10.5rem)] lg:tw-h-[calc(100vh-10.5rem)] min-[1200px]:tw-h-[calc(100vh-10.5rem)]";
      case WaveView.WINNERS:
        return "tw-h-[calc(100vh-10.5rem)] lg:tw-h-[calc(100vh-10.5rem)] min-[1200px]:tw-h-[calc(100vh-10.5rem)]";
      case WaveView.OUTCOME:
        return "tw-h-[calc(100vh-10.5rem)] lg:tw-h-[calc(100vh-10.5rem)] min-[1200px]:tw-h-[calc(100vh-10.5rem)]";
    }
  }, [view, isCapacitor, isMemesWave, isSimpleWave]);
}

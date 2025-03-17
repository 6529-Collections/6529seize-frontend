import { useEffect, useState } from "react";
import { useLayout } from "../components/brain/my-stream/layout/LayoutContext";

// Different view types that might need different height calculations
export enum ContentView {
  CHAT = "chat",
  LEADERBOARD = "leaderboard",
  WINNERS = "winners",
  OUTCOME = "outcome",
}

interface ContentHeightOptions {
  // View type affects height calculation
  view: ContentView;

  // Wave-specific flags
  isMemesWave?: boolean;
  isRollingWave?: boolean;
  isSimpleWave?: boolean;

  // Component ID for registration
  componentId: string;
}

/**
 * Hook that returns the appropriate height style for a content container
 * based on the layout measurements and view type
 */
export function useContentHeight(options: ContentHeightOptions): {
  heightStyle: React.CSSProperties;
  ready: boolean;
} {
  const { spaces } = useLayout();
  const [heightStyle, setHeightStyle] = useState<React.CSSProperties>({});
  const [ready, setReady] = useState(false);

  // Calculate height based on layout spaces and options
  useEffect(() => {
    if (!spaces.measurementsComplete) {
      return;
    }

    // Set the calculated height style
    setHeightStyle({
      height: `${spaces.contentSpace}px`,
      maxHeight: `${spaces.contentSpace}px`,
    });

    setReady(true);
  }, [
    spaces,
    options.view,
    options.isMemesWave,
    options.isRollingWave,
    options.isSimpleWave,
    options.componentId,
  ]);

  return { heightStyle, ready };
}

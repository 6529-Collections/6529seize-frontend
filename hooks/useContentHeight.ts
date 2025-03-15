import { useEffect, useState } from 'react';
import { useLayout } from '../components/brain/my-stream/layout/LayoutContext';

// Different view types that might need different height calculations
export enum ContentView {
  CHAT = 'chat',
  LEADERBOARD = 'leaderboard',
  WINNERS = 'winners',
  OUTCOME = 'outcome',
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
  const { spaces, registerHeightDependent, unregisterHeightDependent } = useLayout();
  const [heightStyle, setHeightStyle] = useState<React.CSSProperties>({});
  const [ready, setReady] = useState(false);
  
  // Register this component as dependent on height calculations
  useEffect(() => {
    registerHeightDependent(options.componentId);
    
    return () => {
      unregisterHeightDependent(options.componentId);
    };
  }, [options.componentId, registerHeightDependent, unregisterHeightDependent]);
  
  // Calculate height based on layout spaces and options
  useEffect(() => {
    if (!spaces.measurementsComplete) {
      return;
    }
    
    // Start with the full content space and apply consistent buffer
    let adjustedHeight = spaces.contentSpace;
    
    // Apply consistent 16px top spacing for all wave types
    // This creates visual consistency across different wave types
    const topSpacing = 16;
    
    // Start by subtracting the consistent top spacing
    adjustedHeight = adjustedHeight - topSpacing;
    
    // Add extra height for waves with tabs to compensate for tab space inside the content
    if (!options.isSimpleWave) {
      // Use a single adjustment value for all waves with tabs
      const extraHeight = 70;
      adjustedHeight = adjustedHeight + extraHeight;
      
      console.log(`[useContentHeight] Added extra height for wave with tabs:`, {
        waveId: options.componentId,
        extraHeight: `+${extraHeight}px`,
        adjustedHeight
      });
    }
    
    // Ensure minimum reasonable height
    const finalHeight = Math.max(adjustedHeight, 300);
    
    // Set the calculated height style
    setHeightStyle({ height: `${finalHeight}px`, maxHeight: `${finalHeight}px` });
    
    // Simple debug log with only essential information
    console.log(`[useContentHeight] ${options.componentId}: h=${finalHeight}, simple=${options.isSimpleWave}`);
    
    setReady(true);
  }, [
    spaces,
    options.view,
    options.isMemesWave,
    options.isRollingWave,
    options.isSimpleWave,
    options.componentId
  ]);
  
  return { heightStyle, ready };
}
import { useRef, useEffect } from 'react';

export interface RenderInfo {
  component: string;
  renderCount: number;
  props?: Record<string, any>;
  changedProps?: string[];
  timestamp: number;
}

const globalRenderTracker = {
  renders: [] as RenderInfo[],
  listeners: [] as ((info: RenderInfo) => void)[],
  
  addRender(info: RenderInfo) {
    this.renders.push(info);
    
    // Keep only last 200 renders to prevent memory issues
    if (this.renders.length > 200) {
      this.renders = this.renders.slice(-200);
    }
    
    this.listeners.forEach(listener => listener(info));
    
    // Auto-detect excessive renders
    const recentRenders = this.renders.filter(r => 
      r.component === info.component && 
      Date.now() - r.timestamp < 5000 // Last 5 seconds
    );
    
    if (recentRenders.length > 20) {
      console.warn(`🚨 EXCESSIVE RENDERS DETECTED: ${info.component} rendered ${recentRenders.length} times in 5 seconds!`);
      console.log('Recent render details:', recentRenders.slice(-10));
    }
  },
  
  getRecentRenders(componentName?: string, seconds = 10) {
    const cutoff = Date.now() - (seconds * 1000);
    return this.renders.filter(r => 
      r.timestamp > cutoff && 
      (!componentName || r.component === componentName)
    );
  },
  
  addListener(listener: (info: RenderInfo) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

// Make available globally for debugging (client-side only)
if (typeof window !== 'undefined') {
  (window as any).renderTracker = globalRenderTracker;
}

export function useRenderTracker(
  componentName: string, 
  props?: Record<string, any>,
  options: { logThreshold?: number; trackProps?: boolean } = {}
) {
  const renderCount = useRef(0);
  const previousProps = useRef<Record<string, any>>(props || {});
  const { logThreshold = 10, trackProps = true } = options;
  
  // Skip tracking during SSR
  if (typeof window === 'undefined') {
    return {
      component: componentName,
      renderCount: 0,
      props: undefined,
      changedProps: undefined,
      timestamp: 0
    };
  }
  
  renderCount.current++;
  
  let changedProps: string[] = [];
  if (trackProps && props) {
    changedProps = Object.keys(props).filter(key => {
      const changed = previousProps.current[key] !== props[key];
      if (changed) {
        console.log(`🔍 ${componentName} prop '${key}' changed:`, {
          from: previousProps.current[key],
          to: props[key]
        });
      }
      return changed;
    });
    previousProps.current = { ...props };
  }
  
  const renderInfo: RenderInfo = {
    component: componentName,
    renderCount: renderCount.current,
    props: trackProps ? props : undefined,
    changedProps: changedProps.length > 0 ? changedProps : undefined,
    timestamp: Date.now()
  };
  
  globalRenderTracker.addRender(renderInfo);
  
  if (renderCount.current >= logThreshold) {
    console.warn(`🔄 ${componentName} render #${renderCount.current}`, renderInfo);
  }
  
  return renderInfo;
}

export function logRenderSummary() {
  const recent = globalRenderTracker.getRecentRenders();
  const byComponent = recent.reduce((acc, r) => {
    acc[r.component] = (acc[r.component] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 Render Summary (last 10 seconds):', byComponent);
  
  const excessive = Object.entries(byComponent)
    .filter(([, count]) => count > 20)
    .sort(([, a], [, b]) => b - a);
    
  if (excessive.length > 0) {
    console.warn('🚨 Components with excessive renders:', excessive);
  }
  
  return { byComponent, excessive, totalRenders: recent.length };
}

// Debug commands available in console (client-side only)
if (typeof window !== 'undefined') {
  console.log('🔧 Debug commands available:');
  console.log('- renderTracker.getRecentRenders() - Get recent renders');
  console.log('- renderTracker.getRecentRenders("ComponentName") - Get renders for specific component');  
  console.log('- logRenderSummary() - Show render summary');
  (window as any).logRenderSummary = logRenderSummary;
}
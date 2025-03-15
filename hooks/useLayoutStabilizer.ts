import { useEffect, useRef, useState } from 'react';

/**
 * Stabilizer state machine phases
 */
enum StabilizerPhase {
  // Initial state, no measurements taken yet
  INITIAL = 'initial',
  
  // First measurement taken, waiting for confirmation
  FIRST_MEASUREMENT = 'first_measurement',
  
  // Second measurement taken, comparing with first
  SECOND_MEASUREMENT = 'second_measurement',
  
  // Measurements are considered stable
  STABILIZED = 'stabilized',
}

interface StabilizerOptions {
  // Measurement function that returns the height to stabilize
  measureFn: () => number | null;
  
  // Dependency array to trigger remeasurement
  deps: any[];
  
  // Tolerance for considering measurements stable (in pixels)
  tolerance?: number;
  
  // Default height to use if measurement fails
  defaultHeight?: number;
  
  // Whether to log debug information
  debug?: boolean;
}

/**
 * A hook that ensures layout measurements are stable before using them.
 * Takes multiple measurements across animation frames and only returns
 * a value when measurements have stabilized.
 */
export function useLayoutStabilizer({
  measureFn,
  deps,
  tolerance = 2, // Allow 2px difference between measurements
  defaultHeight = 56, // Default height for tabs
  debug = true,
}: StabilizerOptions): {
  height: number;
  stable: boolean;
  forceUpdate: () => void;
} {
  // Reference to current measurement
  const currentMeasurement = useRef<number | null>(null);
  
  // Reference to previous measurement for comparison
  const previousMeasurement = useRef<number | null>(null);
  
  // Track state machine phase
  const [phase, setPhase] = useState<StabilizerPhase>(StabilizerPhase.INITIAL);
  
  // State for exposing the stable height
  const [stableHeight, setStableHeight] = useState<number>(defaultHeight);
  
  // Animation frame request ID for cleanup
  const frameIdRef = useRef<number | null>(null);
  
  // Force update trigger
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Function to force a remeasurement cycle
  const forceUpdate = () => {
    setPhase(StabilizerPhase.INITIAL);
    setUpdateTrigger(prev => prev + 1);
    if (debug) console.log('[useLayoutStabilizer] Force update triggered');
  };
  
  // Handle the measurement stabilization process
  useEffect(() => {
    // Cancel any existing animation frame request
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
    
    // Reset to initial phase when dependencies change
    setPhase(StabilizerPhase.INITIAL);
    currentMeasurement.current = null;
    previousMeasurement.current = null;
    
    // Start the measurement state machine
    const runStateMachine = () => {
      // Take a measurement
      const measured = measureFn();
      
      // Update based on current phase
      switch (phase) {
        case StabilizerPhase.INITIAL:
          // First measurement, store and schedule next frame
          currentMeasurement.current = measured;
          if (debug) console.log(`[useLayoutStabilizer] Initial measurement: ${measured}px`);
          setPhase(StabilizerPhase.FIRST_MEASUREMENT);
          frameIdRef.current = requestAnimationFrame(runStateMachine);
          break;
          
        case StabilizerPhase.FIRST_MEASUREMENT:
          // Store previous and take new measurement
          previousMeasurement.current = currentMeasurement.current;
          currentMeasurement.current = measured;
          
          if (debug) console.log(`[useLayoutStabilizer] Second measurement: ${measured}px, previous: ${previousMeasurement.current}px`);
          setPhase(StabilizerPhase.SECOND_MEASUREMENT);
          frameIdRef.current = requestAnimationFrame(runStateMachine);
          break;
          
        case StabilizerPhase.SECOND_MEASUREMENT:
          // Compare measurements to check stability
          const prev = previousMeasurement.current;
          const curr = currentMeasurement.current;
          
          // Handle measurement failures
          if (prev === null || curr === null || measured === null) {
            if (debug) console.log('[useLayoutStabilizer] Measurement failed, using default height');
            setStableHeight(defaultHeight);
            setPhase(StabilizerPhase.STABILIZED);
            return;
          }
          
          // Check if measurements are stable
          const diff1 = Math.abs(curr - prev);
          const diff2 = Math.abs(measured - curr);
          
          if (diff1 <= tolerance && diff2 <= tolerance) {
            // Measurements are stable, use the latest value
            if (debug) console.log(`[useLayoutStabilizer] Measurements stabilized at ${measured}px`);
            setStableHeight(measured);
            setPhase(StabilizerPhase.STABILIZED);
          } else {
            // Still unstable, continue measuring
            previousMeasurement.current = curr;
            currentMeasurement.current = measured;
            if (debug) console.log(`[useLayoutStabilizer] Still unstable, diff1=${diff1}, diff2=${diff2}`);
            frameIdRef.current = requestAnimationFrame(runStateMachine);
          }
          break;
          
        case StabilizerPhase.STABILIZED:
          // Take one final measurement to be safe
          if (measured !== null && Math.abs(measured - stableHeight) > tolerance * 2) {
            if (debug) console.log(`[useLayoutStabilizer] Height changed after stabilization: ${measured}px vs ${stableHeight}px`);
            setStableHeight(measured);
          }
          break;
      }
    };
    
    // Start the state machine
    frameIdRef.current = requestAnimationFrame(runStateMachine);
    
    // Cleanup function
    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, [...deps, updateTrigger]); // Include updateTrigger to allow forced remeasurement
  
  return {
    height: stableHeight,
    stable: phase === StabilizerPhase.STABILIZED,
    forceUpdate,
  };
}
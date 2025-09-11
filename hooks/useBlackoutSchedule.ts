"use client";

import { useState, useEffect } from "react";

interface BlackoutWindow {
  day: number;        // 0=Sunday, 1=Monday, 2=Tuesday, etc.
  startHour: number;  // 0-23 (24-hour format)
  endHour: number;    // 0-23, if 0 means midnight (end of day)
}

interface BlackoutScheduleConfig {
  timezone: string;
  schedule: BlackoutWindow[];
  checkIntervalMs?: number;
}

/**
 * Check if current day and hour falls within a blackout window
 */
const isWithinBlackoutWindow = (
  currentDay: number, 
  currentHour: number, 
  window: BlackoutWindow
): boolean => {
  if (currentDay !== window.day) return false;
  
  // Special case: endHour of 0 means "until midnight" (23:59)
  if (window.endHour === 0) {
    return currentHour >= window.startHour; // 17, 18, 19, 20, 21, 22, 23
  }
  
  // Normal case: within same day range
  return currentHour >= window.startHour && currentHour < window.endHour;
};

/**
 * Get current time in specified timezone and check if we're in a blackout period
 */
const getCurrentBlackoutStatus = (timezone: string, schedule: BlackoutWindow[]): boolean => {
  try {
    // Get current time in specified timezone (handles DST automatically)
    const localizedTime = new Date().toLocaleString("en-US", {
      timeZone: timezone
    });
    const localizedDate = new Date(localizedTime);
    
    const currentDay = localizedDate.getDay();
    const currentHour = localizedDate.getHours();
    
    // Check if we're in any blackout window
    const isInBlackout = schedule.some(window => 
      isWithinBlackoutWindow(currentDay, currentHour, window)
    );
    
    return isInBlackout;
  } catch (error) {
    // If timezone conversion fails, default to active (safe fallback)
    console.warn(`Timezone conversion failed for ${timezone}, defaulting to active:`, error);
    return false;
  }
};

/**
 * Hook that returns whether the component should be active based on a configurable blackout schedule.
 * Component is active by default, except during specified blackout periods.
 * 
 * @param config Configuration object containing timezone, schedule, and optional polling interval
 * @returns {object} Object containing isActive boolean
 */
export const useBlackoutSchedule = ({ 
  timezone, 
  schedule, 
  checkIntervalMs = 60 * 1000 
}: BlackoutScheduleConfig) => {
  const [isActive, setIsActive] = useState(() => {
    // Initialize with current status (active = NOT in blackout)
    return !getCurrentBlackoutStatus(timezone, schedule);
  });

  useEffect(() => {
    const checkBlackoutStatus = () => {
      const isInBlackout = getCurrentBlackoutStatus(timezone, schedule);
      const newIsActive = !isInBlackout;
      
      // Only update state if it actually changed
      setIsActive(currentActive => {
        if (currentActive !== newIsActive) {
          console.log(`Blackout status changed for ${timezone}: ${newIsActive ? 'ACTIVE' : 'BLACKOUT'}`);
          return newIsActive;
        }
        return currentActive;
      });
    };
    
    // Initial check
    checkBlackoutStatus();
    
    // Check at specified interval for live updates
    const interval = setInterval(checkBlackoutStatus, checkIntervalMs);
    
    return () => clearInterval(interval);
  }, [timezone, schedule, checkIntervalMs]);
  
  return { isActive };
};

// Export types and helper functions for testing
export type { BlackoutWindow, BlackoutScheduleConfig };
export { isWithinBlackoutWindow, getCurrentBlackoutStatus };
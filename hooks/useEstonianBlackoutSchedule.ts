"use client";

import { useState, useEffect } from "react";

interface BlackoutWindow {
  day: number;        // 0=Sunday, 1=Monday, 2=Tuesday, etc.
  startHour: number;  // 0-23 (24-hour format)
  endHour: number;    // 0-23, if 0 means midnight (end of day)
}

const ESTONIAN_BLACKOUT_SCHEDULE: BlackoutWindow[] = [
  { day: 2, startHour: 17, endHour: 0 }, // Tuesday 5pm-midnight
  { day: 4, startHour: 17, endHour: 0 }, // Thursday 5pm-midnight  
  { day: 6, startHour: 17, endHour: 0 }  // Saturday 5pm-midnight
];

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
 * Get current Estonian time and check if we're in a blackout period
 */
const getCurrentEstonianBlackoutStatus = (): boolean => {
  try {
    // Get current time in Estonian timezone (handles DST automatically)
    const estonianTime = new Date().toLocaleString("en-US", {
      timeZone: "Europe/Tallinn"
    });
    const estonianDate = new Date(estonianTime);
    
    const currentDay = estonianDate.getDay();
    const currentHour = estonianDate.getHours();
    
    // Check if we're in any blackout window
    const isInBlackout = ESTONIAN_BLACKOUT_SCHEDULE.some(window => 
      isWithinBlackoutWindow(currentDay, currentHour, window)
    );
    
    return isInBlackout;
  } catch (error) {
    // If timezone conversion fails, default to active (safe fallback)
    console.warn('Estonian timezone conversion failed, defaulting to active:', error);
    return false;
  }
};

/**
 * Hook that returns whether the component should be active based on Estonian blackout schedule.
 * Component is active by default, except during specified blackout periods:
 * - Tuesday 5pm-midnight Estonian time
 * - Thursday 5pm-midnight Estonian time  
 * - Saturday 5pm-midnight Estonian time
 * 
 * @returns {object} Object containing isActive boolean and next status change info
 */
export const useEstonianBlackoutSchedule = () => {
  const [isActive, setIsActive] = useState(() => {
    // Initialize with current status (active = NOT in blackout)
    return !getCurrentEstonianBlackoutStatus();
  });

  useEffect(() => {
    const checkBlackoutStatus = () => {
      const isInBlackout = getCurrentEstonianBlackoutStatus();
      const newIsActive = !isInBlackout;
      
      // Only update state if it actually changed
      setIsActive(currentActive => {
        if (currentActive !== newIsActive) {
          console.log(`Estonian blackout status changed: ${newIsActive ? 'ACTIVE' : 'BLACKOUT'}`);
          return newIsActive;
        }
        return currentActive;
      });
    };
    
    // Initial check
    checkBlackoutStatus();
    
    // Check every minute for live updates (similar to useCountdown pattern)
    const interval = setInterval(checkBlackoutStatus, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { isActive };
};

// Export the schedule and helper functions for testing
export { ESTONIAN_BLACKOUT_SCHEDULE, isWithinBlackoutWindow, getCurrentEstonianBlackoutStatus };
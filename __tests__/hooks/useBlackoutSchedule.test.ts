import { renderHook, act } from "@testing-library/react";
import {
  useBlackoutSchedule,
  isWithinBlackoutWindow,
  getCurrentBlackoutStatus,
} from "../../hooks/useBlackoutSchedule";
import type { BlackoutWindow } from "../../hooks/useBlackoutSchedule";

// Helper constants for readability
const DAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

// Estonian schedule for backward compatibility testing
const ESTONIAN_SCHEDULE: BlackoutWindow[] = [
  { day: 2, startHour: 17, endHour: 0 }, // Tuesday 5pm-midnight
  { day: 4, startHour: 17, endHour: 0 }, // Thursday 5pm-midnight
  { day: 6, startHour: 17, endHour: 0 }  // Saturday 5pm-midnight
];

// Updated schedule with Sunday full day blackout (current production config)
const EASTERN_EUROPEAN_SCHEDULE: BlackoutWindow[] = [
  { day: 0, startHour: 0, endHour: 0 },  // Sunday all day
  { day: 2, startHour: 17, endHour: 0 }, // Tuesday 5pm-midnight
  { day: 4, startHour: 17, endHour: 0 }, // Thursday 5pm-midnight  
  { day: 6, startHour: 17, endHour: 0 }  // Saturday 5pm-midnight
];

describe("useBlackoutSchedule", () => {
  // Test the basic blackout window logic first (pure functions)
  describe("isWithinBlackoutWindow", () => {
    it("returns false when day does not match", () => {
      const window = { day: DAYS.TUESDAY, startHour: 17, endHour: 0 };
      expect(isWithinBlackoutWindow(DAYS.MONDAY, 18, window)).toBe(false);
      expect(isWithinBlackoutWindow(DAYS.WEDNESDAY, 18, window)).toBe(false);
    });

    it("handles endHour of 0 (until midnight) correctly", () => {
      const window = { day: DAYS.TUESDAY, startHour: 17, endHour: 0 };
      
      // Before blackout period
      expect(isWithinBlackoutWindow(DAYS.TUESDAY, 16, window)).toBe(false);
      
      // During blackout period - from 5pm (17) until midnight
      expect(isWithinBlackoutWindow(DAYS.TUESDAY, 17, window)).toBe(true);
      expect(isWithinBlackoutWindow(DAYS.TUESDAY, 18, window)).toBe(true);
      expect(isWithinBlackoutWindow(DAYS.TUESDAY, 22, window)).toBe(true);
      expect(isWithinBlackoutWindow(DAYS.TUESDAY, 23, window)).toBe(true);
    });

    it("handles normal time range correctly", () => {
      const window = { day: DAYS.MONDAY, startHour: 10, endHour: 15 };
      
      // Before range
      expect(isWithinBlackoutWindow(DAYS.MONDAY, 9, window)).toBe(false);
      
      // During range
      expect(isWithinBlackoutWindow(DAYS.MONDAY, 10, window)).toBe(true);
      expect(isWithinBlackoutWindow(DAYS.MONDAY, 12, window)).toBe(true);
      expect(isWithinBlackoutWindow(DAYS.MONDAY, 14, window)).toBe(true);
      
      // After range (15 is exclusive)
      expect(isWithinBlackoutWindow(DAYS.MONDAY, 15, window)).toBe(false);
      expect(isWithinBlackoutWindow(DAYS.MONDAY, 16, window)).toBe(false);
    });
  });

  describe("predefined schedule configurations", () => {
    it("has correct Estonian schedule configuration (backward compatibility)", () => {
      expect(ESTONIAN_SCHEDULE).toEqual([
        { day: 2, startHour: 17, endHour: 0 }, // Tuesday 5pm-midnight
        { day: 4, startHour: 17, endHour: 0 }, // Thursday 5pm-midnight
        { day: 6, startHour: 17, endHour: 0 }  // Saturday 5pm-midnight
      ]);
    });

    it("Estonian schedule covers all specified blackout periods", () => {
      const schedule = ESTONIAN_SCHEDULE;
      
      expect(schedule).toHaveLength(3);
      
      const days = schedule.map(w => w.day).sort();
      expect(days).toEqual([2, 4, 6]); // Tuesday, Thursday, Saturday
      
      schedule.forEach(window => {
        expect(window.startHour).toBe(17);
        expect(window.endHour).toBe(0);
      });
    });

    it("works with Estonian schedule in practice", () => {
      const originalToLocaleString = Date.prototype.toLocaleString;
      
      // Test Tuesday 6pm - should be in blackout
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/2/2024, 6:00:00 PM'); // Tuesday 6pm
      expect(getCurrentBlackoutStatus("Europe/Tallinn", ESTONIAN_SCHEDULE)).toBe(true);
      
      // Test Tuesday 4pm - should not be in blackout
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/2/2024, 4:00:00 PM'); // Tuesday 4pm
      expect(getCurrentBlackoutStatus("Europe/Tallinn", ESTONIAN_SCHEDULE)).toBe(false);
      
      // Test Wednesday - should not be in blackout
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/3/2024, 6:00:00 PM'); // Wednesday 6pm
      expect(getCurrentBlackoutStatus("Europe/Tallinn", ESTONIAN_SCHEDULE)).toBe(false);
      
      Date.prototype.toLocaleString = originalToLocaleString;
    });
  });

  describe("getCurrentBlackoutStatus error handling", () => {
    it("returns false and logs warning when timezone conversion fails", () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const originalToLocaleString = Date.prototype.toLocaleString;
      
      // Mock Date constructor to throw error
      Date.prototype.toLocaleString = jest.fn().mockImplementation(() => {
        throw new Error('Invalid timezone');
      });
      
      expect(getCurrentBlackoutStatus("Europe/Tallinn", ESTONIAN_SCHEDULE)).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Timezone conversion failed for Europe/Tallinn, defaulting to active:',
        expect.any(Error)
      );
      
      Date.prototype.toLocaleString = originalToLocaleString;
      consoleSpy.mockRestore();
    });
  });

  describe("timezone flexibility", () => {
    it("works with different timezones", () => {
      const testSchedule: BlackoutWindow[] = [
        { day: DAYS.MONDAY, startHour: 9, endHour: 17 }
      ];

      // Mock toLocaleString to return controlled dates
      const originalToLocaleString = Date.prototype.toLocaleString;
      
      // Test with America/New_York timezone
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2024, 12:00:00 PM'); // Monday, 12 PM
      expect(getCurrentBlackoutStatus("America/New_York", testSchedule)).toBe(true);
      
      // Test with Asia/Tokyo timezone  
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2024, 8:00:00 AM'); // Monday, 8 AM
      expect(getCurrentBlackoutStatus("Asia/Tokyo", testSchedule)).toBe(false);
      
      Date.prototype.toLocaleString = originalToLocaleString;
    });
  });

  describe("custom schedules", () => {
    it("works with different blackout windows", () => {
      const customSchedule: BlackoutWindow[] = [
        { day: DAYS.MONDAY, startHour: 9, endHour: 17 },    // Monday 9am-5pm
        { day: DAYS.WEDNESDAY, startHour: 14, endHour: 18 }, // Wednesday 2pm-6pm
      ];

      const originalToLocaleString = Date.prototype.toLocaleString;
      
      // Test Monday during blackout
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2024, 12:00:00 PM'); // Monday, 12 PM
      expect(getCurrentBlackoutStatus("UTC", customSchedule)).toBe(true);
      
      // Test Tuesday (no blackout)
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/2/2024, 12:00:00 PM'); // Tuesday, 12 PM
      expect(getCurrentBlackoutStatus("UTC", customSchedule)).toBe(false);
      
      // Test Wednesday during blackout
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/3/2024, 3:00:00 PM'); // Wednesday, 3 PM
      expect(getCurrentBlackoutStatus("UTC", customSchedule)).toBe(true);
      
      Date.prototype.toLocaleString = originalToLocaleString;
    });
  });

  describe("useBlackoutSchedule hook", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.clearAllTimers();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it("initializes with correct status when not in blackout", () => {
      const mockConfig = {
        timezone: "UTC",
        schedule: [{ day: DAYS.MONDAY, startHour: 9, endHour: 17 }]
      };

      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/2/2024, 12:00:00 PM'); // Tuesday, not in blackout
      
      const { result } = renderHook(() => useBlackoutSchedule(mockConfig));
      
      expect(result.current.isActive).toBe(true);
      
      Date.prototype.toLocaleString = originalToLocaleString;
    });

    it("initializes with correct status when in blackout", () => {
      const mockConfig = {
        timezone: "UTC",
        schedule: [{ day: DAYS.MONDAY, startHour: 9, endHour: 17 }]
      };

      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2024, 12:00:00 PM'); // Monday, in blackout
      
      const { result } = renderHook(() => useBlackoutSchedule(mockConfig));
      
      expect(result.current.isActive).toBe(false);
      
      Date.prototype.toLocaleString = originalToLocaleString;
    });

    it("accepts custom check interval", () => {
      const mockConfig = {
        timezone: "UTC",
        schedule: [{ day: DAYS.MONDAY, startHour: 9, endHour: 17 }],
        checkIntervalMs: 30000 // 30 seconds
      };

      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/2/2024, 12:00:00 PM');
      
      const { result } = renderHook(() => useBlackoutSchedule(mockConfig));
      
      expect(result.current.isActive).toBe(true);
      
      Date.prototype.toLocaleString = originalToLocaleString;
    });

    it("logs status changes when blackout state transitions", () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const originalToLocaleString = Date.prototype.toLocaleString;
      
      const mockConfig = {
        timezone: "Europe/Tallinn",
        schedule: [{ day: DAYS.MONDAY, startHour: 9, endHour: 17 }],
        checkIntervalMs: 100 // Fast interval for testing
      };

      // Start not in blackout (Tuesday)
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/2/2024, 12:00:00 PM');
      
      const { result } = renderHook(() => useBlackoutSchedule(mockConfig));
      
      expect(result.current.isActive).toBe(true);
      
      // Change to Monday during blackout period
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2024, 12:00:00 PM');
      
      // Advance timer to trigger check
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      expect(result.current.isActive).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Blackout status changed for Europe/Tallinn: BLACKOUT'
      );
      
      // Change back to active
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/2/2024, 12:00:00 PM');
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      expect(result.current.isActive).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Blackout status changed for Europe/Tallinn: ACTIVE'
      );
      
      Date.prototype.toLocaleString = originalToLocaleString;
      consoleSpy.mockRestore();
    });

    it("does not log when status remains unchanged", () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const originalToLocaleString = Date.prototype.toLocaleString;
      
      const mockConfig = {
        timezone: "UTC",
        schedule: [{ day: DAYS.MONDAY, startHour: 9, endHour: 17 }],
        checkIntervalMs: 100
      };

      // Keep consistent state (not in blackout)
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/2/2024, 12:00:00 PM');
      
      const { result } = renderHook(() => useBlackoutSchedule(mockConfig));
      
      expect(result.current.isActive).toBe(true);
      
      // Advance timer - status should remain the same
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      expect(result.current.isActive).toBe(true);
      // Should not log since status didn't change
      expect(consoleSpy).not.toHaveBeenCalled();
      
      Date.prototype.toLocaleString = originalToLocaleString;
      consoleSpy.mockRestore();
    });

    it("cleans up interval on unmount", () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const originalToLocaleString = Date.prototype.toLocaleString;
      
      const mockConfig = {
        timezone: "UTC",
        schedule: [{ day: DAYS.MONDAY, startHour: 9, endHour: 17 }]
      };

      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/2/2024, 12:00:00 PM');
      
      const { unmount } = renderHook(() => useBlackoutSchedule(mockConfig));
      
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      Date.prototype.toLocaleString = originalToLocaleString;
      clearIntervalSpy.mockRestore();
    });

    it("updates when config dependencies change", () => {
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2024, 12:00:00 PM'); // Monday
      
      let mockConfig = {
        timezone: "UTC",
        schedule: [{ day: DAYS.TUESDAY, startHour: 9, endHour: 17 }], // Not today
        checkIntervalMs: 100
      };

      const { result, rerender } = renderHook(
        (config) => useBlackoutSchedule(config),
        { initialProps: mockConfig }
      );
      
      expect(result.current.isActive).toBe(true); // Not in blackout
      
      // Change schedule to include Monday
      mockConfig = {
        ...mockConfig,
        schedule: [{ day: DAYS.MONDAY, startHour: 9, endHour: 17 }]
      };
      
      rerender(mockConfig);
      
      expect(result.current.isActive).toBe(false); // Now in blackout
      
      Date.prototype.toLocaleString = originalToLocaleString;
    });
  });

  describe("edge cases and error conditions", () => {
    it("handles empty schedule gracefully", () => {
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2024, 12:00:00 PM');
      
      expect(getCurrentBlackoutStatus("UTC", [])).toBe(false);
      
      Date.prototype.toLocaleString = originalToLocaleString;
    });

    it("handles midnight boundary correctly", () => {
      const window = { day: DAYS.MONDAY, startHour: 23, endHour: 0 };
      
      // 11pm Monday - in blackout
      expect(isWithinBlackoutWindow(DAYS.MONDAY, 23, window)).toBe(true);
      
      // Midnight (hour 0) Tuesday - not in blackout (different day)
      expect(isWithinBlackoutWindow(DAYS.TUESDAY, 0, window)).toBe(false);
    });

    it("handles same start and end hour edge case", () => {
      const window = { day: DAYS.MONDAY, startHour: 10, endHour: 10 };
      
      // Should not be in blackout when start equals end (no duration)
      expect(isWithinBlackoutWindow(DAYS.MONDAY, 10, window)).toBe(false);
      expect(isWithinBlackoutWindow(DAYS.MONDAY, 9, window)).toBe(false);
      expect(isWithinBlackoutWindow(DAYS.MONDAY, 11, window)).toBe(false);
    });

    it("handles multiple overlapping windows correctly", () => {
      const schedule: BlackoutWindow[] = [
        { day: DAYS.MONDAY, startHour: 9, endHour: 12 },  // 9am-12pm
        { day: DAYS.MONDAY, startHour: 10, endHour: 15 }, // 10am-3pm (overlaps)
        { day: DAYS.MONDAY, startHour: 16, endHour: 18 }  // 4pm-6pm (separate)
      ];
      
      const originalToLocaleString = Date.prototype.toLocaleString;
      
      // 11am - should be in blackout (covered by both first windows)
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2024, 11:00:00 AM');
      expect(getCurrentBlackoutStatus("UTC", schedule)).toBe(true);
      
      // 2pm - should be in blackout (covered by second window)
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2024, 2:00:00 PM');
      expect(getCurrentBlackoutStatus("UTC", schedule)).toBe(true);
      
      // 3:30pm - should not be in blackout (gap between windows)
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2024, 3:30:00 PM');
      expect(getCurrentBlackoutStatus("UTC", schedule)).toBe(false);
      
      // 5pm - should be in blackout (third window)
      Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2024, 5:00:00 PM');
      expect(getCurrentBlackoutStatus("UTC", schedule)).toBe(true);
      
      Date.prototype.toLocaleString = originalToLocaleString;
    });

    it("handles invalid timezone gracefully in hook", () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const originalToLocaleString = Date.prototype.toLocaleString;
      
      // Mock toLocaleString to throw for invalid timezone
      Date.prototype.toLocaleString = jest.fn().mockImplementation(() => {
        throw new Error('Invalid timezone: Fake/Invalid');
      });
      
      const mockConfig = {
        timezone: "Fake/Invalid",
        schedule: [{ day: DAYS.MONDAY, startHour: 9, endHour: 17 }]
      };
      
      const { result } = renderHook(() => useBlackoutSchedule(mockConfig));
      
      // Should default to active (safe fallback)
      expect(result.current.isActive).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Timezone conversion failed for Fake/Invalid, defaulting to active:',
        expect.any(Error)
      );
      
      Date.prototype.toLocaleString = originalToLocaleString;
      consoleSpy.mockRestore();
    });

    it("handles all days of week correctly", () => {
      const allDaysSchedule: BlackoutWindow[] = [
        { day: 0, startHour: 1, endHour: 2 }, // Sunday
        { day: 1, startHour: 1, endHour: 2 }, // Monday
        { day: 2, startHour: 1, endHour: 2 }, // Tuesday
        { day: 3, startHour: 1, endHour: 2 }, // Wednesday
        { day: 4, startHour: 1, endHour: 2 }, // Thursday
        { day: 5, startHour: 1, endHour: 2 }, // Friday
        { day: 6, startHour: 1, endHour: 2 }  // Saturday
      ];
      
      const originalToLocaleString = Date.prototype.toLocaleString;
      
      // Test each day of the week
      for (let day = 0; day < 7; day++) {
        const testDate = new Date(2024, 0, day + 7); // January 7-13, 2024 (Sun-Sat)
        const dateString = testDate.toLocaleDateString('en-US', { 
          timeZone: 'UTC', 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric' 
        }) + ', 1:30:00 AM';
        
        Date.prototype.toLocaleString = jest.fn().mockReturnValue(dateString);
        expect(getCurrentBlackoutStatus("UTC", allDaysSchedule)).toBe(true);
      }
      
      Date.prototype.toLocaleString = originalToLocaleString;
    });
  });

  describe("full day blackout scenarios", () => {
    describe("Sunday full day blackout (startHour: 0, endHour: 0)", () => {
      const sundayFullDaySchedule: BlackoutWindow[] = [
        { day: DAYS.SUNDAY, startHour: 0, endHour: 0 } // Sunday all day
      ];

      it("should be in blackout for all hours of Sunday", () => {
        const originalToLocaleString = Date.prototype.toLocaleString;
        
        // Test every hour of Sunday (0-23)
        for (let hour = 0; hour <= 23; hour++) {
          const timeString = hour < 10 ? `1/7/2024, ${hour}:00:00 AM` : 
                           hour === 12 ? '1/7/2024, 12:00:00 PM' :
                           hour < 12 ? `1/7/2024, ${hour}:00:00 AM` :
                           hour === 12 ? '1/7/2024, 12:00:00 PM' :
                           `1/7/2024, ${hour === 12 ? 12 : hour - 12}:00:00 PM`;
          
          Date.prototype.toLocaleString = jest.fn().mockReturnValue(timeString); // Sunday
          expect(getCurrentBlackoutStatus("UTC", sundayFullDaySchedule)).toBe(true);
        }
        
        Date.prototype.toLocaleString = originalToLocaleString;
      });

      it("should NOT be in blackout for other days", () => {
        const originalToLocaleString = Date.prototype.toLocaleString;
        
        // Test Monday through Saturday
        const testDays = [
          { date: '1/8/2024, 12:00:00 PM', day: 'Monday' },
          { date: '1/9/2024, 12:00:00 PM', day: 'Tuesday' },
          { date: '1/10/2024, 12:00:00 PM', day: 'Wednesday' },
          { date: '1/11/2024, 12:00:00 PM', day: 'Thursday' },
          { date: '1/12/2024, 12:00:00 PM', day: 'Friday' },
          { date: '1/13/2024, 12:00:00 PM', day: 'Saturday' }
        ];
        
        testDays.forEach(({ date }) => {
          Date.prototype.toLocaleString = jest.fn().mockReturnValue(date);
          expect(getCurrentBlackoutStatus("UTC", sundayFullDaySchedule)).toBe(false);
        });
        
        Date.prototype.toLocaleString = originalToLocaleString;
      });

      it("correctly handles Sunday blackout with Eastern European timezone", () => {
        const originalToLocaleString = Date.prototype.toLocaleString;
        
        // Test various Sunday times in Eastern European timezone
        const sundayTimes = [
          '1/7/2024, 12:00:00 AM', // Midnight
          '1/7/2024, 6:00:00 AM',  // Early morning
          '1/7/2024, 12:00:00 PM', // Noon
          '1/7/2024, 6:00:00 PM',  // Evening
          '1/7/2024, 11:59:00 PM'  // Just before midnight
        ];
        
        sundayTimes.forEach(timeString => {
          Date.prototype.toLocaleString = jest.fn().mockReturnValue(timeString);
          expect(getCurrentBlackoutStatus("Europe/Bucharest", sundayFullDaySchedule)).toBe(true);
        });
        
        Date.prototype.toLocaleString = originalToLocaleString;
      });
    });

    describe("Eastern European schedule with Sunday blackout", () => {
      it("has correct schedule configuration", () => {
        expect(EASTERN_EUROPEAN_SCHEDULE).toEqual([
          { day: 0, startHour: 0, endHour: 0 },  // Sunday all day
          { day: 2, startHour: 17, endHour: 0 }, // Tuesday 5pm-midnight
          { day: 4, startHour: 17, endHour: 0 }, // Thursday 5pm-midnight  
          { day: 6, startHour: 17, endHour: 0 }  // Saturday 5pm-midnight
        ]);
      });

      it("works with production schedule - Sunday blackout scenarios", () => {
        const originalToLocaleString = Date.prototype.toLocaleString;
        
        // Sunday morning - should be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/7/2024, 9:00:00 AM');
        expect(getCurrentBlackoutStatus("Europe/Bucharest", EASTERN_EUROPEAN_SCHEDULE)).toBe(true);
        
        // Sunday evening - should be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/7/2024, 8:00:00 PM');
        expect(getCurrentBlackoutStatus("Europe/Bucharest", EASTERN_EUROPEAN_SCHEDULE)).toBe(true);
        
        // Sunday midnight - should be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/7/2024, 11:59:00 PM');
        expect(getCurrentBlackoutStatus("Europe/Bucharest", EASTERN_EUROPEAN_SCHEDULE)).toBe(true);
        
        Date.prototype.toLocaleString = originalToLocaleString;
      });

      it("works with production schedule - non-blackout scenarios", () => {
        const originalToLocaleString = Date.prototype.toLocaleString;
        
        // Monday morning - should NOT be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/8/2024, 9:00:00 AM');
        expect(getCurrentBlackoutStatus("Europe/Bucharest", EASTERN_EUROPEAN_SCHEDULE)).toBe(false);
        
        // Tuesday early afternoon - should NOT be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/9/2024, 2:00:00 PM');
        expect(getCurrentBlackoutStatus("Europe/Bucharest", EASTERN_EUROPEAN_SCHEDULE)).toBe(false);
        
        // Friday evening - should NOT be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/12/2024, 8:00:00 PM');
        expect(getCurrentBlackoutStatus("Europe/Bucharest", EASTERN_EUROPEAN_SCHEDULE)).toBe(false);
        
        Date.prototype.toLocaleString = originalToLocaleString;
      });

      it("works with production schedule - partial day blackout scenarios", () => {
        const originalToLocaleString = Date.prototype.toLocaleString;
        
        // Tuesday evening - should be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/9/2024, 8:00:00 PM');
        expect(getCurrentBlackoutStatus("Europe/Bucharest", EASTERN_EUROPEAN_SCHEDULE)).toBe(true);
        
        // Thursday evening - should be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/11/2024, 10:00:00 PM');
        expect(getCurrentBlackoutStatus("Europe/Bucharest", EASTERN_EUROPEAN_SCHEDULE)).toBe(true);
        
        // Saturday evening - should be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/13/2024, 11:30:00 PM');
        expect(getCurrentBlackoutStatus("Europe/Bucharest", EASTERN_EUROPEAN_SCHEDULE)).toBe(true);
        
        Date.prototype.toLocaleString = originalToLocaleString;
      });
    });

    describe("full day blackout edge cases", () => {
      it("handles multiple full day blackouts correctly", () => {
        const weekendFullBlackout: BlackoutWindow[] = [
          { day: DAYS.SATURDAY, startHour: 0, endHour: 0 }, // Saturday all day
          { day: DAYS.SUNDAY, startHour: 0, endHour: 0 }    // Sunday all day
        ];
        
        const originalToLocaleString = Date.prototype.toLocaleString;
        
        // Saturday should be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/13/2024, 3:00:00 PM');
        expect(getCurrentBlackoutStatus("UTC", weekendFullBlackout)).toBe(true);
        
        // Sunday should be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/7/2024, 3:00:00 PM');
        expect(getCurrentBlackoutStatus("UTC", weekendFullBlackout)).toBe(true);
        
        // Monday should NOT be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/8/2024, 3:00:00 PM');
        expect(getCurrentBlackoutStatus("UTC", weekendFullBlackout)).toBe(false);
        
        Date.prototype.toLocaleString = originalToLocaleString;
      });

      it("handles mixed full-day and partial-day blackouts", () => {
        const mixedSchedule: BlackoutWindow[] = [
          { day: DAYS.SUNDAY, startHour: 0, endHour: 0 },   // Sunday all day
          { day: DAYS.MONDAY, startHour: 9, endHour: 17 },  // Monday 9am-5pm
          { day: DAYS.WEDNESDAY, startHour: 0, endHour: 0 } // Wednesday all day
        ];
        
        const originalToLocaleString = Date.prototype.toLocaleString;
        
        // Sunday all day - should be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/7/2024, 3:00:00 PM');
        expect(getCurrentBlackoutStatus("UTC", mixedSchedule)).toBe(true);
        
        // Monday during work hours - should be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/8/2024, 12:00:00 PM');
        expect(getCurrentBlackoutStatus("UTC", mixedSchedule)).toBe(true);
        
        // Monday evening - should NOT be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/8/2024, 7:00:00 PM');
        expect(getCurrentBlackoutStatus("UTC", mixedSchedule)).toBe(false);
        
        // Tuesday - should NOT be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/9/2024, 12:00:00 PM');
        expect(getCurrentBlackoutStatus("UTC", mixedSchedule)).toBe(false);
        
        // Wednesday all day - should be in blackout
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/10/2024, 1:00:00 AM');
        expect(getCurrentBlackoutStatus("UTC", mixedSchedule)).toBe(true);
        
        Date.prototype.toLocaleString = originalToLocaleString;
      });
    });

    describe("isWithinBlackoutWindow full day scenarios", () => {
      it("correctly identifies full day blackout windows", () => {
        const fullDayWindow = { day: DAYS.MONDAY, startHour: 0, endHour: 0 };
        
        // All hours of Monday should be in blackout
        for (let hour = 0; hour <= 23; hour++) {
          expect(isWithinBlackoutWindow(DAYS.MONDAY, hour, fullDayWindow)).toBe(true);
        }
        
        // Other days should not be in blackout
        for (let day = 0; day <= 6; day++) {
          if (day !== DAYS.MONDAY) {
            expect(isWithinBlackoutWindow(day, 12, fullDayWindow)).toBe(false);
          }
        }
      });

      it("distinguishes between full day (0,0) and no blackout (same non-zero)", () => {
        const fullDayWindow = { day: DAYS.MONDAY, startHour: 0, endHour: 0 };
        const noBlackoutWindow = { day: DAYS.MONDAY, startHour: 10, endHour: 10 };
        
        // Full day blackout: 0,0 should cover all hours
        expect(isWithinBlackoutWindow(DAYS.MONDAY, 12, fullDayWindow)).toBe(true);
        expect(isWithinBlackoutWindow(DAYS.MONDAY, 0, fullDayWindow)).toBe(true);
        expect(isWithinBlackoutWindow(DAYS.MONDAY, 23, fullDayWindow)).toBe(true);
        
        // Same start/end non-zero: should not blackout anything
        expect(isWithinBlackoutWindow(DAYS.MONDAY, 10, noBlackoutWindow)).toBe(false);
        expect(isWithinBlackoutWindow(DAYS.MONDAY, 9, noBlackoutWindow)).toBe(false);
        expect(isWithinBlackoutWindow(DAYS.MONDAY, 11, noBlackoutWindow)).toBe(false);
      });
    });
  });
});
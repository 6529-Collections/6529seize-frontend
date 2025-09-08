import { render, screen, act } from "@testing-library/react";
import DateCountdown from "@/components/date-countdown/DateCountdown";

// Mock timers for consistent testing
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("DateCountdown", () => {
  describe("Basic Rendering", () => {
    it("renders title correctly", () => {
      const testDate = new Date(Date.now() + 10000); // 10 seconds in future
      
      render(<DateCountdown title="Test Countdown" date={testDate} />);
      
      expect(screen.getByText("Test Countdown")).toBeInTheDocument();
    });

    it("displays time correctly for future date", () => {
      // Set a fixed current time
      const now = new Date(2023, 0, 1, 12, 0, 0); // Jan 1, 2023, 12:00:00
      jest.setSystemTime(now);
      
      // Set future date 2 days, 3 hours, 45 minutes, 30 seconds ahead
      const futureDate = new Date(2023, 0, 3, 15, 45, 30);
      
      render(<DateCountdown title="Future Event" date={futureDate} />);
      
      // Should display: "2 days, 3 hours, 45 minutes and 30 seconds"
      const timeDisplay = screen.getByText(/2 days, 3 hours, 45 minutes and 30 seconds/);
      expect(timeDisplay).toBeInTheDocument();
    });

    it("displays singular time units correctly", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      // 1 day, 1 hour, 1 minute, 1 second ahead
      const futureDate = new Date(2023, 0, 2, 13, 1, 1);
      
      render(<DateCountdown title="Singular Test" date={futureDate} />);
      
      const timeDisplay = screen.getByText(/1 day, 1 hour, 1 minute and 1 second/);
      expect(timeDisplay).toBeInTheDocument();
    });

    it("handles zero time correctly when date has passed", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      // Past date
      const pastDate = new Date(2022, 11, 31, 12, 0, 0);
      
      render(<DateCountdown title="Past Event" date={pastDate} />);
      
      const timeDisplay = screen.getByText("0 seconds");
      expect(timeDisplay).toBeInTheDocument();
    });
  });

  describe("Time Unit Display Logic", () => {
    it("shows only relevant time units (no days)", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      // 3 hours, 45 minutes, 30 seconds ahead (no days)
      const futureDate = new Date(2023, 0, 1, 15, 45, 30);
      
      render(<DateCountdown title="Hours Only" date={futureDate} />);
      
      expect(screen.getByText(/3 hours, 45 minutes and 30 seconds/)).toBeInTheDocument();
      expect(screen.queryByText(/day/)).not.toBeInTheDocument();
    });

    it("shows only relevant time units (no hours)", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      // 45 minutes, 30 seconds ahead (no hours or days)
      const futureDate = new Date(2023, 0, 1, 12, 45, 30);
      
      render(<DateCountdown title="Minutes Only" date={futureDate} />);
      
      expect(screen.getByText(/45 minutes and 30 seconds/)).toBeInTheDocument();
      expect(screen.queryByText(/hour/)).not.toBeInTheDocument();
      expect(screen.queryByText(/day/)).not.toBeInTheDocument();
    });

    it("shows only seconds when less than a minute", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      // 30 seconds ahead
      const futureDate = new Date(2023, 0, 1, 12, 0, 30);
      
      render(<DateCountdown title="Seconds Only" date={futureDate} />);
      
      expect(screen.getByText(/30 seconds/)).toBeInTheDocument();
      expect(screen.queryByText(/minute/)).not.toBeInTheDocument();
      expect(screen.queryByText(/hour/)).not.toBeInTheDocument();
      expect(screen.queryByText(/day/)).not.toBeInTheDocument();
    });

    it("displays large day counts correctly", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      // 365 days ahead
      const futureDate = new Date(2024, 0, 1, 12, 0, 0);
      
      render(<DateCountdown title="Year Ahead" date={futureDate} />);
      
      // Should use toLocaleString() for large numbers
      expect(screen.getByText(/365 days/)).toBeInTheDocument();
    });

    it("formats large numbers with locale formatting", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      // 1000 days ahead
      const futureDate = new Date(now.getTime() + (1000 * 24 * 60 * 60 * 1000));
      
      render(<DateCountdown title="Many Days" date={futureDate} />);
      
      // Should display "1,000 days" with proper formatting
      const timeDisplay = screen.getByText(/1,000 days/);
      expect(timeDisplay).toBeInTheDocument();
    });
  });

  describe("Real-time Updates", () => {
    it("updates countdown every second", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      // 5 seconds ahead
      const futureDate = new Date(2023, 0, 1, 12, 0, 5);
      
      render(<DateCountdown title="Updating Test" date={futureDate} />);
      
      // Initially shows 5 seconds
      expect(screen.getByText(/5 seconds/)).toBeInTheDocument();
      
      // Advance time by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should now show 4 seconds
      expect(screen.getByText(/4 seconds/)).toBeInTheDocument();
      
      // Advance time by 3 more seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      // Should now show 1 second
      expect(screen.getByText(/1 second$/)).toBeInTheDocument(); // Singular form
    });

    it("stops at zero when countdown reaches past date", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      // 2 seconds ahead
      const futureDate = new Date(2023, 0, 1, 12, 0, 2);
      
      render(<DateCountdown title="Ending Test" date={futureDate} />);
      
      // Initially shows 2 seconds
      expect(screen.getByText(/2 seconds/)).toBeInTheDocument();
      
      // Advance time by 3 seconds (past the target)
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      // Should show 0 seconds and stay there
      expect(screen.getByText(/0 seconds/)).toBeInTheDocument();
      
      // Advance more time - should still show 0
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(screen.getByText(/0 seconds/)).toBeInTheDocument();
    });

    it("schedules updates precisely to the next second", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0, 500); // 500ms into the second
      jest.setSystemTime(now);
      
      const futureDate = new Date(2023, 0, 1, 12, 0, 3, 0); // Exactly 2.5 seconds ahead
      
      render(<DateCountdown title="Precise Timing" date={futureDate} />);
      
      // Should initially show 2 seconds (since we round down)
      expect(screen.getByText(/2 seconds/)).toBeInTheDocument();
      
      // Advance by 500ms (to the next full second)
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      // Should still show 2 seconds
      expect(screen.getByText(/2 seconds/)).toBeInTheDocument();
      
      // Advance by another 1000ms
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should now show 1 second
      expect(screen.getByText(/1 second$/)).toBeInTheDocument();
    });
  });

  describe("Cleanup and Memory Management", () => {
    it("cleans up timers on unmount", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      const futureDate = new Date(2023, 0, 1, 12, 0, 10);
      
      const { unmount } = render(
        <DateCountdown title="Cleanup Test" date={futureDate} />
      );
      
      // Verify timer is running
      expect(screen.getByText(/10 seconds/)).toBeInTheDocument();
      
      // Unmount component
      unmount();
      
      // Should not throw or cause memory leaks when advancing timers
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(5000);
        });
      }).not.toThrow();
    });

    it("properly manages timer lifecycle during re-renders", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      const initialDate = new Date(2023, 0, 1, 12, 0, 5);
      const { rerender, unmount } = render(
        <DateCountdown title="Lifecycle Test" date={initialDate} />
      );
      
      expect(screen.getByText(/5 seconds/)).toBeInTheDocument();
      
      // Re-render with same props should not cause errors
      rerender(<DateCountdown title="Lifecycle Test" date={initialDate} />);
      expect(screen.getByText(/5 seconds/)).toBeInTheDocument();
      
      // Unmount should clean up properly
      unmount();
      
      // Should not throw errors after cleanup
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("handles dates that are exactly now", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      
      render(<DateCountdown title="Right Now" date={now} />);
      
      expect(screen.getByText(/0 seconds/)).toBeInTheDocument();
    });

    it("handles very small time differences", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0, 0);
      jest.setSystemTime(now);
      
      // 100ms in the future
      const futureDate = new Date(2023, 0, 1, 12, 0, 0, 100);
      
      render(<DateCountdown title="Milliseconds" date={futureDate} />);
      
      // Should show 0 seconds since we calculate in full seconds
      expect(screen.getByText(/0 seconds/)).toBeInTheDocument();
    });

    it("handles leap year calculations correctly", () => {
      // Set to leap year
      const now = new Date(2024, 1, 28, 12, 0, 0); // Feb 28, 2024
      jest.setSystemTime(now);
      
      // 2 days ahead (crossing leap day)
      const futureDate = new Date(2024, 2, 1, 12, 0, 0); // Mar 1, 2024
      
      render(<DateCountdown title="Leap Year" date={futureDate} />);
      
      expect(screen.getByText(/2 days/)).toBeInTheDocument();
    });

    it("handles daylight saving time changes", () => {
      // This test depends on locale, but we test the calculation logic
      const now = new Date(2023, 2, 11, 12, 0, 0); // Before DST
      jest.setSystemTime(now);
      
      // 2 days ahead (after DST change in most US timezones)
      const futureDate = new Date(2023, 2, 13, 12, 0, 0);
      
      render(<DateCountdown title="DST Test" date={futureDate} />);
      
      // Should still show 2 days (our calculation is based on milliseconds)
      expect(screen.getByText(/2 days/)).toBeInTheDocument();
    });
  });

  describe("Layout and Structure", () => {
    it("applies correct CSS classes", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      const futureDate = new Date(2023, 0, 1, 12, 1, 0);
      
      const { container } = render(
        <DateCountdown title="CSS Test" date={futureDate} />
      );
      
      const outerSpan = container.querySelector(".d-flex.flex-column");
      expect(outerSpan).toBeInTheDocument();
      
      const titleSpan = container.querySelector(".d-flex.justify-content-between.align-items-center");
      expect(titleSpan).toBeInTheDocument();
      
      const timeSpan = container.querySelector(".pt-2.font-larger.font-bolder");
      expect(timeSpan).toBeInTheDocument();
    });

    it("maintains semantic HTML structure", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      const futureDate = new Date(2023, 0, 1, 12, 1, 0);
      
      const { container } = render(
        <DateCountdown title="Semantic Test" date={futureDate} />
      );
      
      // Should have proper span hierarchy
      const spans = container.querySelectorAll("span");
      expect(spans.length).toBeGreaterThan(0);
      
      // Title should be in the first span
      const titleElement = screen.getByText("Semantic Test");
      expect(titleElement.tagName).toBe("SPAN");
    });
  });

  describe("Accessibility", () => {
    it("provides readable content for screen readers", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      const futureDate = new Date(2023, 0, 2, 15, 30, 45);
      
      render(<DateCountdown title="Accessible Test" date={futureDate} />);
      
      // Text content should be readable
      expect(screen.getByText("Accessible Test")).toBeInTheDocument();
      expect(screen.getByText(/1 day, 3 hours, 30 minutes and 45 seconds/)).toBeInTheDocument();
    });

    it("updates screen reader content when time changes", () => {
      const now = new Date(2023, 0, 1, 12, 0, 0);
      jest.setSystemTime(now);
      const futureDate = new Date(2023, 0, 1, 12, 0, 3);
      
      render(<DateCountdown title="Screen Reader Test" date={futureDate} />);
      
      expect(screen.getByText(/3 seconds/)).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(screen.getByText(/2 seconds/)).toBeInTheDocument();
    });
  });
});


import { formatDateTime } from "@/components/user/xtdh/utils/xtdhGrantFormatters";

describe("xtdhGrantFormatters", () => {
  describe("formatDateTime", () => {
    it("formats date with time by default", () => {
      const date = new Date("2025-11-12T15:35:00");
      const result = formatDateTime(date.getTime());
      // Expect something like "Nov 12, 2025, 3:35 PM" 
      // Time components usually involve a colon
      expect(result).toMatch(/:/);
    });

    it("formats date without time when includeTime is false", () => {
      const date = new Date("2025-11-12T15:35:00");
      const result = formatDateTime(date.getTime(), { includeTime: false });
      // Expect "Nov 12, 2025" or similar (locale dependent) but definitely NO time
      expect(result).not.toMatch(/\d{1,2}:\d{2}/);
      expect(result).toContain("2025");
    });
  });
});

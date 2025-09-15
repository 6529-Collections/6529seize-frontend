import { formatToFullDivision } from "@/components/meme-calendar/meme-calendar.helpers";

describe("formatToFullDivision", () => {
  it("includes date ranges for all divisions", () => {
    const d = new Date(Date.UTC(2025, 9, 1));
    const result = formatToFullDivision(d);
    const lines = result.split("\n");
    expect(lines.length).toBe(6);
    lines.forEach((line) => {
      expect(line).toMatch(/\(.*to.*\)/);
    });
    expect(lines[0]).toMatch(/^SZN/);
    expect(lines[1]).toMatch(/^Year/);
    expect(lines[2]).toMatch(/^Epoch/);
    expect(lines[5]).toMatch(/^Eon/);
  });
});

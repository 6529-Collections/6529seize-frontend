import { escapeRegExp } from "@/lib/text/regex";

describe("escapeRegExp", () => {
  it("escapes all regular expression metacharacters", () => {
    const input = ".*+?^${}()|[]\\";
    const result = escapeRegExp(input);
    expect(result).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
  });

  it("leaves safe characters untouched", () => {
    const input = "abc123_-";
    expect(escapeRegExp(input)).toBe(input);
  });

  it("escapes metacharacters embedded in normal text", () => {
    const input = "file(name).ext";
    expect(escapeRegExp(input)).toBe("file\\(name\\)\\.ext");
  });
});

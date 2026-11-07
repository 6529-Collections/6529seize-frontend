import { scrubDiagnosticText } from "@/services/diagnostics/scrub";

describe("scrubDiagnosticText", () => {
  it.each([
    [
      "Failed to fetch https://api.6529.io/api/profiles/punk6529?x=1",
      "Failed to fetch [url]",
    ],
    ["mail me at alice@example.com", "mail me at [email]"],
    [
      "token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.c2ln expired",
      "token [token] expired",
    ],
    [
      "wallet 0x1234567890abcdef1234567890abcdef12345678 rejected",
      "wallet [address] rejected",
    ],
    ["wave 3fa85f64-5717-4562-b3fc-2c963f66afa6 missing", "wave [id] missing"],
    ['Cannot post "gm frens how are you" now', "Cannot post [text] now"],
    ["reading 'secret'", "reading [text]"],
    ["mention @alice failed", "mention [handle] failed"],
    ["GET /api/drops/abc/reactions failed", "GET [path] failed"],
    ["read and/or write", "read and/or write"],
    ["a // b", "a [path] b"],
    ["profile punk6529 not found", "profile [x] not found"],
    ["status 404", "status [x]"],
    ["key abcdefghijklmnopqrstuvwxyz0123", "key [token]"],
    [
      "Cannot read properties of undefined",
      "Cannot read properties of undefined",
    ],
  ])("%p -> %p", (input, expected) => {
    expect(scrubDiagnosticText(input)).toBe(expected);
  });

  it("collapses whitespace and cuts to the limit", () => {
    expect(scrubDiagnosticText("a   b\n\nc", 3)).toBe("a b");
    expect(scrubDiagnosticText("word ".repeat(100)).length).toBe(160);
  });
});

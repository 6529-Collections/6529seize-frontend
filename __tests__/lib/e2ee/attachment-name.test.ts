import { safeAttachmentName } from "@/lib/e2ee/attachment-name";

describe("safeAttachmentName", () => {
  it.each([
    ["holiday.png", "holiday.png"],
    ["../../etc/passwd", "_.._etc_passwd"],
    ["evil\u202Egnp.exe", "evilgnp.exe"],
    ["isolate\u2066d\u2069.txt", "isolated.txt"],
    ["arabic\u061Cmark.pdf", "arabicmark.pdf"],
    ["zero\u200Bwidth\uFEFF.doc", "zerowidth.doc"],
    ["tab\there.txt", "tabhere.txt"],
    ["e\u0301te\u0301.txt", "\u00E9t\u00E9.txt"],
    ["\u202E", "fallback"],
  ])("makes %j safe to show and save", (raw, expected) => {
    expect(safeAttachmentName(raw, "fallback")).toBe(expected);
  });

  it("caps a 255-character name at 120 and keeps the extension", () => {
    const name = safeAttachmentName(`${"a".repeat(251)}.pdf`, "file");
    expect([...name]).toHaveLength(120);
    expect(name.endsWith(".pdf")).toBe(true);
  });
});

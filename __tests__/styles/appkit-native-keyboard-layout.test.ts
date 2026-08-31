import fs from "node:fs";
import path from "node:path";

const globalStyles = fs.readFileSync(
  path.join(process.cwd(), "styles", "globals.css"),
  "utf8"
);

describe("AppKit native keyboard layout", () => {
  it("caps the AppKit keyboard lift only in Capacitor", () => {
    expect(globalStyles).toMatch(
      /body\.capacitor-native w3m-modal\s*\{\s*bottom:\s*min\(var\(--native-keyboard-inset-bottom,\s*0px\),\s*8rem\);\s*\}/u
    );
    expect(globalStyles).not.toMatch(
      /(?:^|\n)\s*w3m-modal\s*\{\s*bottom:\s*min\(var\(--native-keyboard-inset-bottom/mu
    );
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";

// AWS RUM sets performance cookies, so it must only ever mount where the
// performance consent is known. AwsRumProvider fails closed without a
// consent provider; this keeps it mounted inside one so it can run at all.
const read = (file: string): string =>
  readFileSync(path.join(process.cwd(), file), "utf8");

it("mounts AwsRumProvider inside CookieConsentProvider", () => {
  const providers = read("components/providers/Providers.tsx");
  const open = providers.indexOf("<CookieConsentProvider");
  const close = providers.indexOf("</CookieConsentProvider>");
  const mounts = [...providers.matchAll(/<AwsRumProvider\b/g)].map(
    (match) => match.index ?? -1
  );

  expect(open).toBeGreaterThan(-1);
  expect(mounts).toHaveLength(1);
  expect(mounts[0]).toBeGreaterThan(open);
  expect(mounts[0]).toBeLessThan(close);
});

it("does not mount AwsRumProvider in the root layout", () => {
  expect(read("app/layout.tsx")).not.toContain("AwsRumProvider");
});

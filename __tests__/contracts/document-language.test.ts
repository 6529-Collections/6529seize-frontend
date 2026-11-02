/**
 * The server renders every page with the default locale, so each root layout
 * must declare exactly that language on `<html>` (WCAG 3.1.1). The shared
 * provider tree then moves it to the browser's locale after hydration through
 * `DocumentLanguage`, which the standalone surfaces get from the same
 * `Providers`. Neither can drift without the document announcing a language
 * the page is not rendered in.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_LOCALE } from "@/i18n/locales";

const readSource = (file: string) =>
  readFileSync(path.join(process.cwd(), file), "utf8");

const ROOT_LAYOUTS = [
  "app/layout.tsx",
  "standalone/standalone-memes-mint/src/app/layout.tsx",
];

describe("document language contract", () => {
  it.each(ROOT_LAYOUTS)(
    "%s declares the default locale on the server-rendered <html>",
    (file) => {
      const htmlTag = /<html\b[^>]*>/.exec(readSource(file))?.[0];

      expect(htmlTag).toBeDefined();
      expect(htmlTag).toContain(` lang="${DEFAULT_LOCALE}"`);
    }
  );

  it("mounts the document language sync once in the shared providers", () => {
    const providers = readSource("components/providers/Providers.tsx");

    expect(providers.match(/<DocumentLanguage\s*\/>/g)).toHaveLength(1);
  });
});

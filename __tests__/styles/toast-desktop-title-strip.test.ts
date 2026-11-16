import fs from "node:fs";
import path from "node:path";

// The toast container keeps clear of the 6529 Desktop title strip (and the
// window's caption buttons drawn over it): its top offset adds the page's
// --desktop-top-inset, which is 0 everywhere else.
const toastStyles = fs
  .readFileSync(
    path.join(
      process.cwd(),
      "components",
      "utils",
      "toast",
      "AppToast.module.css"
    ),
    "utf8"
  )
  .replaceAll(/\/\*[\s\S]*?\*\//gu, "");

const globalStyles = fs.readFileSync(
  path.join(process.cwd(), "styles", "globals.css"),
  "utf8"
);

/** The declarations of the first rule whose selector matches. */
function bodyOf(css: string, selector: RegExp): string {
  for (const [, selectors = "", body = ""] of css.matchAll(
    /([^{}]+)\{([^{}]*)\}/gu
  )) {
    if (selector.test(selectors)) return body;
  }
  return "";
}

describe("toasts in 6529 Desktop", () => {
  it("offset the top position by the desktop title strip inset", () => {
    expect(bodyOf(toastStyles, /^\s*\.toastContainer\s*$/u)).toMatch(
      /--toastify-toast-top:\s*calc\([\s\S]*var\(--desktop-top-inset, 0px\)/u
    );
  });

  it("keep the offset on narrow windows, where toastify pins the top", () => {
    expect(
      bodyOf(
        toastStyles,
        /\.toastContainer:global\(\.Toastify__toast-container--top-right\)/u
      )
    ).toMatch(/top:\s*calc\([^;]*var\(--desktop-top-inset, 0px\)/u);
  });

  it("rely on the inset the page reserves for the title strip", () => {
    expect(globalStyles).toMatch(
      /:root\[data-desktop-titlebar="overlay"\]\s*\{[^}]*--desktop-top-inset:\s*var\(--desktop-titlebar-height/u
    );
  });
});

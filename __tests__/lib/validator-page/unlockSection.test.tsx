import { render } from "@testing-library/react";

import ValidatorPasswordForm from "@/components/validator-page/ValidatorPasswordForm";

// The gate reads the server's environment; the form needs only its path.
jest.mock("@/lib/validator-page/accessGate", () => ({
  VALIDATOR_UNLOCK_PATH: "/validator/unlock",
}));

function formAction(container: HTMLElement): string | null {
  return container.querySelector("form")?.getAttribute("action") ?? null;
}

describe("the password form keeps a link's section", () => {
  afterEach(() => {
    globalThis.history.replaceState(null, "", "/");
  });

  // rc.7's Tor screens link /validator#send-feedback. The fragment never
  // reaches the server, so the form carries it to the unlock address, and
  // the browser keeps it over the redirect back to the page.
  it("posts to the unlock address with the page's section", () => {
    globalThis.history.replaceState(null, "", "/validator#send-feedback");
    const { container } = render(
      <ValidatorPasswordForm nextPath="/validator" notice={null} />
    );
    expect(formAction(container)).toBe("/validator/unlock#send-feedback");
  });

  it("posts to the unlock address alone without a section", () => {
    globalThis.history.replaceState(null, "", "/validator");
    const { container } = render(
      <ValidatorPasswordForm nextPath="/validator" notice={null} />
    );
    expect(formAction(container)).toBe("/validator/unlock");
  });

  it("ignores a fragment that is no section name", () => {
    globalThis.history.replaceState(null, "", "/validator#a%22b/../c");
    const { container } = render(
      <ValidatorPasswordForm nextPath="/validator" notice={null} />
    );
    expect(formAction(container)).toBe("/validator/unlock");
  });
});

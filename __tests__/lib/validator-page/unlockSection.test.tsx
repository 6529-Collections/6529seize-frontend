import { fireEvent, render } from "@testing-library/react";

import ValidatorPasswordForm from "@/components/validator-page/ValidatorPasswordForm";

// The gate reads the server's environment; the form needs only its path.
jest.mock("@/lib/validator-page/accessGate", () => ({
  VALIDATOR_UNLOCK_PATH: "/validator/unlock",
}));

/** The address the form posts to once the tester presses Open. */
function submittedAction(): string | null {
  const { container } = render(
    <ValidatorPasswordForm nextPath="/validator" notice={null} />
  );
  const form = container.querySelector("form");
  if (!form) {
    throw new Error("no form");
  }
  expect(form.getAttribute("method")).toBe("post");
  expect(form.getAttribute("action")).toBe("/validator/unlock");
  // jsdom does not navigate; the submit event is what the browser fires
  // before it reads the form's action.
  fireEvent.submit(form);
  return form.getAttribute("action");
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
    expect(submittedAction()).toBe("/validator/unlock#send-feedback");
  });

  it("posts to the unlock address alone without a section", () => {
    globalThis.history.replaceState(null, "", "/validator");
    expect(submittedAction()).toBe("/validator/unlock");
  });

  it("ignores a fragment that is no section name", () => {
    globalThis.history.replaceState(null, "", "/validator#a%22b/../c");
    expect(submittedAction()).toBe("/validator/unlock");
  });
});

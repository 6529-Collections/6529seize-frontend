/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import {
  ValidatorFeedback,
  ValidatorUpgrade,
} from "@/components/validator-page/ValidatorSections";
import ValidatorSteps from "@/components/validator-page/ValidatorSteps";
import type { VisitorSystem } from "@/lib/validator-page/detectSystem";

function steps(system: VisitorSystem): string {
  return renderToStaticMarkup(
    <ValidatorSteps initial={{ system, cpu: null }} debs={null} />
  );
}

describe("the steps for rc.8's app", () => {
  it("tells a Windows tester to run the new Setup.exe over an earlier test release", () => {
    expect(steps("windows")).toContain(
      "If an earlier test release is installed, run the new Setup.exe over it. It replaces the earlier release, removes any extra 6529 Validator entries in Installed apps, and keeps your key and your records."
    );
    expect(steps("windows")).not.toMatch(/uninstall/i);
  });

  it("opens the Mac app from Applications, never from the disk image", () => {
    expect(steps("mac")).toContain(
      "Drag 6529 Validator to Applications, then open it from Applications, never from the disk image."
    );
  });

  it.each(["windows", "mac", "linux"] as const)(
    "offers the sign-in link on %s for a wallet in another browser",
    (system) => {
      expect(steps(system)).toContain(
        "If your wallet is in another browser, press Copy sign-in link and open the link there."
      );
    }
  );

  it.each(["windows", "mac"] as const)(
    "says on %s what the app shows while the validator service starts",
    (system) => {
      expect(steps(system)).toContain(
        "While the validator service starts, the app shows each step and what it is doing now. If one takes too long, the app says which, with Restart the validator service and Show the log."
      );
    }
  );

  // The validator's Tor screens and its Report a problem link
  // https://6529.io/validator#send-feedback.
  it("keeps the Send feedback section's id, which the validator links, and points to Report a problem", () => {
    const feedback = renderToStaticMarkup(<ValidatorFeedback />);
    expect(feedback).toContain('id="send-feedback"');
    expect(feedback).toContain(
      "In the app, Report a problem (in 6529&#x27;s logo menu) makes a cleaned report with a box for your words, for you to paste there."
    );
    expect(feedback).toContain(
      "Don&#x27;t post raw logs or status files: they show your keys and your account."
    );
  });

  it("shows the upgrade from rc.7 in the open, with an id a link can name", () => {
    const upgrade = renderToStaticMarkup(<ValidatorUpgrade />);
    expect(upgrade).toMatch(
      /^<section id="upgrading" aria-labelledby="upgrading-title"/
    );
    expect(upgrade).toContain(">Upgrading from rc.7</h2>");
    expect(upgrade).toContain("<strong");
    expect(upgrade).not.toContain("<details");
  });
});

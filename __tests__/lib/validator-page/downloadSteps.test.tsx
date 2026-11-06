/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import {
  ValidatorFeedback,
  ValidatorSwitch,
  ValidatorUpgrade,
} from "@/components/validator-page/ValidatorSections";
import ValidatorSteps from "@/components/validator-page/ValidatorSteps";
import type { VisitorSystem } from "@/lib/validator-page/detectSystem";

function steps(system: VisitorSystem): string {
  return renderToStaticMarkup(
    <ValidatorSteps initial={{ system, cpu: null }} debs={null} />
  );
}

describe("the steps for the app", () => {
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

  it("shows the upgrade from rc.8 in the open, with an id a link can name", () => {
    const upgrade = renderToStaticMarkup(
      <ValidatorUpgrade newest="0.1.0-rc.9" />
    );
    expect(upgrade).toMatch(
      /^<section id="upgrading" aria-labelledby="upgrading-title"/
    );
    expect(upgrade).toContain(">Upgrading from rc.8</h2>");
    // The Mac steps, numbered, with the command to copy.
    expect(upgrade.match(/<li/g)).toHaveLength(4);
    expect(upgrade).toContain(
      "launchctl bootout gui/$(id -u)/io.6529.validator.agent</code>"
    );
    expect(upgrade).toContain("<strong");
    expect(upgrade).not.toContain("<details");
  });

  it("shows Sunday's switch in the open, with an id a link can name", () => {
    const sunday = renderToStaticMarkup(
      <ValidatorSwitch newest="0.1.0-rc.9" />
    );
    expect(sunday).toMatch(
      /^<section id="update-before-sunday" aria-labelledby="update-before-sunday-title"/
    );
    expect(sunday).toContain(
      ">Update before Sunday 8 November, 00:00 UTC</h2>"
    );
  });

  // Merged before the signed list offers rc.9, or left after rc.10 is out,
  // a note would describe a release the page doesn't offer.
  it.each([["0.1.0-rc.8"], ["0.1.0-rc.10"], [undefined]])(
    "shows no rc.9 note while the offered release is %s",
    (newest) => {
      expect(renderToStaticMarkup(<ValidatorUpgrade newest={newest} />)).toBe(
        ""
      );
      expect(renderToStaticMarkup(<ValidatorSwitch newest={newest} />)).toBe(
        ""
      );
    }
  );
});

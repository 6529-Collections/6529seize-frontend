/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import { ValidatorFeedback } from "@/components/validator-page/ValidatorSections";
import ValidatorSteps from "@/components/validator-page/ValidatorSteps";
import type { VisitorSystem } from "@/lib/validator-page/detectSystem";

function steps(system: VisitorSystem): string {
  return renderToStaticMarkup(
    <ValidatorSteps initial={{ system, cpu: null }} debs={null} />
  );
}

describe("the steps for rc.7's app", () => {
  it("tells a Windows tester to run the new Setup.exe over an earlier test release", () => {
    expect(steps("windows")).toContain(
      "If an earlier test release is installed, run the new Setup.exe over it. It replaces the earlier release, removes any extra 6529 Validator entries in Installed apps, and keeps your key and your records."
    );
    expect(steps("windows")).not.toMatch(/uninstall/i);
  });

  it.each(["windows", "mac"] as const)(
    "says on %s what the app shows while the validator service starts",
    (system) => {
      expect(steps(system)).toContain(
        "While the validator service starts, the app shows each step. If one takes too long, the app says which, with Restart the validator service."
      );
    }
  );

  // rc.7's Tor screens link https://6529.io/validator#send-feedback.
  it("keeps the Send feedback section's id, which the validator links", () => {
    expect(renderToStaticMarkup(<ValidatorFeedback />)).toContain(
      'id="send-feedback"'
    );
  });
});

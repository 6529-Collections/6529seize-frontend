import { test } from "../testHelpers";
import { useLocalSandboxMutationGuard } from "../support/localSandbox";
import { defineSubmissionArtworkPreviewTests } from "./waveImagePreviewCases";

test.describe("Submission artwork previews @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Submission artwork tests require an isolated local mock API."
  );

  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  defineSubmissionArtworkPreviewTests();
});

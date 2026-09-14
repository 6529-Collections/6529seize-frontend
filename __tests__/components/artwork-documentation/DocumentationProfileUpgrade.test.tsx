import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentationProfileUpgrade from "@/components/artwork-documentation/DocumentationProfileUpgrade";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import profile from "@/__tests__/fixtures/artwork-documentation-profile-v3.json";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import {
  previewDocumentationUpgrade,
  upgradeDocumentationProfile,
} from "@/services/api/artwork-documentation-api";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual("@/services/api/artwork-documentation-api"),
  previewDocumentationUpgrade: jest.fn(),
  upgradeDocumentationProfile: jest.fn(),
}));
function Harness({
  initial,
}: {
  readonly initial: ApiArtworkDocumentationContext;
}) {
  const [context, setContext] = useState(initial);
  const [controller] = useState(
    () =>
      new DocumentationDraftController(
        initial,
        { save: jest.fn(), read: jest.fn() },
        (snapshot) => setContext(snapshot.context)
      )
  );
  return (
    <DocumentationProfileUpgrade context={context} controller={controller} />
  );
}
beforeEach(() => jest.clearAllMocks());
it("explains an unsaved draft instead of requesting an upgrade preview", async () => {
  const context = documentationFixture();
  const controller = new DocumentationDraftController(
    context,
    { save: jest.fn(), read: jest.fn() },
    jest.fn()
  );
  jest.spyOn(controller, "flush").mockResolvedValue(false);
  render(
    <DocumentationProfileUpgrade context={context} controller={controller} />
  );
  const user = userEvent.setup();
  await user.click(screen.getByText("Extend this artist record"));
  await user.click(
    screen.getByRole("button", { name: "Review the record update" })
  );
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(previewDocumentationUpgrade).not.toHaveBeenCalled();
  controller.dispose();
});
it("previews before applying the versioned change to the same context and preserves confirmed revision identity", async () => {
  const user = userEvent.setup();
  const context = documentationFixture();
  context.latest_revision_id = "confirmed-before";
  const next = {
    ...context,
    draft_version: 2,
    profile,
  } as unknown as ApiArtworkDocumentationContext;
  jest.mocked(previewDocumentationUpgrade).mockResolvedValue({
    current_profile: context.profile,
    proposed_profile: next.profile,
    retained_fields: ["artwork.title"],
    blocking_fields: [],
    notices: [],
    added_required_fields: ["artwork.media_profiles"],
    removed_required_fields: [],
  });
  jest.mocked(upgradeDocumentationProfile).mockResolvedValue(next);
  render(<Harness initial={context} />);
  await user.click(screen.getByText("Extend this artist record"));
  expect(upgradeDocumentationProfile).not.toHaveBeenCalled();
  await user.click(
    screen.getByRole("button", { name: "Review the record update" })
  );
  await user.click(
    await screen.findByRole("button", { name: "Apply to this draft" })
  );
  await waitFor(() =>
    expect(
      screen.queryByText("Extend this artist record")
    ).not.toBeInTheDocument()
  );
  expect(upgradeDocumentationProfile).toHaveBeenCalledWith(
    expect.objectContaining({
      id: context.id,
      draft_version: 1,
      latest_revision_id: "confirmed-before",
    }),
    expect.any(String),
    expect.any(AbortSignal)
  );
});
it("blocks private legacy material without exposing its text or enabling apply", async () => {
  const user = userEvent.setup();
  const context = documentationFixture();
  jest.mocked(previewDocumentationUpgrade).mockResolvedValue({
    current_profile: context.profile,
    proposed_profile: profile as never,
    retained_fields: [],
    blocking_fields: ["identity.private_contact"],
    notices: [],
    added_required_fields: [],
    removed_required_fields: [],
  });
  render(<Harness initial={context} />);
  await user.click(screen.getByText("Extend this artist record"));
  await user.click(
    screen.getByRole("button", { name: "Review the record update" })
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /coordinator’s review/
  );
  expect(
    screen.queryByRole("button", { name: "Apply to this draft" })
  ).not.toBeInTheDocument();
  expect(upgradeDocumentationProfile).not.toHaveBeenCalled();
});
it("lets a legacy program owner review the same-program update, while a viewer gets no mutation controls", async () => {
  const user = userEvent.setup();
  const context = documentationFixture();
  context.program_id = "6529NM-AP-01";
  context.profile.program_id = context.program_id;
  const proposed = { ...profile, program_id: context.program_id };
  jest.mocked(previewDocumentationUpgrade).mockResolvedValue({
    current_profile: context.profile,
    proposed_profile: proposed as never,
    retained_fields: [],
    blocking_fields: [],
    notices: [],
    added_required_fields: [],
    removed_required_fields: [],
  });
  const result = render(<Harness initial={context} />);
  await user.click(screen.getByText("Extend this artist record"));
  await user.click(
    screen.getByRole("button", { name: "Review the record update" })
  );
  expect(
    await screen.findByRole("button", { name: "Apply to this draft" })
  ).toBeEnabled();
  expect(upgradeDocumentationProfile).not.toHaveBeenCalled();
  context.mutation_capabilities.manage_context = false;
  result.rerender(<Harness key="viewer" initial={context} />);
  expect(
    screen.queryByText("Extend this artist record")
  ).not.toBeInTheDocument();
});
it("does not offer to apply a preview bound to a different project", async () => {
  const user = userEvent.setup();
  const context = documentationFixture();
  context.program_id = "6529NM-AP-01";
  jest.mocked(previewDocumentationUpgrade).mockResolvedValue({
    current_profile: context.profile,
    proposed_profile: profile as never,
    retained_fields: [],
    blocking_fields: [],
    notices: [],
    added_required_fields: [],
    removed_required_fields: [],
  });
  render(<Harness initial={context} />);
  await user.click(screen.getByText("Extend this artist record"));
  await user.click(
    screen.getByRole("button", { name: "Review the record update" })
  );
  await screen.findByText(/existing answers will be retained/);
  expect(
    screen.queryByRole("button", { name: "Apply to this draft" })
  ).toBeNull();
  expect(upgradeDocumentationProfile).not.toHaveBeenCalled();
});

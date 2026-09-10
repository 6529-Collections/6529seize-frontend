import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProfileCmsAgentPanel } from "@/components/profile-cms-builder/ProfileCmsAgentPanel";
import {
  createDefaultCmsBuilderState,
  validateCmsBuilderState,
  type CmsBuilderValidation,
} from "@/lib/profile-cms/builder/package";

const state = createDefaultCmsBuilderState("punk6529");
const createdAt = new Date("2026-09-10T00:00:00Z");
const initialValidation = validateCmsBuilderState(state, createdAt);
const editedValidation = validateCmsBuilderState(
  { ...state, siteTitle: "New editor title" },
  createdAt
);

function patchJson(
  validation = initialValidation,
  version = 0,
  draftId = "local-draft"
): string {
  return JSON.stringify({
    schema: "6529.cms.agent_patch.v1",
    patch_id: "patch-reviewed-title",
    target: {
      draft_id: draftId,
      base_version: version,
      base_package_hash: validation.cmsPackage.integrity.package_hash,
    },
    operations: [
      {
        op: "update_page_metadata",
        path: "/payload/pages/0/metadata/title",
        value: "Reviewed page title",
      },
    ],
    provenance: {
      created_at: createdAt.toISOString(),
      author_type: "user_agent",
      agent_name: "test-agent",
    },
  });
}

function renderPanel() {
  const onApplyPackage = jest.fn();
  const panel = (
    validation: CmsBuilderValidation,
    currentDraftVersion: number,
    draftId?: string
  ) => (
    <ProfileCmsAgentPanel
      canUseBuilderApi={false}
      currentDraftVersion={currentDraftVersion}
      draftId={draftId}
      onApplyPackage={onApplyPackage}
      validation={validation}
    />
  );
  const view = render(panel(initialValidation, 0));
  return {
    onApplyPackage,
    update: (
      validation: CmsBuilderValidation,
      version: number,
      draftId?: string
    ) => view.rerender(panel(validation, version, draftId)),
  };
}

async function reviewPatch(json = patchJson()) {
  const user = userEvent.setup();
  fireEvent.change(screen.getByLabelText("Agent patch JSON"), {
    target: { value: json },
  });
  await user.click(screen.getByRole("button", { name: "Review patch" }));
  return user;
}

describe("ProfileCmsAgentPanel current draft review", () => {
  it.each([
    {
      change: "content hash",
      validation: editedValidation,
      version: 0,
      draftId: undefined,
      message: "Patch target package hash does not match the current draft.",
    },
    {
      change: "draft version without content changes",
      validation: initialValidation,
      version: 1,
      draftId: undefined,
      message: "Patch target base version is stale for the current draft.",
    },
    {
      change: "saved draft identity without content changes",
      validation: initialValidation,
      version: 0,
      draftId: "saved-draft-2",
      message: "Patch target draft id does not match the current draft.",
    },
  ])("invalidates the accepted review when $change changes", async (next) => {
    const view = renderPanel();
    const user = await reviewPatch();
    expect(
      screen.getByRole("button", { name: "Apply to draft" })
    ).toBeEnabled();
    expect(screen.getByText("Reviewed page title")).toBeInTheDocument();

    view.update(next.validation, next.version, next.draftId);

    const apply = screen.getByRole("button", { name: "Apply to draft" });
    expect(apply).toBeDisabled();
    expect(apply).toHaveAccessibleDescription(
      expect.stringContaining(next.message)
    );
    expect(screen.getByRole("alert")).toHaveTextContent(next.message);
    expect(
      screen.queryByText("Patch validates against the current draft.")
    ).toBeNull();
    expect(screen.queryByText("Reviewed page title")).toBeNull();
    expect(screen.getByLabelText("Agent patch JSON")).toHaveValue(patchJson());
    await user.click(apply);
    expect(view.onApplyPackage).not.toHaveBeenCalled();
  });

  it("requires a fresh explicit review before applying a retargeted patch", async () => {
    const view = renderPanel();
    const user = await reviewPatch();
    view.update(editedValidation, 1);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Patch target base version is stale for the current draft."
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Patch target package hash does not match the current draft."
    );

    fireEvent.change(screen.getByLabelText("Agent patch JSON"), {
      target: { value: patchJson(editedValidation, 1) },
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Apply to draft" })
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Review patch" }));
    await user.click(screen.getByRole("button", { name: "Apply to draft" }));

    expect(view.onApplyPackage).toHaveBeenCalledTimes(1);
    expect(view.onApplyPackage).toHaveBeenCalledWith(
      expect.objectContaining({
        site: expect.objectContaining({ title: "New editor title" }),
        payload: expect.objectContaining({
          pages: expect.arrayContaining([
            expect.objectContaining({
              metadata: expect.objectContaining({
                title: "Reviewed page title",
              }),
            }),
          ]),
        }),
      })
    );
    expect(screen.getByLabelText("Agent patch JSON")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Apply to draft" })
    ).toBeDisabled();
  });

  it("preserves invalid JSON feedback when the current draft changes", async () => {
    const view = renderPanel();
    await reviewPatch("{unfinished");
    view.update(editedValidation, 1);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Patch JSON could not be parsed."
    );
    expect(
      screen.getByRole("button", { name: "Apply to draft" })
    ).toBeDisabled();
    expect(screen.getByLabelText("Agent patch JSON")).toHaveValue(
      "{unfinished"
    );
    expect(view.onApplyPackage).not.toHaveBeenCalled();
  });
});

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import ProfileCmsAgentWorkspace from "@/components/profile-cms-builder/agent/ProfileCmsAgentWorkspace";
import { downloadJsonFile } from "@/components/profile-cms-builder/ProfileCmsAgentPanel";
import {
  getCmsAgentProposal,
  listCmsAgentGrants,
  listCmsAgentProposals,
  type CmsAgentProposal,
} from "@/lib/profile-cms/builder/agent-api";
import { getProfileCmsPackageById } from "@/lib/profile-cms/builder/api";
import { createCmsAgentKit } from "@/lib/profile-cms/agent-kit";
import { instantiateCmsStudioTemplate } from "@/lib/profile-cms/studio/templates";
import {
  createBuilderStateFromPackage,
  validateCmsBuilderState,
} from "@/lib/profile-cms/builder/package";
import {
  cmsPackageSchema,
  withComputedCmsHashes,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import type { LoadedProfileCmsPackageRecord } from "@/lib/profile-cms/builder/package-normalize";

jest.mock("@/components/profile-cms-builder/ProfileCmsAgentPanel", () => ({
  downloadJsonFile: jest.fn(),
  ProfileCmsAgentPanel: ({
    onApplyPackage,
    validation,
  }: {
    onApplyPackage: (value: CmsPackageV1) => void;
    validation: { cmsPackage: CmsPackageV1 };
  }) => (
    <button onClick={() => onApplyPackage(validation.cmsPackage)}>
      Legacy apply
    </button>
  ),
}));
jest.mock("@/components/profile-cms/CmsSiteRenderer", () => ({
  __esModule: true,
  default: ({
    cmsPackage,
    page,
  }: {
    cmsPackage: CmsPackageV1;
    page: CmsPackageV1["payload"]["pages"][number];
  }) => (
    <div data-testid="preview">
      {cmsPackage.site.title} / {page.metadata.title}
    </div>
  ),
}));
jest.mock("@/lib/profile-cms/builder/api", () => ({
  getProfileCmsPackageById: jest.fn(),
}));
jest.mock("@/lib/profile-cms/builder/agent-api", () => ({
  getCmsAgentProposal: jest.fn(),
  listCmsAgentGrants: jest.fn(),
  listCmsAgentProposals: jest.fn(),
  createCmsAgentGrant: jest.fn(),
  revokeCmsAgentGrant: jest.fn(),
  recordCmsAgentProposalReview: jest.fn(),
}));

function fixture() {
  const base = instantiateCmsStudioTemplate("artist-studio", "punk6529");
  const candidate = cmsPackageSchema.parse(JSON.parse(JSON.stringify(base)));
  candidate.site.title = "Proposed studio title";
  candidate.payload.pages[1]!.metadata.title = "Complete second page";
  const proposed = withComputedCmsHashes(candidate);
  const kit = createCmsAgentKit(base);
  const file = JSON.stringify({
    ...kit.proposal_example,
    candidate_package: proposed,
    summary: "A complete website proposal",
  });
  const record: LoadedProfileCmsPackageRecord = {
    id: "base",
    profileId: "profile",
    profileHandle: "punk6529",
    packageId: base.package_id,
    version: 1,
    status: "draft",
    packageHash: base.integrity.package_hash,
    payloadHash: base.integrity.payload_hash,
    isPrimary: false,
    createdAt: "2026-09-11T00:00:00Z",
    updatedAt: "2026-09-11T00:00:00Z",
    cmsPackage: base,
  };
  const proposal: CmsAgentProposal = {
    id: "proposal",
    grant_id: "grant",
    profile_id: record.profileId,
    draft_id: record.id,
    base_version: record.version,
    base_package_hash: record.packageHash,
    candidate_package_hash: proposed.integrity.package_hash,
    candidate_package: proposed,
    created_at: Date.parse(record.createdAt),
    summary: "A complete website proposal",
    status: "pending",
    reviewed_at: null,
    result_draft_id: null,
    result_package_hash: null,
  };
  jest.mocked(getProfileCmsPackageById).mockResolvedValue(record);
  jest.mocked(listCmsAgentGrants).mockResolvedValue([]);
  jest.mocked(listCmsAgentProposals).mockResolvedValue([proposal]);
  jest.mocked(getCmsAgentProposal).mockResolvedValue(proposal);
  const props: ComponentProps<typeof ProfileCmsAgentWorkspace> = {
    canUseBuilderApi: false,
    saveBlocked: false,
    currentDraftVersion: 1,
    locale: "en-US",
    dirty: true,
    hasUnappliedJson: false,
    draftId: record.id,
    profileId: record.profileId,
    onApplyPackage: jest.fn(),
    onSaveProposal: jest.fn().mockResolvedValue(undefined),
    validation: validateCmsBuilderState(createBuilderStateFromPackage(base)),
  };
  return { base, proposed, file, record, proposal, props };
}

function upload(read: () => Promise<string>) {
  const file = new File(["proposal"], "proposal.json", {
    type: "application/json",
  });
  Object.defineProperty(file, "text", { value: read });
  fireEvent.change(screen.getByLabelText("Upload proposal"), {
    target: { files: [file] },
  });
}

beforeEach(() => jest.resetAllMocks());

it("downloads a complete multipage kit without requiring an owner session", () => {
  const { props, base } = fixture();
  render(<ProfileCmsAgentWorkspace {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Download agent kit" }));
  expect(jest.mocked(downloadJsonFile).mock.calls[0]![1]).toMatchObject({
    cms_package: base,
    proposal_example: { candidate_package: base },
  });
  expect(getProfileCmsPackageById).not.toHaveBeenCalled();
  expect(listCmsAgentProposals).not.toHaveBeenCalled();
});

it("reviews every page and preserves the complete proposal when ordinary visual edits are unsaved", async () => {
  const { props, file, proposed } = fixture();
  render(<ProfileCmsAgentWorkspace {...props} />);
  upload(async () => file);
  await screen.findByRole("button", { name: "Use in draft" });
  fireEvent.change(screen.getByLabelText("Preview page"), {
    target: { value: proposed.payload.pages[1]!.id },
  });
  expect(screen.getByTestId("preview")).toHaveTextContent(
    "Complete second page"
  );
  fireEvent.click(screen.getByRole("button", { name: "Use in draft" }));
  expect(props.onApplyPackage).toHaveBeenCalledWith(
    expect.objectContaining({
      site: proposed.site,
      payload: proposed.payload,
    })
  );
  expect(props.onSaveProposal).not.toHaveBeenCalled();
});

it.each([
  {
    locale: "en-US" as const,
    uploadLabel: "Upload proposal",
    reviewLabel: "Review the proposal",
    changesLabel: /^All changes/,
    valueLabels: ["Current draft", "Proposed website"],
  },
  {
    locale: "fr-FR" as const,
    uploadLabel: "Importer une proposition",
    reviewLabel: "Examiner la proposition",
    changesLabel: /^Toutes les modifications/,
    valueLabels: ["Brouillon actuel", "Site proposé"],
  },
])(
  "names and exposes each review scroll region to keyboard users in $locale",
  async ({ locale, uploadLabel, reviewLabel, changesLabel, valueLabels }) => {
    const { props, file } = fixture();
    render(<ProfileCmsAgentWorkspace {...props} locale={locale} />);
    const proposal = new File([file], "proposal.json", {
      type: "application/json",
    });
    Object.defineProperty(proposal, "text", { value: async () => file });
    fireEvent.change(screen.getByLabelText(uploadLabel), {
      target: { files: [proposal] },
    });
    const preview = await screen.findByRole("region", { name: reviewLabel });
    expect(preview).toHaveAttribute("tabindex", "0");
    fireEvent.click(screen.getByText(changesLabel));
    const labels = new Set<string>();
    for (const name of valueLabels) {
      for (const region of screen.getAllByRole("region", { name })) {
        expect(region.tagName).toBe("PRE");
        expect(region).toHaveAttribute("tabindex", "0");
        region.focus();
        expect(region).toHaveFocus();
        const labelId = region.getAttribute("aria-labelledby") ?? "";
        expect(document.getElementById(labelId)).toHaveTextContent(name);
        expect(labels.has(labelId)).toBe(false);
        labels.add(labelId);
      }
    }
    expect(props.onApplyPackage).not.toHaveBeenCalled();
    expect(props.onSaveProposal).not.toHaveBeenCalled();
  }
);

it("keeps an unapplied JSON edit protected when a file review is already open", async () => {
  const { props, file } = fixture();
  const view = render(<ProfileCmsAgentWorkspace {...props} />);
  upload(async () => file);
  expect(
    await screen.findByRole("button", { name: "Use in draft" })
  ).toBeEnabled();
  view.rerender(<ProfileCmsAgentWorkspace {...props} hasUnappliedJson />);
  expect(screen.getByRole("button", { name: "Use in draft" })).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Legacy apply", hidden: true })
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Use in draft" }));
  expect(props.onApplyPackage).not.toHaveBeenCalled();
});

it("does not apply an uploaded proposal while JSON edits are pending", async () => {
  const { props, file } = fixture();
  render(<ProfileCmsAgentWorkspace {...props} hasUnappliedJson />);
  upload(async () => file);
  expect(
    await screen.findByRole("button", { name: "Use in draft" })
  ).toBeDisabled();
  expect(props.onApplyPackage).not.toHaveBeenCalled();
});

it("ignores an old file read after the current document changes", async () => {
  const { props, file, base } = fixture();
  const view = render(<ProfileCmsAgentWorkspace {...props} />);
  let complete: ((value: string) => void) | undefined;
  upload(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      })
  );
  const changed = cmsPackageSchema.parse(JSON.parse(JSON.stringify(base)));
  changed.site.title = "New current draft";
  view.rerender(
    <ProfileCmsAgentWorkspace
      {...props}
      validation={validateCmsBuilderState(
        createBuilderStateFromPackage(withComputedCmsHashes(changed))
      )}
    />
  );
  await act(async () => {
    complete?.(file);
  });
  expect(
    screen.queryByRole("button", { name: "Use in draft" })
  ).not.toBeInTheDocument();
  expect(props.onApplyPackage).not.toHaveBeenCalled();
});

it("loads the chosen saved draft, reviews its full proposal, and delegates the owner save", async () => {
  const { props, proposed, proposal } = fixture();
  render(
    <ProfileCmsAgentWorkspace {...props} canUseBuilderApi dirty={false} />
  );
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  const save = await screen.findByRole("button", {
    name: "Save proposed draft",
  });
  fireEvent.change(screen.getByLabelText("Preview page"), {
    target: { value: proposed.payload.pages[1]!.id },
  });
  expect(screen.getByTestId("preview")).toHaveTextContent(
    "Complete second page"
  );
  fireEvent.click(save);
  await waitFor(() =>
    expect(props.onSaveProposal).toHaveBeenCalledWith(proposal)
  );
  expect(props.onApplyPackage).not.toHaveBeenCalled();
});

it("drops late connected results when changing the selected draft", async () => {
  const { props, record, proposal } = fixture();
  let complete: ((value: CmsAgentProposal[]) => void) | undefined;
  jest.mocked(listCmsAgentProposals).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      })
  );
  const view = render(
    <ProfileCmsAgentWorkspace {...props} canUseBuilderApi dirty={false} />
  );
  await waitFor(() => expect(listCmsAgentProposals).toHaveBeenCalled());
  jest
    .mocked(getProfileCmsPackageById)
    .mockResolvedValue({ ...record, id: "new-draft" });
  jest.mocked(listCmsAgentProposals).mockResolvedValue([]);
  view.rerender(
    <ProfileCmsAgentWorkspace
      {...props}
      canUseBuilderApi
      dirty={false}
      draftId="new-draft"
    />
  );
  await act(async () => {
    complete?.([proposal]);
  });
  expect(await screen.findByText(/No proposals yet/)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Review" })
  ).not.toBeInTheDocument();
});

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/Auth";
import ProfileCmsBuilder from "@/components/profile-cms-builder/ProfileCmsBuilder";
import { publicEnv } from "@/config/env";
import * as cmsApi from "@/lib/profile-cms/builder/api";
import * as cmsImageUpload from "@/lib/profile-cms/studio/image-upload";
import {
  buildCmsPackageCandidate,
  createDefaultCmsBuilderState,
} from "@/lib/profile-cms/builder/package";
import {
  cmsPackageSchema,
  withComputedCmsHashes,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import { instantiateCmsStudioTemplate } from "@/lib/profile-cms/studio/templates";
import roomFixture from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/exhibition-room.package.json";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return { ...actual, publicEnv: { ...actual.publicEnv } };
});
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({
  getStructuredApiErrorStatus: jest.requireActual("@/services/api/common-api")
    .getStructuredApiErrorStatus,
  commonApiPost: jest.fn(),
  commonApiFetch: jest.fn(async () => []),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    readonly href: string;
    readonly children: ReactNode;
    readonly className?: string;
  }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0x0000000000000000000000000000000000000001",
    isConnected: true,
    isSafeWallet: false,
  }),
}));
jest.mock("@/hooks/profile-cms/useProfileCmsPublishSign", () => ({
  useProfileCmsPublishSign: () => ({
    signerAddress: "0x0000000000000000000000000000000000000001",
    isConnected: true,
    chainId: 1,
    isSafe: false,
    signTypedData: jest.fn(),
  }),
}));
const auth = jest.mocked(useAuth);
const createObjectUrl = jest.fn<string, [Blob | MediaSource]>(
  () => "blob:cms-export"
);
const NativeBlob = globalThis.Blob;
class CapturedBlob extends NativeBlob {
  constructor(
    readonly parts: BlobPart[] = [],
    options?: BlobPropertyBag
  ) {
    super(parts, options);
  }
}
const recoveryKey =
  "profile-cms-recovery-v1:profile:0x0000000000000000000000000000000000000001";
function owner(isAuthenticated: boolean | undefined) {
  auth.mockReturnValue({
    isAuthenticated,
    activeProfileProxy: null,
    connectedProfile: { id: "profile" },
  } as ReturnType<typeof useAuth>);
}
function showBuilder() {
  return render(
    <ProfileCmsBuilder handle="punk6529" profileId="profile" title="Builder" />
  );
}
function click(name: string) {
  fireEvent.click(
    screen.getByRole("button", {
      name: name === "Apply" ? "Apply changes" : name,
    })
  );
}
function tab(name: "JSON" | "Agent") {
  const details = screen.getByText("More tools").closest("details");
  if (details && !details.open)
    fireEvent.click(details.querySelector("summary")!);
  click(name);
}
function currentPackage(): CmsPackageV1 {
  tab("JSON");
  return cmsPackageSchema.parse(
    JSON.parse(
      (screen.getByLabelText("Package candidate") as HTMLTextAreaElement).value
    )
  );
}
function importPackage(
  document = buildCmsPackageCandidate(createDefaultCmsBuilderState("punk6529"))
) {
  tab("JSON");
  fireEvent.change(screen.getByLabelText("Package candidate"), {
    target: { value: JSON.stringify(document) },
  });
  click("Import JSON");
  return document;
}
function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
function saveMock() {
  return jest.spyOn(cmsApi, "runProfileCmsBuilderAction").mockResolvedValue({
    ok: true,
    action: "save_draft",
    code: "draft_saved",
    draftId: "saved-id",
  });
}
function patch(hash: string, operations: unknown[]) {
  return {
    schema: "6529.cms.agent_patch.v1",
    patch_id: "patch-test",
    target: {
      draft_id: "local-draft",
      base_version: 1,
      base_package_hash: hash,
    },
    operations,
    provenance: {
      created_at: "2026-06-18T00:00:00.000Z",
      author_type: "user_agent",
      agent_name: "component-test-agent",
    },
  };
}
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  publicEnv.PROFILE_CMS_BUILDER_API_ENABLED = "true";
  delete publicEnv.NEXT_PUBLIC_PROFILE_CMS_BUILDER_API_ENABLED;
  owner(true);
  Object.defineProperty(globalThis, "Blob", {
    configurable: true,
    value: CapturedBlob,
  });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectUrl,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: jest.fn(),
  });
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: () => "unique-test-id",
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(globalThis, "Blob", {
    configurable: true,
    value: NativeBlob,
  });
});

it.each([false, undefined])(
  "requires owner authentication for saves even with stale profile metadata (%s)",
  (authenticated) => {
    owner(authenticated);
    showBuilder();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
    expect(screen.getByText(/Sign in as this profile’s owner/)).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: "Publish" })[0]
    ).toBeDisabled();
  }
);
it("allows guests to choose a template and edit it with the real renderer", () => {
  owner(false);
  showBuilder();
  fireEvent.click(screen.getByRole("button", { name: "Preview Signature" }));
  click("Use this template");
  change("Page title", "My website");
  click("Apply");
  click("Preview");
  expect(
    screen.getByRole("heading", { name: "Mira, at the intersection." })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
  click("Edit");
  expect(currentPackage().payload.pages[0]!.metadata.title).toBe("My website");
});
it("blocks Save, outer tabs and preview without discarding pending page fields", () => {
  const save = saveMock();
  showBuilder();
  importPackage();
  change("Page title", "Pending title");
  expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
  click("Versions");
  click("Preview");
  expect(screen.getByLabelText("Page title")).toHaveValue("Pending title");
  expect(screen.getByLabelText("Page title")).toHaveFocus();
  click("Save draft");
  expect(save).not.toHaveBeenCalled();
});

it("blocks save and navigation while an image upload could change the draft, with cancellation available", () => {
  const upload = jest
    .spyOn(cmsImageUpload, "uploadCmsStudioImage")
    .mockImplementation(
      async ({ signal }) =>
        await new Promise((_resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(new Error("cancelled")),
            { once: true }
          );
        })
    );
  const save = saveMock();
  showBuilder();
  importPackage();
  click("Add your art");
  fireEvent.change(screen.getByLabelText("Image file"), {
    target: { files: [new File(["image"], "file.png", { type: "image/png" })] },
  });
  change("Alt text", "New work");
  click("Upload and add image");
  expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
  click("Versions");
  click("Pages");
  expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
  click("Save draft");
  expect(save).not.toHaveBeenCalled();
  click("Cancel");
  expect(upload.mock.calls[0]![0].signal.aborted).toBe(true);
  expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
});
it("retains invalid fields and focuses the invalid slug until corrected or discarded", async () => {
  showBuilder();
  const original = importPackage();
  change("Page title", "Keep my title");
  change("Page address", "../invalid");
  click("Apply");
  await waitFor(() =>
    expect(screen.getByLabelText("Page address")).toHaveFocus()
  );
  expect(screen.getByLabelText("Page title")).toHaveValue("Keep my title");
  expect(screen.getByLabelText("Page address")).toHaveAttribute(
    "aria-invalid",
    "true"
  );
  click("Discard form changes");
  expect(screen.getByLabelText("Page title")).toHaveValue(
    original.payload.pages[0]!.metadata.title
  );
  expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
});
it("applies one atomic form change, saves that version, and keeps undo across outer tabs", async () => {
  const save = saveMock();
  showBuilder();
  const original = importPackage();
  change("Page title", "Applied title");
  change("Description for search and sharing", "Description edited together");
  click("Apply");
  click("Save draft");
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(
    save.mock.calls[0]![0].cmsPackage.payload.pages[0]!.metadata
  ).toMatchObject({
    title: "Applied title",
    description: "Description edited together",
  });
  expect(
    screen
      .getAllByText("Draft saved.")
      .some((element) => element.getAttribute("role") === "status")
  ).toBe(true);
  tab("JSON");
  click("Editor");
  click("↶ Undo");
  expect(screen.getByLabelText("Page title")).toHaveValue(
    original.payload.pages[0]!.metadata.title
  );
  click("↷ Redo");
  expect(screen.getByLabelText("Page title")).toHaveValue("Applied title");
});
it("blocks undo and palette mutation while design text is pending", () => {
  showBuilder();
  importPackage();
  change("Page title", "Applied first");
  click("Apply");
  click("Design");
  change("Site name", "Pending site title");
  click("↶ Undo");
  change("Palette", "night");
  expect(screen.getByLabelText("Site name")).toHaveValue("Pending site title");
  expect(screen.getByLabelText("Palette")).not.toHaveValue("night");
  click("Apply");
  click("↶ Undo");
  expect(screen.getByLabelText("Site name")).toHaveValue("punk6529");
});
it("keeps section fields through blocked navigation and preserves other pages and sources", () => {
  showBuilder();
  const original = importPackage(
    instantiateCmsStudioTemplate("signature", "punk6529")
  );
  click("Content");
  const text = original.payload.pages[0]!.blocks.find(
    (block) => block.block_type === "rich_text"
  ) as Record<string, unknown>;
  fireEvent.click(screen.getAllByRole("button", { name: "Text" })[0]!);
  change("Text", "My edited section");
  click("Pages");
  expect(screen.getByLabelText("Text")).toHaveValue("My edited section");
  click("Apply");
  const result = currentPackage();
  expect(
    result.payload.pages[0]!.blocks.find((block) => block.id === text["id"])
  ).toMatchObject({ id: text["id"], content: "My edited section" });
  expect(result.payload.pages.slice(1)).toEqual(
    original.payload.pages.slice(1)
  );
  expect(result.payload.source_packets).toEqual(
    original.payload.source_packets
  );
});
it("resets sharing image and sets noindex without changing internal search visibility", () => {
  showBuilder();
  const document = instantiateCmsStudioTemplate("signature", "punk6529");
  document.payload.pages[0]!.metadata.social_image_asset_id =
    document.payload.assets[0]!.id;
  document.payload.pages[0]!.metadata.search = "exclude";
  importPackage(withComputedCmsHashes(document));
  change("Sharing image", "");
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: "Allow search engines to index this page",
    })
  );
  click("Apply");
  const metadata = currentPackage().payload.pages[0]!.metadata;
  expect(metadata.robots).toBe("noindex");
  expect(metadata.search).toBe("exclude");
  expect(metadata).not.toHaveProperty("social_image_asset_id");
});
it("preserves full imported room content when changing site metadata", () => {
  showBuilder();
  const original = importPackage(
    withComputedCmsHashes(cmsPackageSchema.parse(roomFixture))
  );
  expect(currentPackage()).toEqual(original);
  importPackage(
    withComputedCmsHashes({
      ...original,
      site: { ...original.site, title: "Imported site" },
    })
  );
  click("Design");
  expect(screen.getByLabelText("Site name")).toHaveValue("Imported site");
  expect(currentPackage().payload).toEqual(original.payload);
});
it("downloads package, source packet and schema bundle from the JSON workspace", () => {
  showBuilder();
  const original = importPackage();
  tab("JSON");
  click("Download package JSON");
  click("Download source packet");
  click("Download schemas");
  expect(createObjectUrl).toHaveBeenCalledTimes(3);
  const contents = createObjectUrl.mock.calls.map(
    ([blob]) =>
      JSON.parse((blob as CapturedBlob).parts.join("")) as Record<
        string,
        unknown
      >
  );
  expect(contents[0]).toEqual(original);
  expect(contents[1]).toMatchObject({
    schema: "6529.cms.builder_source_packet.v1",
    draft: { base_version: 1 },
  });
  expect(contents[2]).toHaveProperty("schema");
});
it("keeps incomplete JSON across tabs and blocks saves until explicit discard", () => {
  showBuilder();
  importPackage();
  tab("JSON");
  change("Package candidate", "{ unfinished");
  click("Editor");
  expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
  tab("JSON");
  expect(screen.getByLabelText("Package candidate")).toHaveValue(
    "{ unfinished"
  );
  change("Package candidate", "");
  expect(screen.getByLabelText("Package candidate")).toHaveValue("");
  jest.spyOn(globalThis, "confirm").mockReturnValue(true);
  click("Discard JSON changes");
  expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
});
it("recovers applied content and invalid JSON only after explicit same-scope recovery", async () => {
  const first = showBuilder();
  importPackage();
  change("Page title", "Recover my title");
  click("Apply");
  tab("JSON");
  change("Package candidate", "{ incomplete recovery");
  await waitFor(() =>
    expect(localStorage.getItem(recoveryKey)).toContain("{ incomplete recovery")
  );
  first.unmount();
  showBuilder();
  expect(screen.queryByLabelText("Page title")).toBeNull();
  click("Recover draft");
  expect(screen.getByLabelText("Package candidate")).toHaveValue(
    "{ incomplete recovery"
  );
  jest.spyOn(globalThis, "confirm").mockReturnValue(true);
  click("Discard JSON changes");
  click("Editor");
  expect(screen.getByLabelText("Page title")).toHaveValue("Recover my title");
});
it("clears active form state when the authenticated profile changes", () => {
  const view = showBuilder();
  importPackage();
  change("Page title", "Private pending draft");
  auth.mockReturnValue({
    isAuthenticated: true,
    activeProfileProxy: null,
    connectedProfile: { id: "another-profile" },
  } as ReturnType<typeof useAuth>);
  view.rerender(
    <ProfileCmsBuilder handle="punk6529" profileId="profile" title="Builder" />
  );
  expect(screen.queryByDisplayValue("Private pending draft")).toBeNull();
  expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
});
it("surfaces failed saves in the editor instead of hiding feedback in details", async () => {
  jest.spyOn(cmsApi, "runProfileCmsBuilderAction").mockResolvedValue({
    ok: false,
    action: "save_draft",
    code: "request_failed",
    expectedEndpoint: "profile-cms/packages",
  });
  showBuilder();
  importPackage();
  click("Save draft");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Builder API action failed."
  );
  expect(screen.getByLabelText("Page title")).toBeVisible();
});
it("reviews Agent changes before applying them and does not grant save authority", () => {
  owner(false);
  showBuilder();
  const original = importPackage();
  tab("Agent");
  change(
    "Agent patch JSON",
    JSON.stringify(
      patch(original.integrity.package_hash, [
        {
          op: "update_page_metadata",
          path: "/payload/pages/0/metadata",
          value: { title: "Agent revised title" },
        },
      ])
    )
  );
  click("Review patch");
  expect(
    screen.getByText("Patch validates against the current draft.")
  ).toBeInTheDocument();
  click("Apply to draft");
  click("Editor");
  expect(screen.getByLabelText("Page title")).toHaveValue(
    "Agent revised title"
  );
  expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
});
it("rejects unsafe Agent patches and oversized patch files", async () => {
  showBuilder();
  const original = importPackage();
  tab("Agent");
  change(
    "Agent patch JSON",
    JSON.stringify(
      patch(original.integrity.package_hash, [
        {
          op: "add_block",
          path: "/payload/pages/0/blocks",
          value: {
            id: "bad-link",
            block_type: "button_link",
            label: "Unsafe",
            href: "javascript:alert(1)",
          },
        },
      ])
    )
  );
  click("Review patch");
  expect(
    screen.getByText("Patch was rejected before it could change the draft.")
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Apply to draft" })).toBeDisabled();
  const file = new File(["{}"], "patch.json", { type: "application/json" });
  Object.defineProperty(file, "size", { value: 2 * 1024 * 1024 + 1 });
  fireEvent.change(screen.getByLabelText("Upload patch"), {
    target: { files: [file] },
  });
  await waitFor(() =>
    expect(screen.getByLabelText("Agent patch JSON")).toHaveValue("")
  );
});
it("loads the exact saved package through Versions and saves the applied revision", async () => {
  const document = instantiateCmsStudioTemplate("signature", "punk6529");
  const record = {
    id: "saved-id",
    profileId: "profile",
    profileHandle: "punk6529",
    packageId: document.package_id,
    version: 7,
    status: "published" as const,
    isPrimary: true,
    createdAt: "2026-09-10T12:00:00Z",
    updatedAt: "2026-09-10T12:00:00Z",
    packageHash: document.integrity.package_hash,
    payloadHash: document.integrity.payload_hash,
    cmsPackage: document,
  };
  jest
    .spyOn(cmsApi, "listProfileCmsPackagesForProfile")
    .mockResolvedValue([record]);
  jest.spyOn(cmsApi, "getProfileCmsPackageById").mockResolvedValue(record);
  const save = saveMock();
  showBuilder();
  click("Versions");
  fireEvent.click(await screen.findByRole("button", { name: "Load" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Page title")).toHaveValue(
      document.payload.pages[0]!.metadata.title
    )
  );
  expect(currentPackage()).toEqual(document);
  click("Editor");
  change("Page title", "Next publication");
  click("Apply");
  click("Save draft");
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(
    save.mock.calls[0]![0].cmsPackage.payload.pages[0]!.metadata.title
  ).toBe("Next publication");
});
it("does not accept late save responses after the owner scope changes", async () => {
  let resolve!: (value: cmsApi.ProfileCmsBuilderActionResult) => void;
  jest.spyOn(cmsApi, "runProfileCmsBuilderAction").mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  const view = showBuilder();
  importPackage();
  click("Save draft");
  auth.mockReturnValue({
    isAuthenticated: false,
    connectedProfile: null,
    activeProfileProxy: null,
  } as ReturnType<typeof useAuth>);
  view.rerender(
    <ProfileCmsBuilder handle="punk6529" profileId="profile" title="Builder" />
  );
  await act(async () =>
    resolve({
      ok: true,
      action: "save_draft",
      code: "draft_saved",
      draftId: "old-owner-draft",
    })
  );
  expect(screen.queryByText("Draft saved.")).toBeNull();
});

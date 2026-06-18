import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { useAuth } from "@/components/auth/Auth";
import ProfileCmsBuilder from "@/components/profile-cms-builder/ProfileCmsBuilder";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
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
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const useAuthMock = useAuth as jest.Mock;
const commonApiPostMock = commonApiPost as jest.Mock;
const createObjectUrlMock = jest.fn(() => "blob:cms-export");
const revokeObjectUrlMock = jest.fn();

describe("ProfileCmsBuilder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis.URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(globalThis.URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrlMock,
    });
    delete process.env["PROFILE_CMS_BUILDER_API_ENABLED"];
    delete process.env["NEXT_PUBLIC_PROFILE_CMS_BUILDER_API_ENABLED"];
    useAuthMock.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: null,
    });
  });

  it("edits homepage content and previews with the real CMS renderer", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    await user.clear(screen.getByLabelText("Page title"));
    await user.type(screen.getByLabelText("Page title"), "Builder homepage");
    await user.click(screen.getByRole("button", { name: "Callout" }));
    await user.click(screen.getByRole("button", { name: "Preview" }));

    expect(
      screen.getByRole("heading", { name: "Builder homepage", level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText("Add a short callout.")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "punk6529 navigation" })
    ).toBeInTheDocument();
  });

  it("exports package JSON and imports a modified candidate", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    await user.click(screen.getByRole("button", { name: "JSON" }));
    const jsonEditor = screen.getByLabelText(
      "Package candidate"
    ) as HTMLTextAreaElement;
    const exported = JSON.parse(jsonEditor.value) as {
      site: { title: string };
    };
    exported.site.title = "Imported site";

    fireEvent.change(jsonEditor, {
      target: { value: JSON.stringify(exported) },
    });
    await user.click(screen.getByRole("button", { name: "Import JSON" }));

    expect(screen.getByLabelText("Site title")).toHaveValue("Imported site");
  });

  it("downloads package, source packet, and schema bundle JSON", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    await user.click(screen.getByRole("button", { name: "JSON" }));
    await user.click(
      screen.getByRole("button", { name: "Download package JSON" })
    );
    await user.click(
      screen.getByRole("button", { name: "Download source packet" })
    );
    await user.click(screen.getByRole("button", { name: "Download schemas" }));

    expect(createObjectUrlMock).toHaveBeenCalledTimes(3);
    const packageBlob = createObjectUrlMock.mock.calls[0]?.[0] as Blob;
    const sourceBlob = createObjectUrlMock.mock.calls[1]?.[0] as Blob;
    const schemaBlob = createObjectUrlMock.mock.calls[2]?.[0] as Blob;
    await expect(readBlobText(packageBlob)).resolves.toContain(
      '"schema": "6529.cms.package.v1"'
    );
    await expect(readBlobText(sourceBlob)).resolves.toContain(
      '"schema": "6529.cms.builder_source_packet.v1"'
    );
    await expect(readBlobText(schemaBlob)).resolves.toContain(
      '"schema": "6529.cms.builder_schema_bundle.v1"'
    );
  });

  it("exports source packets with the current draft version after edits", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    await user.clear(screen.getByLabelText("Page title"));
    await user.type(screen.getByLabelText("Page title"), "Versioned draft");
    await user.click(screen.getByRole("button", { name: "JSON" }));
    await user.click(
      screen.getByRole("button", { name: "Download source packet" })
    );

    const sourceBlob = createObjectUrlMock.mock.calls[0]?.[0] as Blob;
    const sourcePacket = JSON.parse(await readBlobText(sourceBlob)) as {
      draft: { base_version: number };
    };
    expect(sourcePacket.draft.base_version).toBeGreaterThan(0);
  });

  it("reviews an agent patch and applies it only after explicit approval", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    const packageHash = await getCurrentPackageHash(user);
    await user.click(screen.getByRole("button", { name: "Agent" }));
    fireEvent.change(screen.getByLabelText("Agent patch JSON"), {
      target: {
        value: JSON.stringify(
          buildAgentPatch(packageHash, [
            {
              op: "update_page_metadata",
              path: "/payload/pages/0/metadata/title",
              value: "Agent reviewed homepage",
              reason: "Tighten the homepage title.",
            },
          ])
        ),
      },
    });
    await user.click(screen.getByRole("button", { name: "Review patch" }));

    expect(
      screen.getByText("Patch validates against the current draft.")
    ).toBeInTheDocument();
    expect(screen.getByText("Agent reviewed homepage")).toBeInTheDocument();
    expect(commonApiPostMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Apply to draft" }));

    expect(
      screen.getByText("Patch applied to this draft.")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Editor" }));
    expect(screen.getByLabelText("Page title")).toHaveValue(
      "Agent reviewed homepage"
    );
    expect(commonApiPostMock).not.toHaveBeenCalled();
  });

  it("rejects unsafe agent patches and keeps apply disabled", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    const packageHash = await getCurrentPackageHash(user);
    await user.click(screen.getByRole("button", { name: "Agent" }));
    fireEvent.change(screen.getByLabelText("Agent patch JSON"), {
      target: {
        value: JSON.stringify(
          buildAgentPatch(packageHash, [
            {
              op: "add_block",
              path: "/payload/pages/0/blocks/-",
              value: {
                id: "block-unsafe-link",
                block_type: "button_link",
                label: "Unsafe link",
                href: "javascript:alert(1)",
              },
              reason: "Injected link.",
            },
          ])
        ),
      },
    });
    await user.click(screen.getByRole("button", { name: "Review patch" }));

    expect(
      screen.getByText("Patch was rejected before it could change the draft.")
    ).toBeInTheDocument();
    expect(screen.getByText("Code: block.unsafe_url")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Apply to draft" })
    ).toBeDisabled();
  });

  it("does not turn agent patch import into backend authority", async () => {
    const user = userEvent.setup();
    process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
    useAuthMock.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { id: "profile-other" },
    });

    render(
      <ProfileCmsBuilder
        handle="punk6529"
        profileId="profile-punk6529"
        title="Profile CMS builder"
      />
    );

    const packageHash = await getCurrentPackageHash(user);
    await user.click(screen.getByRole("button", { name: "Agent" }));
    fireEvent.change(screen.getByLabelText("Agent patch JSON"), {
      target: {
        value: JSON.stringify(
          buildAgentPatch(packageHash, [
            {
              op: "update_theme",
              path: "/site/theme/accent",
              value: "#ffffff",
            },
          ])
        ),
      },
    });
    await user.click(screen.getByRole("button", { name: "Review patch" }));
    await user.click(screen.getByRole("button", { name: "Apply to draft" }));

    expect(commonApiPostMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(commonApiPostMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Connect as this profile before using backend builder actions."
      )
    ).toBeInTheDocument();
  });

  it("keeps publish honest when backend writes are disabled", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { id: "profile-punk6529" },
    });
    render(
      <ProfileCmsBuilder
        handle="punk6529"
        profileId="profile-punk6529"
        title="Profile CMS builder"
      />
    );

    await user.click(screen.getByRole("button", { name: "Save draft" }));

    const statePanel = screen.getByRole("heading", {
      name: "Draft and publish state",
    }).parentElement;
    expect(statePanel).not.toBeNull();
    expect(
      within(statePanel as HTMLElement).getByText(
        "Builder API writes are not enabled in this frontend environment."
      )
    ).toBeInTheDocument();
    expect(
      within(statePanel as HTMLElement).getByText("profile-cms/packages")
    ).toBeInTheDocument();
  });

  it("blocks draft saves unless the connected profile owns the target", async () => {
    const user = userEvent.setup();
    process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
    useAuthMock.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { id: "profile-other" },
    });

    render(
      <ProfileCmsBuilder
        handle="punk6529"
        profileId="profile-punk6529"
        title="Profile CMS builder"
      />
    );

    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(commonApiPostMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Connect as this profile before using backend builder actions."
      )
    ).toBeInTheDocument();
  });

  it("blocks server validation unless the connected profile owns the target", async () => {
    const user = userEvent.setup();
    process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
    useAuthMock.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { id: "profile-other" },
    });

    render(
      <ProfileCmsBuilder
        handle="punk6529"
        profileId="profile-punk6529"
        title="Profile CMS builder"
      />
    );

    await user.click(screen.getByRole("button", { name: "Server validate" }));

    expect(commonApiPostMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Connect as this profile before using backend builder actions."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("profile-cms/packages/validate")
    ).toBeInTheDocument();
  });

  it("requests a fixture wallet snapshot and previews the generated gallery", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    await user.click(screen.getByRole("button", { name: "Wallet gallery" }));
    await user.click(screen.getByRole("button", { name: "Request snapshot" }));

    expect(await screen.findByText("Fixture snapshot")).toBeInTheDocument();
    expect(screen.getByText("The Memes #1")).toBeInTheDocument();
    expect(screen.getAllByText("Media pending").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Preview" }));

    expect(
      screen.getByRole("heading", { name: "punk6529 Gallery", level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText("Wallet gallery")).toBeInTheDocument();
    expect(
      screen.getAllByAltText("The Memes by 6529 card number 1").length
    ).toBeGreaterThan(0);
  });

  it("validates wallet input before requesting a gallery snapshot", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    await user.click(screen.getByRole("button", { name: "Wallet gallery" }));
    fireEvent.change(screen.getByLabelText("Wallets or ENS names"), {
      target: { value: "not_a_wallet!" },
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Wallets or ENS names")).toHaveValue(
        "not_a_wallet!"
      )
    );
    await user.click(screen.getByRole("button", { name: "Request snapshot" }));

    expect(
      await screen.findByText(
        "These wallet entries need attention: not_a_wallet!"
      )
    ).toBeInTheDocument();
    expect(commonApiPostMock).not.toHaveBeenCalled();
  });

  it("updates hide, feature, and priority controls for reviewed works", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    await user.click(screen.getByRole("button", { name: "Wallet gallery" }));
    await user.click(screen.getByRole("button", { name: "Request snapshot" }));
    expect(await screen.findByText("The Memes #1")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Hide" })[0]!);
    expect(screen.getByRole("button", { name: "Unhide" })).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "Feature work" })[0]!
    );
    expect(
      screen.getAllByRole("button", { name: "Unfeature work" }).length
    ).toBeGreaterThan(1);

    await user.click(screen.getAllByRole("button", { name: "Move down" })[0]!);
    const workHeadings = screen.getAllByRole("heading", { level: 4 });
    expect(workHeadings[0]).toHaveTextContent("The Memes #2");

    await user.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.queryByAltText("The Memes by 6529 card number 1")).toBeNull();
    expect(
      screen.getAllByAltText("The Memes by 6529 card number 2").length
    ).toBeGreaterThan(0);
  });

  it("does not show a stale save result after edits during the request", async () => {
    const user = userEvent.setup();
    process.env["PROFILE_CMS_BUILDER_API_ENABLED"] = "true";
    useAuthMock.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { id: "profile-punk6529" },
    });
    let resolvePost:
      | ((value: { draft_id: string; package_hash: string }) => void)
      | undefined;
    commonApiPostMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        })
    );

    render(
      <ProfileCmsBuilder
        handle="punk6529"
        profileId="profile-punk6529"
        title="Profile CMS builder"
      />
    );

    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await user.clear(screen.getByLabelText("Page title"));
    await user.type(screen.getByLabelText("Page title"), "Changed draft");
    await act(async () => {
      resolvePost?.({ draft_id: "draft-1", package_hash: "hash-1" });
    });

    expect(screen.queryByText("Draft saved.")).not.toBeInTheDocument();
    expect(screen.queryByText("draft-1")).not.toBeInTheDocument();
  });

  it("keeps production publish disabled until the signed storage flow exists", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { id: "profile-punk6529" },
    });
    render(
      <ProfileCmsBuilder
        handle="punk6529"
        profileId="profile-punk6529"
        title="Profile CMS builder"
      />
    );

    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(
      screen.getByText(
        "Publishing needs the signed decentralized storage flow and is not enabled in this MVP."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("profile-cms/packages/:id/publish")
    ).toBeInTheDocument();
  });

  it("blocks publish unless the connected profile owns the target", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { id: "profile-other" },
    });

    render(
      <ProfileCmsBuilder
        handle="punk6529"
        profileId="profile-punk6529"
        title="Profile CMS builder"
      />
    );

    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(
      screen.getByText(
        "Connect as this profile before using backend builder actions."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("profile-cms/packages/:id/publish")
    ).toBeInTheDocument();
  });

  it("adds a 3D room primitive and previews it through the CMS renderer", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    await user.click(screen.getAllByRole("button", { name: "3D room" })[0]);
    expect(screen.getByLabelText("Room style")).toHaveValue("white_cube");
    await user.clear(screen.getByLabelText("Room work title"));
    await user.type(
      screen.getByLabelText("Room work title"),
      "Builder Room Work"
    );
    await user.click(screen.getByRole("button", { name: "Preview" }));

    expect(
      screen.getByRole("button", { name: "Enter room" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Builder Room Work" })
    ).toHaveAttribute("href", "/punk6529/rooms/work-4/index.html");
  });
});

async function getCurrentPackageHash(
  user: ReturnType<typeof userEvent.setup>
): Promise<string> {
  await user.click(screen.getByRole("button", { name: "JSON" }));
  const jsonEditor = screen.getByLabelText(
    "Package candidate"
  ) as HTMLTextAreaElement;
  const exported = JSON.parse(jsonEditor.value) as {
    integrity: { package_hash: string };
  };
  return exported.integrity.package_hash;
}

function buildAgentPatch(
  packageHash: string,
  operations: readonly Record<string, unknown>[]
): Record<string, unknown> {
  return {
    schema: "6529.cms.agent_patch.v1",
    patch_id: "patch-test",
    target: {
      draft_id: "local-draft",
      base_version: 0,
      base_package_hash: packageHash,
    },
    operations,
    provenance: {
      created_at: "2026-06-18T00:00:00.000Z",
      author_type: "user_agent",
      agent_name: "component-test-agent",
    },
  };
}

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

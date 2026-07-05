import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProfileCmsPublishPanel from "@/components/profile-cms-builder/ProfileCmsPublishPanel";
import { useProfileCmsPublishSign } from "@/hooks/profile-cms/useProfileCmsPublishSign";
import {
  prepareProfileCmsPublish,
  signAndPublishProfileCms,
  type ProfileCmsPublishContext,
} from "@/lib/profile-cms/builder/publish";
import {
  buildCmsPackageCandidate,
  createDefaultCmsBuilderState,
} from "@/lib/profile-cms/builder/package";

jest.mock("@/hooks/profile-cms/useProfileCmsPublishSign", () => ({
  useProfileCmsPublishSign: jest.fn(),
}));

jest.mock("@/lib/profile-cms/builder/publish", () => {
  const actual = jest.requireActual("@/lib/profile-cms/builder/publish");
  return {
    ...actual,
    prepareProfileCmsPublish: jest.fn(),
    signAndPublishProfileCms: jest.fn(),
  };
});

const useSignMock = useProfileCmsPublishSign as jest.Mock;
const prepareMock = prepareProfileCmsPublish as jest.Mock;
const signPublishMock = signAndPublishProfileCms as jest.Mock;

const cmsPackage = buildCmsPackageCandidate(
  createDefaultCmsBuilderState("punk6529")
);

const context: ProfileCmsPublishContext = {
  draftId: "draft-1",
  profileId: "profile-1",
  handle: "punk6529",
  packageId: "pkg-punk6529-builder-mvp",
  version: 1,
  payloadHash: "sha256:aa",
  packageHash: "sha256:bb",
  primaryPath: "/punk6529/index.html",
  receipt: {
    provider: "arweave",
    uri: "ar://tx",
    content_hash: "sha256:bb",
    canonical: true,
    recorded_at: "2026-07-05T00:00:00.000Z",
  },
};

const renderPanel = (
  overrides: Partial<React.ComponentProps<typeof ProfileCmsPublishPanel>> = {}
) =>
  render(
    <ProfileCmsPublishPanel
      canPublish
      canUseBuilderApi
      cmsPackage={cmsPackage}
      profileId="profile-1"
      {...overrides}
    />
  );

describe("ProfileCmsPublishPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSignMock.mockReturnValue({
      signTypedData: jest.fn(async () => ({ ok: true, signature: "0xsig" })),
      chainId: 1,
      signerAddress: "0xowner",
      isConnected: true,
      isSafe: false,
    });
  });

  it("renders the four publish steps", () => {
    renderPanel();
    expect(screen.getByText("Save and validate draft")).toBeInTheDocument();
    expect(screen.getByText("Upload to storage")).toBeInTheDocument();
    expect(screen.getByText("Sign with wallet")).toBeInTheDocument();
    expect(screen.getByText("Publish primary pointer")).toBeInTheDocument();
  });

  it("shows the published URL as a link on success", async () => {
    const user = userEvent.setup();
    prepareMock.mockResolvedValue({ ok: true, context });
    signPublishMock.mockResolvedValue({
      ok: true,
      published: { profileHandle: "punk6529" },
      publishedUrl: "https://6529.io/punk6529/index.html",
    });
    const onPublished = jest.fn();
    renderPanel({ onPublished });

    await user.click(screen.getByRole("button", { name: "Publish website" }));

    await waitFor(() => {
      expect(
        screen.getByRole("link", {
          name: "https://6529.io/punk6529/index.html",
        })
      ).toHaveAttribute("href", "https://6529.io/punk6529/index.html");
    });
    expect(onPublished).toHaveBeenCalledTimes(1);
  });

  it("surfaces a validation failure without uploading or signing", async () => {
    const user = userEvent.setup();
    prepareMock.mockResolvedValue({
      ok: false,
      step: "validate",
      code: "server_validation_invalid",
      message: "invalid",
    });
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Publish website" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Server validation found blocking issues. Fix them, then publish again."
        )
      ).toBeInTheDocument();
    });
    expect(signPublishMock).not.toHaveBeenCalled();
  });

  it("offers a re-sign action after a deadline expiry and retries the tail only", async () => {
    const user = userEvent.setup();
    prepareMock.mockResolvedValue({ ok: true, context });
    signPublishMock
      .mockResolvedValueOnce({
        ok: false,
        step: "sign",
        code: "deadline_expired",
        message: "expired",
        context,
      })
      .mockResolvedValueOnce({
        ok: true,
        published: { profileHandle: "punk6529" },
        publishedUrl: "https://6529.io/punk6529/index.html",
      });
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Publish website" }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Sign again" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Sign again" }));
    await waitFor(() => {
      expect(
        screen.getByRole("link", {
          name: "https://6529.io/punk6529/index.html",
        })
      ).toBeInTheDocument();
    });

    // The retry re-runs only sign+publish, never re-preparing (no re-upload).
    expect(prepareMock).toHaveBeenCalledTimes(1);
    expect(signPublishMock).toHaveBeenCalledTimes(2);
  });

  it("disables publishing when the package is not valid", () => {
    renderPanel({ canPublish: false });
    expect(
      screen.getByRole("button", { name: "Publish website" })
    ).toBeDisabled();
  });

  it("shows a Safe notice for smart-contract wallets", () => {
    useSignMock.mockReturnValue({
      signTypedData: jest.fn(),
      chainId: 1,
      signerAddress: "0xsafe",
      isConnected: true,
      isSafe: true,
    });
    renderPanel();
    expect(
      screen.getByText(/Safe \/ smart-contract wallet detected/)
    ).toBeInTheDocument();
  });

  it("prompts to connect a wallet when none is connected", () => {
    useSignMock.mockReturnValue({
      signTypedData: jest.fn(),
      chainId: 1,
      signerAddress: undefined,
      isConnected: false,
      isSafe: false,
    });
    renderPanel();
    expect(
      screen.getByRole("button", { name: "Publish website" })
    ).toBeDisabled();
    expect(
      screen.getByText(
        "Connect the wallet linked to this profile to sign the publish."
      )
    ).toBeInTheDocument();
  });
});

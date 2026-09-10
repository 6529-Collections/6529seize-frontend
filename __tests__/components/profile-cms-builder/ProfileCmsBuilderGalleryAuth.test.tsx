import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useAuth } from "@/components/auth/Auth";
import ProfileCmsBuilder from "@/components/profile-cms-builder/ProfileCmsBuilder";
import * as editor from "@/components/profile-cms-builder/ProfileCmsBuilderEditorPanel";
import { publicEnv } from "@/config/env";
import {
  ApiProfileCmsWalletGallerySnapshotSourceEnum,
  type ApiProfileCmsWalletGallerySnapshot,
} from "@/generated/models/ApiProfileCmsWalletGallerySnapshot";
import { commonApiPost } from "@/services/api/common-api";

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
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/components/profile-cms/CmsSiteRenderer", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: undefined, isConnected: false }),
}));
jest.mock("@/hooks/profile-cms/useProfileCmsPublishSign", () => ({
  useProfileCmsPublishSign: () => ({
    isConnected: false,
    chainId: 1,
    isSafe: false,
    signTypedData: jest.fn(),
  }),
}));

const auth = useAuth as jest.Mock;
const post = jest.mocked(commonApiPost);

async function openGallery() {
  const user = userEvent.setup();
  render(
    <ProfileCmsBuilder
      handle="punk6529"
      profileId="target-profile"
      title="Profile CMS builder"
    />
  );
  await user.click(screen.getByRole("button", { name: "Wallet gallery" }));
  return user;
}

describe("CMS wallet snapshot authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    publicEnv.PROFILE_CMS_BUILDER_API_ENABLED = "true";
    delete publicEnv.NEXT_PUBLIC_PROFILE_CMS_BUILDER_API_ENABLED;
    auth.mockReturnValue({
      isAuthenticated: false,
      connectedProfile: null,
      activeProfileProxy: null,
    });
    post.mockResolvedValue({
      generated_at: Date.parse("2026-09-10T12:00:00Z"),
      source: ApiProfileCmsWalletGallerySnapshotSourceEnum.IndexedOwnership,
      block_reference: 0,
      wallets: [],
      assets: [],
      excluded_assets: [],
      totals: {
        requested_wallets: 1,
        resolved_wallets: 1,
        unresolved_wallets: 0,
        indexed_assets: 0,
        visible_assets: 0,
        excluded_assets: 0,
        spam_assets: 0,
        truncated: false,
      },
    } satisfies ApiProfileCmsWalletGallerySnapshot);
  });

  afterEach(() => jest.restoreAllMocks());

  it.each([false, undefined])(
    "requires an authenticated session even when a profile is present (%s)",
    async (isAuthenticated) => {
      auth.mockReturnValue({
        isAuthenticated,
        connectedProfile: { id: "target-profile" },
        activeProfileProxy: null,
      });
      const user = await openGallery();
      const request = screen.getByRole("button", { name: "Request snapshot" });
      expect(request).toBeDisabled();
      expect(request).toHaveAccessibleDescription(
        "Sign in to request a wallet snapshot."
      );
      await user.click(request);
      expect(post).not.toHaveBeenCalled();
    }
  );

  it("guards a direct snapshot handler call while signed out", async () => {
    const originalEditor = editor.EditorPanel;
    let requestSnapshot: (() => void) | undefined;
    jest.spyOn(editor, "EditorPanel").mockImplementation((props) => {
      requestSnapshot = props.onRequestGallerySnapshot;
      return originalEditor(props);
    });
    await openGallery();
    expect(requestSnapshot).toBeDefined();
    await act(async () => requestSnapshot?.());
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sign in to request a wallet snapshot."
    );
  });

  it.each([null, { id: "different-profile" }])(
    "allows any authenticated session without target-profile ownership (%j)",
    async (connectedProfile) => {
      auth.mockReturnValue({
        isAuthenticated: true,
        connectedProfile,
        activeProfileProxy: null,
      });
      const user = await openGallery();
      const request = screen.getByRole("button", { name: "Request snapshot" });
      expect(request).toBeEnabled();
      await user.click(request);
      await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
      expect(post).toHaveBeenCalledWith({
        endpoint: "profile-cms/wallet-gallery/snapshot",
        body: { wallets: ["punk6529.eth"] },
        errorMode: "structured",
      });
      expect(await screen.findByText("Backend snapshot")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
    }
  );

  it.each([
    [
      401,
      "Your session could not be verified. Sign in again to request a wallet snapshot.",
    ],
    [503, "Gallery snapshot could not be created."],
  ])(
    "shows the safe actionable message for HTTP %i",
    async (status, message) => {
      auth.mockReturnValue({
        isAuthenticated: true,
        connectedProfile: null,
        activeProfileProxy: null,
      });
      post.mockRejectedValueOnce(
        Object.assign(new Error("Internal response details"), { status })
      );
      const user = await openGallery();
      await user.click(
        screen.getByRole("button", { name: "Request snapshot" })
      );
      expect(await screen.findByText(message)).toHaveAttribute("role", "alert");
      expect(
        screen.getByRole("button", { name: "Request snapshot" })
      ).toHaveAccessibleDescription(message);
      expect(
        screen.queryByText("Internal response details")
      ).not.toBeInTheDocument();
    }
  );
});

import ContentPreferencesSettings from "@/components/preferences/ContentPreferencesSettings";
import {
  fetchBlockedProfiles,
  unblockProfile,
} from "@/services/api/content-moderation-api";
import {
  getProfileBlockedOverride,
  resetContentModerationStateForTests,
  setProfileBlockedOverride,
} from "@/services/content-moderation/content-moderation-state";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

const mockSetToast = jest.fn();

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    activeProfileProxy: null,
    connectedProfile: { id: "viewer-1" },
    setToast: mockSetToast,
  }),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (value: string) => value,
}));
jest.mock("@/services/api/content-moderation-api", () => ({
  fetchBlockedProfiles: jest.fn(),
  unblockProfile: jest.fn(),
}));

const blockedProfile = {
  profile_id: "author-1",
  handle: "alice",
  pfp: null,
  blocked_at: 1,
};

const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const renderSettings = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<ContentPreferencesSettings />, { wrapper: Wrapper });
};

describe("ContentPreferencesSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetContentModerationStateForTests();
    setProfileBlockedOverride("viewer-1", "author-1", true);
    jest.mocked(fetchBlockedProfiles).mockResolvedValue([blockedProfile]);
    jest.mocked(unblockProfile).mockResolvedValue(undefined);
  });

  it("removes an unblocked profile immediately without a success toast", async () => {
    const deferred = createDeferred();
    jest.mocked(unblockProfile).mockReturnValueOnce(deferred.promise);
    const user = userEvent.setup();
    renderSettings();
    const unblockButton = await screen.findByRole("button", {
      name: "Unblock alice",
    });

    await user.click(unblockButton);

    expect(screen.queryByText("alice")).not.toBeInTheDocument();
    expect(getProfileBlockedOverride("viewer-1", "author-1")).toBe(false);
    expect(unblockProfile).toHaveBeenCalledWith("author-1");
    expect(mockSetToast).not.toHaveBeenCalled();

    jest.mocked(fetchBlockedProfiles).mockResolvedValueOnce([]);
    deferred.resolve();
    await waitFor(() => expect(mockSetToast).not.toHaveBeenCalled());
  });

  it("links a blocked profile identity to its public profile", async () => {
    renderSettings();

    expect(
      await screen.findByRole("link", { name: "Open alice's profile" })
    ).toHaveAttribute("href", "/alice");
  });

  it("restores the profile and viewer state when unblocking fails", async () => {
    jest.mocked(unblockProfile).mockRejectedValueOnce(new Error("failed"));
    const user = userEvent.setup();
    renderSettings();

    await user.click(
      await screen.findByRole("button", { name: "Unblock alice" })
    );

    await waitFor(() => expect(screen.getByText("alice")).toBeInTheDocument());
    expect(getProfileBlockedOverride("viewer-1", "author-1")).toBe(true);
    expect(mockSetToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Couldn't unblock this profile.",
        type: "error",
      })
    );
  });
});

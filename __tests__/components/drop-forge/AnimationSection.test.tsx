import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AnimationSection from "@/components/drop-forge/craft/sections/AnimationSection";
import { patchClaim } from "@/services/api/memes-minting-claims-api";
import type { MintingClaim } from "@/generated/models/MintingClaim";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: jest.fn() }),
}));
jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: ({ media_url }: { media_url: string }) => (
    <div data-testid="animation-preview">{media_url}</div>
  ),
}));
jest.mock("@/components/drop-forge/craft/MediaSourceLinkCard", () => ({
  __esModule: true,
  default: ({ url }: { url: string }) => (
    <div data-testid="animation-source">{url}</div>
  ),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) => url,
}));
jest.mock("@/services/api/memes-minting-claims-api", () => ({
  patchClaim: jest.fn(),
  uploadClaimMedia: jest.fn(),
}));

function renderAnimation(animationUrl: string | null, collab = false) {
  const claim: MintingClaim = {
    claim_id: 1,
    drop_id: "drop-1",
    contract: "0x123",
    name: "Animation",
    description: "Test animation",
    attributes: [],
    animation_url: animationUrl,
    ...(collab
      ? {
          collaboration_credit: {
            artist: "A, B",
            artist_profiles: "A, B",
            collab: true,
          },
        }
      : {}),
  };
  return render(
    <AnimationSection
      claim={claim}
      claimId={1}
      onUpdated={jest.fn()}
      onPendingChange={jest.fn()}
    />
  );
}

describe("AnimationSection file picker", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    { url: "https://example.com/animation.mp4", action: "Replace" },
    { url: null, action: "Add animation" },
  ])("opens the picker after $action then upload", ({ url, action }) => {
    const click = jest.spyOn(HTMLInputElement.prototype, "click");
    renderAnimation(url);

    fireEvent.click(screen.getByRole("button", { name: action }));
    expect(click).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Upload from device" }));
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.instances[0]).toHaveAttribute("type", "file");
  });

  it("keeps paste-link and cancel available when replacing an animation", () => {
    const click = jest.spyOn(HTMLInputElement.prototype, "click");
    renderAnimation("https://example.com/animation.mp4");

    fireEvent.click(screen.getByRole("button", { name: "Replace" }));
    fireEvent.click(screen.getByRole("button", { name: "Paste link" }));
    expect(
      screen.getByRole("textbox", { name: "IPFS or Arweave URL (GLB or HTML)" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Replace" })).toBeInTheDocument();
    expect(click).not.toHaveBeenCalled();
  });
});

it("lets an admin remove a collaborative claim's saved animation", async () => {
  renderAnimation("https://example.com/animation.mp4", true);
  expect(screen.getByTestId("animation-preview")).toHaveTextContent(
    "https://example.com/animation.mp4"
  );
  expect(screen.getByTestId("animation-source")).toHaveTextContent(
    "https://example.com/animation.mp4"
  );
  expect(screen.getByRole("button", { name: "Replace" })).toBeEnabled();
  jest.mocked(patchClaim).mockResolvedValue({ claim_id: 1 } as MintingClaim);
  fireEvent.click(screen.getByRole("button", { name: "Remove animation" }));
  const save = screen.getByRole("button", { name: "Save" });
  expect(save).toBeEnabled();
  fireEvent.click(save);
  await waitFor(() =>
    expect(patchClaim).toHaveBeenCalledWith(1, { animation_url: null })
  );
});

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import MetadataSection from "@/components/drop-forge/craft/sections/MetadataSection";
import ImageSection from "@/components/drop-forge/craft/sections/ImageSection";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import {
  patchClaim,
  uploadClaimMedia,
} from "@/services/api/memes-minting-claims-api";

const mockSetToast = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    setToast: mockSetToast,
    connectedProfile: { handle: "admin" },
  }),
}));
jest.mock("@/services/api/memes-minting-claims-api", () => ({
  patchClaim: jest.fn(),
  uploadClaimMedia: jest.fn(),
}));
jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: () => <div>Image preview</div>,
}));
jest.mock("@/components/drop-forge/craft/MediaSourceLinkCard", () => ({
  __esModule: true,
  default: () => <div>Image source</div>,
}));

function managedClaim(collab: boolean): MintingClaim {
  const artist = collab ? "A, B" : "A";
  const profiles = collab ? "userA, userB" : "userA";
  return {
    claim_id: 1,
    drop_id: "drop-1",
    contract: "0x123",
    name: "Original title",
    description: "Original description",
    image_url: "https://example.com/original.png",
    collaboration_credit: { artist, artist_profiles: profiles, collab },
    attributes: [
      { trait_type: "Artist", value: artist },
      { trait_type: "SEIZE Artist Profile", value: profiles },
      { trait_type: "Collab", value: collab ? "Yes" : "No" },
      { trait_type: "Type - Season", value: 14 },
    ],
  };
}

beforeEach(() => jest.clearAllMocks());

it.each([false, true])(
  "saves admin metadata independently of the initial collaborator snapshot (collab=%s)",
  async (collab) => {
    const claim = managedClaim(collab);
    const onUpdated = jest.fn();
    jest.mocked(patchClaim).mockResolvedValue(claim);
    const { container } = render(
      <MetadataSection
        claim={claim}
        claimId={1}
        onUpdated={onUpdated}
        onPendingChange={jest.fn()}
      />
    );
    const title = screen.getByRole("textbox", { name: "Artwork Title" });
    const description = screen.getByRole("textbox", { name: "Description" });
    const artist = screen.getByRole("textbox", { name: "Artist" });
    const profiles = screen.getByRole("textbox", {
      name: "SEIZE Artist Profile",
    });
    for (const field of [title, description, artist, profiles]) {
      expect(field).toBeEnabled();
      expect(field).not.toHaveAttribute("readonly");
    }
    fireEvent.input(title, { target: { value: "Admin title" } });
    fireEvent.input(description, { target: { value: "Admin description" } });
    fireEvent.change(artist, { target: { value: "A, unaccepted" } });
    fireEvent.blur(artist);
    fireEvent.change(profiles, { target: { value: "userA, unaccepted" } });
    fireEvent.blur(profiles);
    const controls = container.querySelector<HTMLElement>(
      '[data-field="collab"]'
    );
    expect(controls).not.toBeNull();
    if (!controls) throw new Error("Missing Collab controls");
    const collabButton = within(controls).getByRole("button", {
      name: collab ? "No" : "Yes",
    });
    expect(collabButton).toBeEnabled();
    fireEvent.click(collabButton);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(patchClaim).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: "Admin title",
          description: "Admin description",
          attributes: expect.arrayContaining([
            { trait_type: "Artist", value: "A, unaccepted" },
            { trait_type: "SEIZE Artist Profile", value: "userA, unaccepted" },
            { trait_type: "Collab", value: collab ? "No" : "Yes" },
            { trait_type: "Type - Season", value: 14 },
          ]),
        })
      )
    );
    expect(onUpdated).toHaveBeenCalledWith(claim);
  }
);

it("lets an admin replace a collaborative claim's image", async () => {
  const claim = managedClaim(true);
  URL.createObjectURL = jest.fn(() => "blob:admin-image");
  URL.revokeObjectURL = jest.fn();
  const replacement = "https://example.com/admin.png";
  jest.mocked(uploadClaimMedia).mockResolvedValue(replacement);
  jest
    .mocked(patchClaim)
    .mockResolvedValue({ ...claim, image_url: replacement });
  const { container } = render(
    <ImageSection
      claim={claim}
      claimId={1}
      onUpdated={jest.fn()}
      onPendingChange={jest.fn()}
    />
  );
  expect(screen.getByRole("button", { name: "Replace" })).toBeEnabled();
  const picker =
    container.querySelector<HTMLInputElement>('input[type="file"]');
  expect(picker).not.toBeNull();
  const file = new File(["replacement"], "admin.png", { type: "image/png" });
  if (!picker) throw new Error("Missing image picker");
  fireEvent.change(picker, { target: { files: [file] } });
  const save = screen.getByRole("button", { name: "Save" });
  expect(save).toBeEnabled();
  fireEvent.click(save);
  await waitFor(() =>
    expect(patchClaim).toHaveBeenCalledWith(1, { image_url: replacement })
  );
  expect(uploadClaimMedia).toHaveBeenCalledWith(1, "image_url", file);
});

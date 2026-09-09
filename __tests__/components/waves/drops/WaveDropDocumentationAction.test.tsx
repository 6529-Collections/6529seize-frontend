import { fireEvent, render, screen } from "@testing-library/react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import WaveDropDocumentationAction from "@/components/waves/drops/WaveDropDocumentationAction";

const mockAuth = jest.fn();
const mockAccess = jest.fn();
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth() }));
jest.mock(
  "@/hooks/artwork-documentation/useArtworkDocumentationAccess",
  () => ({
    useArtworkDocumentationAccess: () => mockAccess(),
  })
);

const drop = {
  id: "drop-id",
  author: { id: "artist-id" },
  wave: { id: "pilot-wave" },
  drop_type: ApiDropType.Participatory,
} as ApiDrop;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockReturnValue({
    connectedProfile: { id: "artist-id" },
    activeProfileProxy: null,
  });
  mockAccess.mockReturnValue({
    enabled: true,
    profiles: [{ wave_id: "pilot-wave" }],
    selfServiceEnabled: false,
  });
});

it.each([false, true])(
  "opens documentation for an eligible owned work (mobile=%s)",
  (mobile) => {
    const onSelected = jest.fn();
    render(
      <WaveDropDocumentationAction
        drop={drop}
        onSelected={onSelected}
        mobile={mobile}
      />
    );
    const link = screen.getByRole("link", { name: "Artwork documentation" });
    expect(link).toHaveAttribute(
      "href",
      "/artwork-documentation?sourceDropId=drop-id"
    );
    fireEvent.click(link);
    expect(onSelected).toHaveBeenCalledTimes(1);
  }
);

it.each([
  { connectedProfile: null, activeProfileProxy: null },
  { connectedProfile: { id: "someone-else" }, activeProfileProxy: null },
  {
    connectedProfile: { id: "artist-id" },
    activeProfileProxy: { id: "proxy" },
  },
])("does not request access for an ineligible identity", (auth) => {
  mockAuth.mockReturnValue(auth);
  render(<WaveDropDocumentationAction drop={drop} onSelected={jest.fn()} />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(mockAccess).not.toHaveBeenCalled();
});

it.each([
  { ...drop, id: "temp-upload" },
  { ...drop, drop_type: ApiDropType.Chat },
])("omits unpublished and chat drops", (ineligibleDrop) => {
  render(
    <WaveDropDocumentationAction drop={ineligibleDrop} onSelected={jest.fn()} />
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(mockAccess).not.toHaveBeenCalled();
});

it.each([
  {
    enabled: false,
    profiles: [{ wave_id: "pilot-wave" }],
    selfServiceEnabled: true,
  },
  {
    enabled: true,
    profiles: [{ wave_id: "another-wave" }],
    selfServiceEnabled: false,
  },
])("honors server activation and pilot eligibility", (access) => {
  mockAccess.mockReturnValue(access);
  render(<WaveDropDocumentationAction drop={drop} onSelected={jest.fn()} />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

it("supports a later self-service release without adding wave IDs to the UI", () => {
  mockAccess.mockReturnValue({
    enabled: true,
    profiles: [],
    selfServiceEnabled: true,
  });
  render(<WaveDropDocumentationAction drop={drop} onSelected={jest.fn()} />);
  expect(
    screen.getByRole("link", { name: "Artwork documentation" })
  ).toBeInTheDocument();
});

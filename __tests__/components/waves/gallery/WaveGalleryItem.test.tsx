import { render, screen } from "@testing-library/react";
import { WaveGalleryItem } from "@/components/waves/gallery/WaveGalleryItem";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: false }),
}));
jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: () => false,
}));
jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/drops/media/MediaTypeBadge", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => children,
}));

it("keeps both anonymous gallery labels visible without a handle or profile navigation", () => {
  const drop = {
    id: "entry",
    author: { handle: null, is_anonymous: true },
    metadata: [],
    parts: [{ media: [{ url: "image", mime_type: "image/png" }] }],
  } as unknown as ExtendedDrop;
  render(<WaveGalleryItem drop={drop} onDropClick={jest.fn()} />);
  expect(screen.getAllByText("Anonymous", { exact: true })).toHaveLength(2);
  expect(screen.queryByRole("link")).toBeNull();
});

import HeroArtworkFan from "@/components/home/hero/HeroArtworkFan";
import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { useLatestDropTransitionReady } from "@/components/home/now-minting/useLatestDropTransitionReady";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { MEMES_LITE: "MEMES_LITE" },
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: [5, 4, 3, 2, 1].map((number) => ({
      id: `meme-${number}`,
      number,
      name: `Meme ${number}`,
      image: "",
    })),
  }),
}));
jest.mock("@/hooks/useNowMintingStatus");
jest.mock("@/hooks/useNextMintDrop");
jest.mock("@/hooks/useNftPurchasingVisibility");
jest.mock("@/components/home/now-minting/useLatestDropTransitionReady");
jest.mock("@/components/common/NftPurchasingGate", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock(
  "@/components/drops/view/item/content/media/DropImagePreview",
  () => ({ DropImagePreview: () => null })
);
jest.mock("@/helpers/waves/drop.helpers", () => ({
  getDropPreviewImageUrl: () => null,
}));

const mockStatus = jest.mocked(useNowMintingStatus);
let mintStatus: ReturnType<typeof useNowMintingStatus>;
const mockNext = jest.mocked(useNextMintDrop);
const mockVisibility = jest.mocked(useNftPurchasingVisibility);
const mockTransition = jest.mocked(useLatestDropTransitionReady);

beforeEach(() => {
  jest.clearAllMocks();
  mockVisibility.mockReturnValue({
    hideNftPurchasing: false,
    shouldRedirect: false,
  });
  mockTransition.mockReturnValue(false);
  mintStatus = {
    nft: { id: 5, name: "Meme 5", scaled: "", image: "" },
    isStatusLoading: false,
  } as ReturnType<typeof useNowMintingStatus>;
  mockNext.mockReturnValue({ nextMint: null, isLoading: false } as ReturnType<
    typeof useNextMintDrop
  >);
});

test("shows the current artwork once with four recent cards", () => {
  const { container } = render(<HeroArtworkFan mintStatus={mintStatus} />);
  expect(container.querySelectorAll("figure")).toHaveLength(5);
  expect(container.querySelector('[data-slot="4"]')).toHaveTextContent(
    "Meme 5"
  );
  expect(screen.getAllByText("Meme 5")).toHaveLength(1);
  expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  expect(mockStatus).not.toHaveBeenCalled();
});

test("follows the existing next-drop transition without changing mint selection", () => {
  mockTransition.mockReturnValue(true);
  mockNext.mockReturnValue({
    nextMint: {
      id: "next",
      parts: [],
      metadata: [],
      submission_context: { meme_card_id: 6 },
    },
    nextMintTitle: "Next artwork",
    isLoading: false,
  } as unknown as ReturnType<typeof useNextMintDrop>);
  const { container } = render(<HeroArtworkFan mintStatus={mintStatus} />);
  expect(container.querySelector('[data-slot="4"]')).toHaveTextContent(
    "Next artwork#6"
  );
  expect(screen.getByText("Meme 5")).toBeInTheDocument();
});

test("does not guess the front artwork while the initial mint decision loads", () => {
  mintStatus = { isStatusLoading: true } as ReturnType<
    typeof useNowMintingStatus
  >;
  const { container } = render(<HeroArtworkFan mintStatus={mintStatus} />);
  expect(
    container.querySelector('[data-slot="4"] figcaption span')
  ).toBeEmptyDOMElement();
});

test("restricted and pre-hydration views show published art without mounting mint hooks", () => {
  mockVisibility.mockReturnValue({
    hideNftPurchasing: true,
    shouldRedirect: false,
  });
  const { container } = render(<HeroArtworkFan mintStatus={mintStatus} />);
  expect(container.querySelector('[data-slot="4"]')).toHaveTextContent(
    "Meme 5"
  );
  expect(mockStatus).not.toHaveBeenCalled();
  expect(mockNext).not.toHaveBeenCalled();
});

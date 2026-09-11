import TheMemesComponent from "@/components/the-memes/TheMemes";
import type { MemeSeason } from "@/entities/ISeason";
import { fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

let mockSearchParams = new URLSearchParams();
const mockRouter = { push: jest.fn() };

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));
jest.mock("@/components/auth/Auth", () => ({
  AuthContext: jest
    .requireActual<typeof import("react")>("react")
    .createContext({ connectedProfile: null }),
}));
jest.mock("@/contexts/TitleContext", () => ({ useSetTitle: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(async () => ({ data: [], next: null })),
}));
jest.mock("@/components/nft-image/NftBalancesContext", () => ({
  NftBalancesProvider: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@/components/the-memes/TheMemesCard", () => () => null);
jest.mock(
  "@/components/collections-dropdown/CollectionsDropdown",
  () => () => null
);
jest.mock("@/components/lfg-slideshow/LFGSlideshow", () => ({
  LFGButton: () => null,
}));
jest.mock(
  "@/components/utils/select/dropdown/FilterGridDropdown",
  () => () => null
);
jest.mock(
  "@/components/utils/select/dropdown/MemeSeasonGridDropdown",
  () => () => null
);
jest.mock("@/components/the-memes/VolumeTypeDropdown", () => () => null);

const seasons: MemeSeason[] = [
  {
    id: 1,
    name: "SZN1",
    display: "SZN 1",
    start_index: 1,
    end_index: 10,
    count: 10,
    boost: 0.05,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(commonApiFetch).mockResolvedValue(seasons);
});

it.each([
  ["", "/collect?collection=memes&intent=full_set&definition=memes"],
  ["szn=1", "/collect?collection=memes&intent=season&definition=1"],
  ["szn=999", "/collect?collection=memes&intent=full_set&definition=memes"],
])(
  "opens the appropriate completion goal for collection filters %s",
  async (query, href) => {
    mockSearchParams = new URLSearchParams(query);
    render(<TheMemesComponent />);
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Complete my set" })
      ).toHaveAttribute("href", href)
    );
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "new_memes_seasons",
      signal: expect.any(AbortSignal),
    });
  }
);

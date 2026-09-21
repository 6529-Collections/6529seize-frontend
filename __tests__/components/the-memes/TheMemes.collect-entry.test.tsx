import TheMemesComponent from "@/components/the-memes/TheMemes";
import type { MemeSeason } from "@/entities/ISeason";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

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
jest.mock(
  "@/components/the-memes/TheMemesCard",
  () =>
    ({ nft }: { readonly nft: ApiMemesExtendedData }) => (
      <a href={`/the-memes/${nft.id}`}>{nft.name}</a>
    )
);
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
  mockSearchParams = new URLSearchParams();
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

it("renders the server-provided public cards once without refetching the first page", async () => {
  const initialData = {
    nfts: [
      { id: 1, meme: 1, meme_name: "Meme", name: "Meme #1" },
    ] as ApiMemesExtendedData[],
    nextPage: undefined,
  };

  mockSearchParams = new URLSearchParams();
  render(<TheMemesComponent initialData={initialData} />);

  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Meme #1" })).toHaveAttribute(
      "href",
      "/the-memes/1"
    )
  );
  expect(screen.getAllByRole("link", { name: "Meme #1" })).toHaveLength(1);
  expect(fetchUrl).not.toHaveBeenCalled();
});

it("does not reuse the default seed after sorting changes before filters load", async () => {
  let resolveSeasons: (value: MemeSeason[]) => void = () => {};
  jest.mocked(commonApiFetch).mockReturnValue(
    new Promise<MemeSeason[]>((resolve) => {
      resolveSeasons = resolve;
    })
  );
  const initialData = {
    nfts: [
      { id: 1, meme: 1, meme_name: "Meme", name: "Seeded Meme" },
    ] as ApiMemesExtendedData[],
    nextPage: undefined,
  };

  render(<TheMemesComponent initialData={initialData} />);
  fireEvent.click(screen.getByRole("button", { name: "Sort by TDH" }));

  await act(async () => resolveSeasons(seasons));

  await waitFor(() =>
    expect(fetchUrl).toHaveBeenCalledWith(expect.stringContaining("sort=tdh"))
  );
  expect(fetchUrl).not.toHaveBeenCalledWith(
    expect.stringContaining("sort=mint_date")
  );
});

it("includes seeded artwork links in the initial HTML", () => {
  const markup = renderToStaticMarkup(
    <TheMemesComponent
      initialData={{
        nfts: [
          { id: 2, meme: 1, meme_name: "Meme", name: "Meme #2" },
        ] as ApiMemesExtendedData[],
        nextPage: undefined,
      }}
    />
  );

  expect(markup).toContain('href="/the-memes/2"');
  expect(markup).toContain("Meme #2");
});

it.each([
  ["sort=tdh", "sort", "tdh"],
  ["sort_dir=desc", "sort_direction", "DESC"],
  ["szn=1", "season", "1"],
  ["year=0", "season", "1"],
])(
  "loads the selected query after early URL navigation to %s",
  async (query, apiKey, apiValue) => {
    let resolveSeasons!: (value: MemeSeason[]) => void;
    jest.mocked(commonApiFetch).mockReturnValue(
      new Promise<MemeSeason[]>((resolve) => {
        resolveSeasons = resolve;
      })
    );
    const initialData = {
      nfts: [
        { id: 1, meme: 1, meme_name: "Meme", name: "Seeded Meme" },
      ] as ApiMemesExtendedData[],
      nextPage: undefined,
    };
    const { rerender } = render(
      <TheMemesComponent initialData={initialData} />
    );

    mockSearchParams = new URLSearchParams(query);
    rerender(<TheMemesComponent initialData={initialData} />);
    await act(async () => resolveSeasons(seasons));

    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(1));
    const [requestedUrl] = jest.mocked(fetchUrl).mock.calls[0]!;
    expect(new URL(requestedUrl).searchParams.get(apiKey)).toBe(apiValue);
    expect(screen.queryByRole("link", { name: "Seeded Meme" })).toBeNull();
  }
);

it("keeps the seed for equivalent default query parameters while seasons load", async () => {
  let resolveSeasons!: (value: MemeSeason[]) => void;
  jest.mocked(commonApiFetch).mockReturnValue(
    new Promise<MemeSeason[]>((resolve) => {
      resolveSeasons = resolve;
    })
  );
  const initialData = {
    nfts: [
      { id: 1, meme: 1, meme_name: "Meme", name: "Seeded Meme" },
    ] as ApiMemesExtendedData[],
    nextPage: undefined,
  };
  const { rerender } = render(<TheMemesComponent initialData={initialData} />);

  mockSearchParams = new URLSearchParams("sort=AGE&sort_dir=ASC&locale=de-DE");
  rerender(<TheMemesComponent initialData={initialData} />);
  await act(async () => resolveSeasons(seasons));

  expect(fetchUrl).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Seeded Meme" })).toBeInTheDocument();
});

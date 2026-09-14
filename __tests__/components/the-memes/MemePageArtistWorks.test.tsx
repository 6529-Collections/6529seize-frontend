import MemePageArtistWorks from "@/components/the-memes/MemePageArtistWorks";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiArtistNameItem } from "@/generated/models/ApiArtistNameItem";
import type { SupportedLocale } from "@/i18n/locales";
import { commonApiFetch } from "@/services/api/common-api";
import { getIdentityQueryKey } from "@/services/api/identity-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { NFTS: "nfts" },
}));

const fetchMock = jest.mocked(commonApiFetch);
const catalogue: ApiArtistNameItem[] = [
  { name: "Arsonic", cards: [1, 2, 5, 3, 4, 6, 6] },
  { name: "Collaborator", cards: [1, 7] },
  { name: "Unrelated", cards: [8, 9] },
];

function mockCatalogue(artists = catalogue) {
  fetchMock.mockImplementation(async ({ endpoint, params }) => {
    if (endpoint === "memes/artists_names") {
      return artists;
    }
    const idParam =
      params && typeof params === "object" && "id" in params
        ? params["id"]
        : "";
    const ids =
      typeof idParam === "string" ? idParam.split(",").map(Number) : [];
    return {
      data: ids
        .toSorted((a, b) => a - b)
        .map((id) => ({
          id,
          contract: MEMES_CONTRACT,
          name: `Artwork ${id}`,
          scaled: `https://images.example.com/${id}.png`,
        })),
      count: ids.length,
      page: 1,
      next: null,
    };
  });
}

function renderGallery(
  locale: SupportedLocale = "en-US",
  artistHandles: string | null = "",
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
) {
  return render(
    <QueryClientProvider client={client}>
      <MemePageArtistWorks
        nft={{ id: 1, artist_seize_handle: artistHandles }}
        locale={locale}
      />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  mockCatalogue();
});

it("uses catalogue authorship, excludes the current card and orders other works newest first", async () => {
  renderGallery();
  const gallery = await screen.findByRole("region", {
    name: "More by Arsonic",
  });
  await waitFor(() =>
    expect(within(gallery).getAllByRole("link")).toHaveLength(4)
  );
  expect(
    within(gallery)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
  ).toEqual(["/the-memes/6", "/the-memes/5", "/the-memes/4", "/the-memes/3"]);
  expect(
    await screen.findByRole("region", { name: "More by Collaborator" })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("region", { name: "More by Unrelated" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /Artwork 1\b/ })
  ).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    expect.objectContaining({
      endpoint: "nfts",
      params: { contract: MEMES_CONTRACT, id: "6,5,4,3", page_size: "100" },
      signal: expect.any(AbortSignal),
    })
  );
});

it("uses the catalogue when the API has a null artist profile handle", async () => {
  renderGallery("en-US", null);
  expect(
    await screen.findByRole("link", { name: /Artwork 6/ })
  ).toBeInTheDocument();
});

it("expands the complete deduplicated gallery and can restore the preview", async () => {
  renderGallery();
  const gallery = await screen.findByRole("region", {
    name: "More by Arsonic",
  });
  await userEvent.click(
    within(gallery).getByRole("button", { name: "View all (5)" })
  );
  await waitFor(() =>
    expect(within(gallery).getAllByRole("link")).toHaveLength(5)
  );
  await userEvent.click(
    within(gallery).getByRole("button", { name: "Show fewer" })
  );
  await waitFor(() =>
    expect(within(gallery).getAllByRole("link")).toHaveLength(4)
  );
});

it("combines profile history with mapped Main Stage winners, even when the artist catalogue is incomplete", async () => {
  const fallback = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation(async (options) => {
    if (options.endpoint === "identities/arsonic") {
      return {
        handle: "arsonic",
        artist_of_prevote_cards: [2],
        winner_main_stage_drop_ids: ["winner-1", "winner-2"],
      };
    }
    if (options.endpoint === "v2/drops") {
      return {
        data: [
          {
            id: "winner-1",
            submission_context: { status: "WINNER", meme_card_id: 1 },
          },
          {
            id: "winner-2",
            submission_context: { status: "WINNER", meme_card_id: 3 },
          },
        ],
      };
    }
    return fallback(options);
  });
  renderGallery("en-US", " Arsonic,arsonic ");
  const gallery = await screen.findByRole("region", {
    name: "More by arsonic",
  });
  await waitFor(() =>
    expect(within(gallery).getAllByRole("link")).toHaveLength(2)
  );
  expect(
    within(gallery)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
  ).toEqual(["/the-memes/3", "/the-memes/2"]);
  expect(fetchMock).not.toHaveBeenCalledWith(
    expect.objectContaining({ endpoint: "memes/artists_names" })
  );
});

it("retries both failed profile and winner requests with one action", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const profile = {
    handle: "arsonic",
    artist_of_prevote_cards: [2],
    winner_main_stage_drop_ids: ["winner-1"],
  };
  client.setQueryData(getIdentityQueryKey("arsonic"), profile);
  const fallback = fetchMock.getMockImplementation()!;
  let recovered = false;
  fetchMock.mockImplementation(async (options) => {
    if (options.endpoint === "identities/arsonic") {
      if (!recovered) throw new Error("Identity unavailable");
      return profile;
    }
    if (options.endpoint === "v2/drops") {
      if (!recovered) throw new Error("Winner unavailable");
      return { data: [] };
    }
    return fallback(options);
  });
  renderGallery("en-US", "arsonic", client);
  await waitFor(() =>
    expect(
      client
        .getQueryCache()
        .getAll()
        .filter((query) => query.state.status === "error")
    ).toHaveLength(2)
  );

  recovered = true;
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByRole("link", { name: /Artwork 2/ })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Try again" })
  ).not.toBeInTheDocument();
});

it.each<SupportedLocale>(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"])(
  "keeps %s links and falls back to source copy",
  async (locale) => {
    renderGallery(locale);
    const link = await screen.findByRole("link", { name: /Artwork 6/ });
    const suffix = locale === "en-US" ? "" : `?locale=${locale}`;
    expect(link).toHaveAttribute("href", `/the-memes/6${suffix}`);
    expect(
      screen.getByRole("heading", { name: "More by Arsonic" })
    ).toBeInTheDocument();
  }
);

it("omits the gallery when the credited artist has no other cards", async () => {
  mockCatalogue([{ name: "Debut artist", cards: [1] }]);
  renderGallery();
  await waitFor(() =>
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  );
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("allows retrying catalogue failures", async () => {
  fetchMock.mockRejectedValueOnce(new Error("Unavailable"));
  renderGallery();
  expect(
    await screen.findByText("Artist works could not be loaded.")
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByRole("link", { name: /Artwork 6/ })
  ).toBeInTheDocument();
});

it("keeps the artwork link usable when its preview fails", async () => {
  renderGallery();
  const link = await screen.findByRole("link", { name: /Artwork 6/ });
  fireEvent.error(within(link).getByRole("presentation"));
  expect(
    within(link).getByText("Artwork preview unavailable")
  ).toBeInTheDocument();
  expect(link).toHaveAttribute("href", "/the-memes/6");
});

import Rememes, { RememeSort } from "@/components/rememes/Rememes";
import { TitleProvider } from "@/contexts/TitleContext";
import { fetchUrl } from "@/services/6529api";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

const mockRouterReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockRouterReplace,
  }),
  useSearchParams: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue(undefined),
    toString: jest.fn().mockReturnValue(""),
  }),
  usePathname: jest.fn().mockReturnValue("/rememes"),
}));
jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
}));
jest.mock("@/components/nft-image/RememeImage", () => () => (
  <div data-testid="img" />
));
jest.mock("@/components/pagination/Pagination", () => (props: any) => (
  <div data-testid="pagination" onClick={() => props.setPage(2)} />
));
jest.mock("@/components/lfg-slideshow/LFGSlideshow", () => ({
  LFGButton: () => <div data-testid="lfg-button" />,
}));
jest.mock("@/components/collections-dropdown/CollectionsDropdown", () => ({
  __esModule: true,
  default: ({ triggerContent }: any) => (
    <div data-testid="collections-dropdown">{triggerContent}</div>
  ),
}));
jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, className, id, style }: any) => (
    <div
      data-testid="react-tooltip"
      data-tooltip-id={id}
      data-has-inline-style={style ? "true" : "false"}
      className={className}
    >
      {children}
    </div>
  ),
}));

const rememeResponse = {
  count: 1,
  data: [
    {
      contract: "0x",
      id: "1",
      metadata: { name: "Example ReMeme" },
      contract_opensea_data: {},
      replicas: [] as unknown[],
      image: "",
    },
  ],
};

function mockRememesApi(
  memes: { id: number; name: string }[] = [],
  response = rememeResponse
) {
  (fetchUrl as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("memes_lite")) {
      return Promise.resolve({ data: memes });
    }
    return Promise.resolve(response);
  });
}

function renderRememes(props: ComponentProps<typeof Rememes> = {}) {
  return render(
    <TitleProvider>
      <Rememes {...props} />
    </TitleProvider>
  );
}

describe("Rememes component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRememesApi();
    global.fetch = jest.fn(() => Promise.resolve({ json: () => ({}) } as any));
  });

  it("fetches rememes and changes sorting", async () => {
    renderRememes();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    expect(fetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/rememes?page_size=40&page=1",
      expect.objectContaining({ signal: expect.any(Object) })
    );
    expect(screen.getByText("#1")).toBeInTheDocument();
    const resultsList = screen.getByRole("list", {
      name: "ReMemes results",
    });
    expect(within(resultsList).getAllByRole("listitem")).toHaveLength(1);
    expect(
      screen.getByRole("link", {
        name: "View Example ReMeme, ReMeme #1",
      })
    ).toHaveAttribute("href", "/rememes/0x/1");
    expect(screen.getByRole("link", { name: "Add ReMeme" })).toHaveAttribute(
      "href",
      "/rememes/add"
    );
    expect(screen.queryByText("0x #1")).not.toBeInTheDocument();
    const tooltip = screen.getByTestId("react-tooltip");
    expect(tooltip).toHaveAttribute("data-has-inline-style", "true");
    expect(
      (fetchUrl as jest.Mock).mock.calls.filter(([url]: [string]) =>
        url.includes("/api/rememes?")
      )
    ).toHaveLength(1);
    const sortButton = await screen.findByRole("button", {
      name: "Sort: Random",
    });
    await userEvent.click(sortButton);
    await userEvent.click(screen.getByText(RememeSort.CREATED_ASC));
    await waitFor(() =>
      expect(fetchUrl).toHaveBeenLastCalledWith(
        "https://api.test.6529.io/api/rememes?page_size=40&page=1&sort=created_at&sort_direction=desc",
        expect.objectContaining({ signal: expect.any(Object) })
      )
    );
  });

  it("opens the inline token type trigger and filters by token type", async () => {
    renderRememes();
    const tokenTypeButton = await screen.findByRole("button", {
      name: "Token Type: All",
    });

    await userEvent.click(tokenTypeButton);
    await userEvent.click(screen.getByText("ERC-721"));

    await waitFor(() =>
      expect(fetchUrl).toHaveBeenLastCalledWith(
        "https://api.test.6529.io/api/rememes?page_size=40&page=1&token_type=ERC721",
        expect.objectContaining({ signal: expect.any(Object) })
      )
    );
  });

  it("shows full meme reference labels and filters by selected meme", async () => {
    mockRememesApi([{ id: 1, name: "6529Seizing" }]);
    renderRememes();
    const memeReferenceButton = await screen.findByRole("button", {
      name: "Meme Reference: All",
    });

    await userEvent.click(memeReferenceButton);
    await userEvent.click(screen.getByText("#1 - 6529Seizing"));

    await waitFor(() =>
      expect(mockRouterReplace).toHaveBeenLastCalledWith("/rememes?meme_id=1", {
        scroll: false,
      })
    );
    await waitFor(() =>
      expect(fetchUrl).toHaveBeenLastCalledWith(
        "https://api.test.6529.io/api/rememes?page_size=40&page=1&meme_id=1",
        expect.objectContaining({ signal: expect.any(Object) })
      )
    );
  });

  it("preserves unrelated query params when changing the selected meme", async () => {
    mockRememesApi([{ id: 1, name: "6529Seizing" }]);
    renderRememes({
      locale: "de-DE",
      searchParams: {
        locale: "de-DE",
        utm_source: "newsletter",
        view: "compact",
      },
    });
    const memeReferenceButton = await screen.findByRole("button", {
      name: "Meme Reference: All",
    });

    await userEvent.click(memeReferenceButton);
    await userEvent.click(screen.getByText("#1 - 6529Seizing"));

    await waitFor(() =>
      expect(mockRouterReplace).toHaveBeenLastCalledWith(
        "/rememes?utm_source=newsletter&view=compact&meme_id=1&locale=de-DE",
        {
          scroll: false,
        }
      )
    );
  });

  it("renders the total count as secondary header metadata", async () => {
    renderRememes();

    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());

    screen.getAllByText("(x1)").forEach((count) => {
      expect(count).toHaveClass(
        "tw-text-sm",
        "tw-font-medium",
        "tw-text-iron-500"
      );
      expect(count).not.toHaveClass("tw-text-lg", "tw-text-iron-300");
    });
  });

  it("uses initial meme id and formats counts with the active locale", async () => {
    mockRememesApi([], {
      ...rememeResponse,
      count: 1234,
      data: [
        {
          ...rememeResponse.data[0],
          replicas: [{ id: "replica-a" }, { id: "replica-b" }],
        },
      ],
    });

    renderRememes({ initialMemeId: 42, locale: "de-DE" });

    await waitFor(() =>
      expect(fetchUrl).toHaveBeenLastCalledWith(
        "https://api.test.6529.io/api/rememes?page_size=40&page=1&meme_id=42",
        expect.objectContaining({ signal: expect.any(Object) })
      )
    );
    expect(screen.getAllByText("(x1.234)")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Add ReMeme" })).toHaveAttribute(
      "href",
      "/rememes/add?locale=de-DE"
    );
    expect(
      screen.getAllByText(
        (_, element) => element?.textContent?.includes("(x2)") ?? false
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Sort: Random" })).toBeTruthy();
  });

  it("syncs the selected meme when the initial meme id prop changes", async () => {
    mockRememesApi([{ id: 1, name: "6529Seizing" }]);
    const { rerender } = renderRememes({ initialMemeId: 42 });

    await waitFor(() =>
      expect(fetchUrl).toHaveBeenLastCalledWith(
        "https://api.test.6529.io/api/rememes?page_size=40&page=1&meme_id=42",
        expect.objectContaining({ signal: expect.any(Object) })
      )
    );
    expect(
      await screen.findByRole("button", { name: "Meme Reference: 42" })
    ).toBeInTheDocument();

    rerender(
      <TitleProvider>
        <Rememes initialMemeId={1} />
      </TitleProvider>
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: "Meme Reference: #1 - 6529Seizing",
        })
      ).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(fetchUrl).toHaveBeenLastCalledWith(
        "https://api.test.6529.io/api/rememes?page_size=40&page=1&meme_id=1",
        expect.objectContaining({ signal: expect.any(Object) })
      )
    );
  });
});

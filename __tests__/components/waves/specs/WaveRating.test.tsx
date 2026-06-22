import WaveRating from "@/components/waves/specs/WaveRating";
import { normalizeCardSetTdhTokenIds } from "@/components/waves/specs/wave-card-set-tdh.helpers";
import { GRADIENT_CONTRACT, MEMES_CONTRACT } from "@/constants/constants";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { fetchUrl } from "@/services/6529api";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({
    title,
    isOpen,
    children,
  }: {
    readonly title?: string;
    readonly isOpen: boolean;
    readonly children: React.ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
}));

const fetchUrlMock = fetchUrl as jest.Mock;

const makeWave = ({
  creditType = ApiWaveCreditType.Tdh,
  creditNfts = null,
  creditCategory = null,
  creditor = null,
}: {
  readonly creditType?: ApiWaveCreditType;
  readonly creditNfts?: ReadonlyArray<{
    readonly contract: string;
    readonly token_id: number;
  }> | null;
  readonly creditCategory?: string | null;
  readonly creditor?: unknown;
} = {}): any => ({
  voting: {
    credit_type: creditType,
    credit_nfts: creditNfts,
    credit_category: creditCategory,
    creditor,
  },
});

describe("normalizeCardSetTdhTokenIds", () => {
  it("keeps Memes ids only, de-dupes them, and sorts them", () => {
    expect(
      normalizeCardSetTdhTokenIds([
        { contract: GRADIENT_CONTRACT, token_id: 9 },
        { contract: MEMES_CONTRACT.toLowerCase(), token_id: 12 },
        { contract: MEMES_CONTRACT, token_id: 2 },
        { contract: MEMES_CONTRACT, token_id: 12 },
      ])
    ).toEqual([2, 12]);
  });

  it("handles missing credit_nfts", () => {
    expect(normalizeCardSetTdhTokenIds(null)).toEqual([]);
  });
});

describe("WaveRating", () => {
  beforeEach(() => {
    fetchUrlMock.mockReset();
    fetchUrlMock.mockResolvedValue({ data: [] });
  });

  it.each([
    [ApiWaveCreditType.Tdh, "TDH"],
    [ApiWaveCreditType.Xtdh, "XTDH"],
    [ApiWaveCreditType.TdhPlusXtdh, "TDH + XTDH"],
    [ApiWaveCreditType.Rep, "REP"],
  ])("renders the %s label", (creditType, label) => {
    render(<WaveRating wave={makeWave({ creditType })} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("renders a compact card-set row and does not fetch metadata before opening", () => {
    render(
      <WaveRating
        wave={makeWave({
          creditType: ApiWaveCreditType.CardSetTdh,
          creditNfts: [
            { contract: MEMES_CONTRACT, token_id: 12 },
            { contract: MEMES_CONTRACT, token_id: 2 },
          ],
        })}
      />
    );

    expect(screen.getByText("Card Set TDH")).toBeInTheDocument();
    const countRow = screen.getByText("2 Meme cards").closest("span");
    expect(countRow).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "View set",
      })
    ).toBeInTheDocument();
    expect(fetchUrlMock).not.toHaveBeenCalled();
  });

  it("opens the set dialog with sorted unique Meme card links", async () => {
    const user = userEvent.setup();

    render(
      <WaveRating
        wave={makeWave({
          creditType: ApiWaveCreditType.CardSetTdh,
          creditNfts: [
            { contract: MEMES_CONTRACT, token_id: 12 },
            { contract: GRADIENT_CONTRACT, token_id: 99 },
            { contract: MEMES_CONTRACT, token_id: 2 },
            { contract: MEMES_CONTRACT.toLowerCase(), token_id: 12 },
          ],
        })}
      />
    );

    await user.click(screen.getByRole("button", { name: "View set" }));

    expect(
      screen.getByRole("dialog", { name: "Meme cards in TDH set" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("2 Meme cards").length).toBeGreaterThan(0);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/the-memes/2",
      "/the-memes/12",
    ]);
    expect(within(links[0]).getByText("#2")).toBeInTheDocument();
    expect(within(links[1]).getByText("#12")).toBeInTheDocument();
    await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(1));
    expect(fetchUrlMock.mock.calls[0][0]).toContain(
      `/api/nfts?contract=${MEMES_CONTRACT}&id=2,12`
    );
  });

  it("shows metadata when the dialog fetch succeeds", async () => {
    const user = userEvent.setup();
    fetchUrlMock.mockResolvedValue({
      data: [
        {
          id: 2,
          name: "Meme 2",
          thumbnail: "https://d3lqz0a4bldqgf.cloudfront.net/2.jpg",
          scaled: "",
          image: "",
          icon: "",
        },
      ],
    });

    render(
      <WaveRating
        wave={makeWave({
          creditType: ApiWaveCreditType.CardSetTdh,
          creditNfts: [{ contract: MEMES_CONTRACT, token_id: 2 }],
        })}
      />
    );

    await user.click(screen.getByRole("button", { name: "View set" }));

    await waitFor(() => expect(screen.getByText("Meme 2")).toBeInTheDocument());
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByAltText("Meme 2 Meme card")).toBeInTheDocument();
  });

  it("keeps token id links when metadata fetch fails", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    fetchUrlMock.mockRejectedValue(new Error("network"));

    try {
      render(
        <WaveRating
          wave={makeWave({
            creditType: ApiWaveCreditType.CardSetTdh,
            creditNfts: [{ contract: MEMES_CONTRACT, token_id: 2 }],
          })}
        />
      );

      await user.click(screen.getByRole("button", { name: "View set" }));

      await waitFor(() =>
        expect(
          screen.getByText(
            "Card details could not load. Token links are still available."
          )
        ).toBeInTheDocument()
      );
      expect(screen.getByRole("link")).toHaveAttribute("href", "/the-memes/2");
      expect(screen.getByText("#2")).toBeInTheDocument();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("shows an empty state for missing credit_nfts", async () => {
    const user = userEvent.setup();

    render(
      <WaveRating
        wave={makeWave({
          creditType: ApiWaveCreditType.CardSetTdh,
          creditNfts: null,
        })}
      />
    );

    expect(screen.getByText("0 Meme cards")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View set" }));

    expect(
      screen.getByText("No Meme cards are configured for this wave.")
    ).toBeInTheDocument();
    expect(fetchUrlMock).not.toHaveBeenCalled();
  });

  it("fetches metadata in chunks of 100 ids", async () => {
    const user = userEvent.setup();
    const creditNfts = Array.from({ length: 101 }, (_, index) => ({
      contract: MEMES_CONTRACT,
      token_id: index + 1,
    }));

    render(
      <WaveRating
        wave={makeWave({
          creditType: ApiWaveCreditType.CardSetTdh,
          creditNfts,
        })}
      />
    );

    await user.click(screen.getByRole("button", { name: "View set" }));

    await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(2));
    const firstRequestUrl = new URL(fetchUrlMock.mock.calls[0][0]);
    const secondRequestUrl = new URL(fetchUrlMock.mock.calls[1][0]);

    expect(firstRequestUrl.searchParams.get("id")).toBe(
      Array.from({ length: 100 }, (_, index) => `${index + 1}`).join(",")
    );
    expect(firstRequestUrl.searchParams.get("page_size")).toBe("100");
    expect(secondRequestUrl.searchParams.get("id")).toBe("101");
    expect(secondRequestUrl.searchParams.get("page_size")).toBe("1");
  });
});

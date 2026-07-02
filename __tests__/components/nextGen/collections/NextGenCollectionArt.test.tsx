import NextGenCollectionArt from "@/components/nextGen/collections/collectionParts/NextGenCollectionArt";
import type { NextGenCollection } from "@/entities/INextgen";
import { commonApiFetch } from "@/services/api/common-api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(() => Promise.resolve([])),
}));

jest.mock(
  "@/components/nextGen/collections/NextGenTokenList",
  () => (props: any) => {
    props.setTotalResults(5);
    return <div data-testid="token-list" {...props} />;
  }
);

const routerPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: routerPush });
const commonApiFetchMock = commonApiFetch as jest.Mock;
const useSearchParamsMock = useSearchParams as jest.Mock;

const collection: NextGenCollection = { id: 1, name: "My Collection" } as any;

describe("NextGenCollectionArt", () => {
  beforeEach(() => {
    routerPush.mockClear();
    commonApiFetchMock.mockReset();
    commonApiFetchMock.mockResolvedValue([]);
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("renders view all link when show_view_all", async () => {
    render(<NextGenCollectionArt collection={collection} show_view_all />);
    const link = screen.getByRole("link", { name: /View All/i });
    expect(link).toHaveAttribute(
      "href",
      "/nextgen/collection/my-collection/art"
    );
    expect(await screen.findByTestId("token-list")).toBeInTheDocument();
  });

  it("passes props to token list when not show_view_all", async () => {
    render(<NextGenCollectionArt collection={collection} />);
    const list = await screen.findByTestId("token-list");
    expect(list).toBeInTheDocument();
  });

  it("keeps a user-collapsed selected trait filter closed after another trait changes", async () => {
    commonApiFetchMock.mockResolvedValue([
      {
        trait: "Color",
        values: ["Red", "Blue"],
        value_counts: [
          { key: "Red", count: 1 },
          { key: "Blue", count: 2 },
        ],
      },
      {
        trait: "Size",
        values: ["Large"],
        value_counts: [{ key: "Large", count: 1 }],
      },
    ]);
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams("traits=Color%3ARed")
    );

    render(<NextGenCollectionArt collection={collection} />);

    const colorFilter = (await screen.findByText("Color")).closest(
      "details"
    ) as HTMLDetailsElement;
    await waitFor(() => expect(colorFilter.open).toBe(true));

    colorFilter.open = false;
    fireEvent(colorFilter, new Event("toggle", { bubbles: true }));
    await waitFor(() => expect(colorFilter.open).toBe(false));

    const sizeFilter = screen
      .getByText("Size")
      .closest("details") as HTMLDetailsElement;
    sizeFilter.open = true;
    fireEvent(sizeFilter, new Event("toggle", { bubbles: true }));
    await userEvent.click(screen.getByLabelText(/Large/i));

    await waitFor(() => expect(colorFilter.open).toBe(false));
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import {
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
  useSharedState,
} from "@/components/gas-royalties/GasRoyalties";
import { DateIntervalsSelection, GasRoyaltiesCollectionFocus } from "@/enums";
import { usePathname, useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock("../../../services/6529api", () => ({
  fetchUrl: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../../components/dotLoader/DotLoader", () => () => (
  <span data-testid="loader" />
));
jest.mock(
  "../../../components/downloadUrlWidget/DownloadUrlWidget",
  () => (props: any) =>
    (
      <button
        data-testid="download"
        data-name={props.name}
        data-url={props.url}
      />
    )
);
jest.mock(
  "../../../components/datePickerModal/DatePickerModal",
  () => (props: any) => <div data-testid={`${props.mode}-picker`} />
);
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));
jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid={`tooltip-${id}`}>{children}</div>
  ),
}));

beforeEach(() => {
  (useRouter as jest.Mock).mockClear();
});

it("renders download widget and triggers focus change", async () => {
  const pathname = "/meme-gas";
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push });
  (usePathname as jest.Mock).mockReturnValue(pathname);

  render(
    <GasRoyaltiesHeader
      title="Gas"
      description="desc"
      fetching={false}
      results_count={1}
      date_selection={DateIntervalsSelection.TODAY}
      selected_artist=""
      is_primary={false}
      is_custom_blocks={false}
      focus={GasRoyaltiesCollectionFocus.MEMES}
      getUrl={() => "https://test.6529.io/file"}
      setSelectedArtist={jest.fn()}
      setIsPrimary={jest.fn()}
      setIsCustomBlocks={jest.fn()}
      setDateSelection={jest.fn()}
      setDates={jest.fn()}
      setBlocks={jest.fn()}
    />
  );
  const download = await screen.findByTestId("download");
  expect(download.getAttribute("data-name")).toBe("gas_the-memes_today.csv");
  expect(download.getAttribute("data-url")).toBe(
    "https://test.6529.io/file&download=true"
  );
  const memeLab = screen.getByText("Meme Lab");
  fireEvent.click(memeLab);
  expect(push).toHaveBeenCalledWith(
    `${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMELAB}`
  );
});

it("renders token image with optional note", () => {
  render(
    <GasRoyaltiesTokenImage
      path="memes"
      token_id={1}
      name="Meme1"
      thumbnail="img.png"
      note="note"
    />
  );
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "/memes/1");
  expect(screen.getByAltText("Meme1")).toBeInTheDocument();
  expect(screen.getAllByTestId(/^tooltip-/)).toHaveLength(2);
});

describe("useSharedState", () => {
  it("builds url with primary sales and custom blocks", () => {
    const { result } = renderHook(() => useSharedState());
    act(() => {
      result.current.setCollectionFocus(GasRoyaltiesCollectionFocus.MEMES);
      result.current.setIsPrimary(true);
    });
    expect(result.current.getUrl("gas")).toBe(
      `https://example.com/api/gas/collection/memes?&primary=true`
    );
    act(() => {
      result.current.getSharedProps().setBlocks(10, 20);
    });
    expect(result.current.getUrl("gas")).toBe(
      `https://example.com/api/gas/collection/memes?&from_block=10&to_block=20`
    );
  });

  it("returns empty url when collection focus not set", () => {
    const { result } = renderHook(() => useSharedState());
    expect(result.current.getUrl("gas")).toBe("");
  });
});

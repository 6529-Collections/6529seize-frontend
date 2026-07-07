import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CreateDropGifPicker from "@/components/waves/CreateDropGifPicker";

jest.mock("@giphy/react-components", () => {
  const React = require("react");
  const SearchContext = React.createContext({
    fetchGifs: jest.fn(),
    searchKey: "test-search-key",
  });

  return {
    __esModule: true,
    SearchContext,
    SearchContextManager: ({ apiKey, options, children }: any) => {
      const [searchKey, setSearchKey] = React.useState("test-search-key");

      return (
        <SearchContext.Provider value={{ fetchGifs: jest.fn(), searchKey }}>
          <div
            data-testid="giphy-search-context"
            data-api-key={apiKey}
            data-rating={options?.rating}
            data-type={options?.type}
          >
            <button
              type="button"
              data-testid="change-giphy-search"
              onClick={() => setSearchKey("next-search-key")}
            >
              Change search
            </button>
            {children}
          </div>
        </SearchContext.Provider>
      );
    },
    SearchBar: ({ placeholder }: any) => (
      <input aria-label={placeholder} placeholder={placeholder} />
    ),
    Grid: ({
      columns,
      width,
      onGifClick,
      onGifsFetchError,
      onGifsFetched,
      noResultsMessage,
    }: any) => (
      <div data-testid="giphy-grid" data-columns={columns} data-width={width}>
        <div data-testid="giphy-no-results">{noResultsMessage}</div>
        <button
          data-testid="select-giphy-gif"
          onClick={(event) =>
            onGifClick(
              {
                images: {
                  original: {
                    url: "https://media1.giphy.com/media/abc/giphy.gif",
                  },
                },
              },
              event
            )
          }
        >
          Select GIPHY GIF
        </button>
        <button
          data-testid="select-giphy-fallback-gif"
          onClick={(event) =>
            onGifClick(
              {
                images: {
                  downsized_medium: {
                    url: "https://media2.giphy.com/media/def/giphy.gif",
                  },
                },
              },
              event
            )
          }
        >
          Select fallback GIF
        </button>
        <button
          data-testid="select-giphy-empty-gif"
          onClick={(event) => onGifClick({ images: {} }, event)}
        >
          Select empty GIF
        </button>
        <button
          data-testid="trigger-giphy-error"
          onClick={() => onGifsFetchError(new Error("rate limit"))}
        >
          Trigger error
        </button>
        <button data-testid="trigger-giphy-fetched" onClick={onGifsFetched}>
          Trigger fetched
        </button>
      </div>
    ),
  };
});

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: any;
};
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperDialog",
  () => (props: DialogProps) => (
    <div data-testid="dialog" role="dialog" aria-label={props.title}>
      <button aria-label="Close panel" onClick={props.onClose}></button>
      {props.children}
    </div>
  )
);

describe("CreateDropGifPicker", () => {
  const defaultProps = {
    giphyApiKey: "test-giphy-api-key",
    show: true,
    setShow: jest.fn(),
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the GIPHY picker with attribution", () => {
    render(<CreateDropGifPicker {...defaultProps} />);

    expect(screen.getByRole("dialog", { name: "GIF search" })).toBeVisible();
    expect(screen.getByTestId("giphy-search-context")).toHaveAttribute(
      "data-api-key",
      "test-giphy-api-key"
    );
    expect(screen.getByTestId("giphy-search-context")).toHaveAttribute(
      "data-rating",
      "r"
    );
    expect(screen.getByText("Powered by")).toBeVisible();
    expect(screen.getByText("GIPHY")).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "Search GIFs" })
    ).toBeVisible();
    expect(screen.getByLabelText("Powered by GIPHY")).toBeVisible();
    expect(screen.getByText("No GIFs found.")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "GIF search is ready."
    );
  });

  it("passes selected GIPHY media URLs to the parent", () => {
    const onSelect = jest.fn();
    render(<CreateDropGifPicker {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId("select-giphy-gif"));

    expect(onSelect).toHaveBeenCalledWith(
      "https://media1.giphy.com/media/abc/giphy.gif"
    );
  });

  it("falls back to alternate GIPHY renditions when original is unavailable", () => {
    const onSelect = jest.fn();
    render(<CreateDropGifPicker {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId("select-giphy-fallback-gif"));

    expect(onSelect).toHaveBeenCalledWith(
      "https://media2.giphy.com/media/def/giphy.gif"
    );
  });

  it("ignores selected GIFs without a media URL", () => {
    const onSelect = jest.fn();
    render(<CreateDropGifPicker {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId("select-giphy-empty-gif"));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows an unavailable state when GIPHY fetches fail", async () => {
    const setShow = jest.fn();
    render(<CreateDropGifPicker {...defaultProps} setShow={setShow} />);

    fireEvent.click(screen.getByTestId("trigger-giphy-error"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "GIF search is temporarily unavailable."
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "GIF search is temporarily unavailable."
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toHaveFocus();

    fireEvent.click(closeButton);
    expect(setShow).toHaveBeenCalledWith(false);
  });

  it("recovers from a GIPHY fetch error after the search changes", async () => {
    render(<CreateDropGifPicker {...defaultProps} />);

    fireEvent.click(screen.getByTestId("trigger-giphy-error"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "GIF search is temporarily unavailable."
    );

    fireEvent.click(screen.getByTestId("change-giphy-search"));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("giphy-grid")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "GIF search is ready."
    );
  });

  it("closes the dialog through the wrapper", () => {
    const setShow = jest.fn();
    render(<CreateDropGifPicker {...defaultProps} setShow={setShow} />);

    fireEvent.click(screen.getByLabelText("Close panel"));

    expect(setShow).toHaveBeenCalledWith(false);
  });

  it("renders nothing when hidden", () => {
    render(<CreateDropGifPicker {...defaultProps} show={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

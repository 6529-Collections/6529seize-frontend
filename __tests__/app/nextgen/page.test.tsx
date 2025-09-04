import { NextgenView } from "@/enums";
import { commonApiFetch } from "@/services/api/common-api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

process.env.BASE_ENDPOINT = "http://localhost";

// Import after mocks are set up if you prefer; require works fine too
const {
  default: NextGenPage,
  generateMetadata,
} = require("@/app/nextgen/[[...view]]/page");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

// Server helper used by the page; stub it to control headers
jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn().mockResolvedValue({ "x-mock": "1" }),
}));

// Lighten children
jest.mock("@/components/nextGen/collections/NextGen", () => () => (
  <div data-testid="nextgen" />
));
jest.mock("@/components/nextGen/collections/NextGenCollections", () => () => (
  <div />
));
jest.mock("@/components/nextGen/collections/NextGenArtists", () => () => (
  <div />
));
jest.mock("@/components/nextGen/collections/NextGenAbout", () => () => <div />);

jest.mock("@/components/nextGen/collections/NextGenNavigationHeader", () => {
  const { NextgenView } = jest.requireActual("@/enums"); // <-- get enum from the real source
  return {
    __esModule: true,
    default: ({ view, setView }: any) => (
      <button
        data-testid="nav"
        onClick={() => setView(NextgenView.ARTISTS)} // <-- now defined
      >
        {view}
      </button>
    ),
  };
});

// Title context: just mock the hook
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({ setTitle: jest.fn(), title: "" }),
  TitleProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const useRouterMock = require("next/navigation").useRouter as jest.Mock;
const useParamsMock = require("next/navigation").useParams as jest.Mock;
const mockedFetch = commonApiFetch as jest.Mock;

describe("generateMetadata", () => {
  it("returns metadata based on view", async () => {
    const md = await generateMetadata({
      params: Promise.resolve({ view: ["artists"] }),
    } as any);
    expect(md).toMatchObject({ title: "NextGen Artists" });
  });
});

describe("NextGen page component", () => {
  const push = jest.fn();
  let pushStateSpy: jest.SpyInstance;

  beforeEach(() => {
    push.mockClear();
    mockedFetch.mockReset().mockResolvedValue({ id: 1 }); // featured collection exists
    useRouterMock.mockReturnValue({ push });
    useParamsMock.mockReturnValue({ view: undefined }); // landing (no view)
    pushStateSpy = jest
      .spyOn(window.history, "pushState")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    pushStateSpy?.mockRestore();
  });

  it("fetches collection and handles navigation", async () => {
    const jsx = await NextGenPage({
      params: Promise.resolve({ view: undefined }),
    } as any);

    render(jsx);

    await waitFor(() =>
      expect(mockedFetch).toHaveBeenCalledWith({
        endpoint: "nextgen/featured",
        headers: { "x-mock": "1" },
      })
    );

    const nav = await screen.findByTestId("nav");
    fireEvent.click(nav);
    // History API assertions
    expect(pushStateSpy).toHaveBeenCalled();
    const lastCall =
      pushStateSpy.mock.calls[pushStateSpy.mock.calls.length - 1];
    // lastCall: [state, title, url]
    expect(lastCall[2]).toBe("/nextgen/artists");
    // Optionally assert state carries the view enum for back/forward restore
    expect(lastCall[0]).toEqual(
      expect.objectContaining({ view: NextgenView.ARTISTS })
    );
  });

  it("shows placeholder when collection missing", async () => {
    mockedFetch.mockResolvedValueOnce(null); // no featured collection

    const jsx = await NextGenPage({
      params: Promise.resolve({ view: undefined }),
    } as any);

    render(jsx);

    await waitFor(() =>
      expect(screen.getByAltText("questionmark")).toBeInTheDocument()
    );
  });
});

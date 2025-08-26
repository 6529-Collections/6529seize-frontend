import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { commonApiFetch } from "@/services/api/common-api";

process.env.BASE_ENDPOINT = "http://localhost";

const navModule = require("@/components/nextGen/collections/NextGenNavigationHeader");
const NextGenView = navModule.NextGenView;
const { default: NextGenPage, generateMetadata } = require("@/app/nextgen/[[...view]]/page");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/components/nextGen/collections/NextGen", () => () => <div data-testid="nextgen" />);
jest.mock("@/components/nextGen/collections/NextGenCollections", () => () => <div />);
jest.mock("@/components/nextGen/collections/NextGenArtists", () => () => <div />);
jest.mock("@/components/nextGen/collections/NextGenAbout", () => () => <div />);

jest.mock("@/components/nextGen/collections/NextGenNavigationHeader", () => {
  const actual = jest.requireActual(
    "@/components/nextGen/collections/NextGenNavigationHeader"
  );
  return {
    __esModule: true,
    NextGenView: actual.NextGenView,
    default: ({ view, setView }: any) => (
      <button data-testid="nav" onClick={() => setView(actual.NextGenView.ARTISTS)}>
        {view}
      </button>
    ),
  };
});

jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const useRouterMock = require("next/navigation").useRouter as jest.Mock;
const useParamsMock = require("next/navigation").useParams as jest.Mock;
const mockedFetch = commonApiFetch as jest.Mock;

describe("generateMetadata", () => {
  it("returns metadata based on view", async () => {
    const md = await generateMetadata({ params: { view: ["artists"] } } as any);
    expect(md).toMatchObject({ title: "NextGen Artists" });
  });
});

describe("NextGen page component", () => {
  const push = jest.fn();

  beforeEach(() => {
    push.mockClear();
    mockedFetch.mockReset().mockResolvedValue({ id: 1 });
    useRouterMock.mockReturnValue({ push });
    useParamsMock.mockReturnValue({ view: undefined });
  });

  it("fetches collection and handles navigation", async () => {
    render(<NextGenPage />);
    await waitFor(() =>
      expect(mockedFetch).toHaveBeenCalledWith({ endpoint: "nextgen/featured" })
    );
    const nav = await screen.findByTestId("nav");
    fireEvent.click(nav);
    expect(push).toHaveBeenCalledWith("/nextgen/artists");
  });

  it("shows placeholder when collection missing", async () => {
    mockedFetch.mockResolvedValueOnce(null);
    render(<NextGenPage />);
    await waitFor(() =>
      expect(screen.getByAltText("questionmark")).toBeInTheDocument()
    );
  });
});


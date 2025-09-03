import OpenMetaverse from "@/app/about/open-metaverse/page";
import ConsolidationMappingTool from "@/app/consolidation-mapping-tool/page";
import Tweetstorms from "@/app/education/tweetstorms/page";
import MemeLab from "@/app/meme-lab/page";
import FamPage from "@/app/museum/6529-fam/page";
import BalladOfGhosts from "@/app/museum/6529-fund-szn1/ballad-of-ghosts/page";
import DeadRingers from "@/app/museum/6529-fund-szn1/dead-ringers/page";
import GenesisPage from "@/app/museum/6529-fund-szn1/genesis/page";
import { AuthContext } from "@/components/auth/Auth";
import { render, screen } from "@testing-library/react";
import React, { useMemo } from "react";

// Mock TitleContext
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

const aliceUser = {
  handle: "alice",
  level: 1,
  tdh: 100,
  rep: 100,
  pfp: "https://example.com/alice.png",
};

jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({
    profile: aliceUser,
    isLoading: false,
  }),
}));

jest.mock("@/helpers/server.helpers", () => ({
  getUserProfile: jest.fn(() => Promise.resolve(aliceUser)),
  userPageNeedsRedirect: jest.fn(() => false),
}));

jest.mock("@/components/memelab/MemeLab", () => ({
  __esModule: true,
  default: () => <div data-testid="mocked-memelab">Mocked MemeLab</div>,
}));

const TestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setTitle = jest.fn();
  const authContextValue = useMemo(() => ({ setTitle }), [setTitle]);
  return (
    <AuthContext.Provider value={authContextValue as any}>
      {children}
    </AuthContext.Provider>
  );
};

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      status: 200,
      text: () => Promise.resolve("<div>html</div>"),
    })
  ) as any;
});

describe("additional static pages render", () => {
  it("renders Consolidation Mapping Tool page", () => {
    render(
      <TestProvider>
        <ConsolidationMappingTool />
      </TestProvider>
    );
    expect(screen.getByText(/Consolidation Mapping Tool/i)).toBeInTheDocument();
  });

  it("renders Open Metaverse page", () => {
    const { container } = render(<OpenMetaverse />);
    expect(container).toBeInTheDocument();
  });

  it("renders Tweetstorms page", () => {
    const { container } = render(<Tweetstorms />);
    expect(container).toBeInTheDocument();
  });

  it("renders Meme Lab page", () => {
    const { container } = render(
      <TestProvider>
        <MemeLab />
      </TestProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it("renders 6529 fam museum page", () => {
    render(<FamPage />);
    expect(screen.getAllByText(/6529 FAM/i).length).toBeGreaterThan(0);
  });

  it("renders Ballad of Ghosts page", () => {
    render(<BalladOfGhosts />);
    expect(screen.getAllByText(/BALLAD OF GHOSTS/i).length).toBeGreaterThan(0);
  });

  it("renders Dead Ringers page", () => {
    render(<DeadRingers />);
    expect(screen.getAllByText(/DEAD RINGERS/i).length).toBeGreaterThan(0);
  });

  it("renders Genesis museum page", () => {
    render(<GenesisPage />);
    expect(screen.getAllByText(/GENESIS/i).length).toBeGreaterThan(0);
  });
});

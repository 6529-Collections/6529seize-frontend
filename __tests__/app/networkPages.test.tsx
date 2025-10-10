import DefinitionsPage, {
  generateMetadata as generateDefinitionsMetadata,
} from "@/app/network/definitions/page";
import GroupsPage, {
  generateMetadata as generateGroupsMetadata,
} from "@/app/network/groups/page";
import TDHPage, {
  generateMetadata as generateTDHMetadata,
} from "@/app/network/tdh/page";
import { AuthContext } from "@/components/auth/Auth";
import { render, screen } from "@testing-library/react";
import React from "react";

// ✅ Mock next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => "/network",
}));

// ✅ Mock Groups component
jest.mock("@/components/groups/page/Groups", () => ({
  __esModule: true,
  default: () => <div data-testid="groups-component">Groups Component</div>,
}));

// ✅ AuthContext mock
const mockAuthContext = {
  connectedProfile: null,
  activeProfileProxy: null,
  requestAuth: jest.fn(),
} as any;

function renderWithAuth(component: React.ReactElement) {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
}

// ✅ TitleContext mock
const mockSetTitle = jest.fn();
jest.mock("@/contexts/TitleContext", () => ({
  __esModule: true,
  useTitle: () => ({
    title: "Test Title",
    setTitle: mockSetTitle,
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: () => mockSetTitle,
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("network pages render", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Groups page", () => {
    renderWithAuth(<GroupsPage />);
    expect(screen.getByTestId("groups-component")).toBeInTheDocument();
  });

  it("renders TDH page", () => {
    renderWithAuth(<TDHPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /^TDH$/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/How TDH is computed/i)).toBeInTheDocument();
    expect(screen.getByText(/TDH 1.4/i)).toBeInTheDocument();
  });

  it("displays TDH calculation details", () => {
    renderWithAuth(<TDHPage />);
    expect(screen.getByText(/Total Days Held/i)).toBeInTheDocument();
    expect(screen.getByText(/Additional Set Boost/i)).toBeInTheDocument();
  });

  it("renders Definitions page", () => {
    renderWithAuth(<DefinitionsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /^Definitions$/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/Cards Collected/i)).toBeInTheDocument();
    expect(screen.getByText(/Unique Memes/i)).toBeInTheDocument();
  });

  it("generates metadata for Groups page", async () => {
    const metadata = await generateGroupsMetadata();
    expect(metadata.title).toEqual("Groups");
    expect(metadata.description).toEqual("Network | 6529.io");
  });

  it("generates metadata for TDH page", async () => {
    const metadata = await generateTDHMetadata();
    expect(metadata.title).toEqual("TDH");
    expect(metadata.description).toEqual("Network | 6529.io");
  });

  it("generates metadata for Definitions page", async () => {
    const metadata = await generateDefinitionsMetadata();
    expect(metadata.title).toEqual("Definitions");
    expect(metadata.description).toEqual("Network | 6529.io");
  });
});

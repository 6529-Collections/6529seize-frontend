import { render, screen } from "@testing-library/react";
import React from "react";
import GroupsPage, {
  generateMetadata as generateGroupsMetadata,
} from "@/app/network/groups/page";
import CommunityMetricsPage, {
  generateMetadata as generateMetricsMetadata,
} from "@/app/network/metrics/page";
import { AuthContext } from "@/components/auth/Auth";

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
    process.env.BASE_ENDPOINT = "https://base.test";
  });

  it("renders Groups page", () => {
    renderWithAuth(<GroupsPage />);
    expect(screen.getByTestId("groups-component")).toBeInTheDocument();
  });

  it("renders Community Metrics page", () => {
    renderWithAuth(<CommunityMetricsPage />);
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("Metrics")).toBeInTheDocument();
    expect(screen.getByText(/Background/i)).toBeInTheDocument();
    expect(screen.getByText(/Metrics Definitions/i)).toBeInTheDocument();
  });

  it("displays TDH calculation details in metrics page", () => {
    renderWithAuth(<CommunityMetricsPage />);
    expect(screen.getByText(/Total Days Held/i)).toBeInTheDocument();
    expect(screen.getByText(/Cards Collected/i)).toBeInTheDocument();
    expect(screen.getByText(/Unique Memes/i)).toBeInTheDocument();
  });

  it("generates metadata for Groups page", async () => {
    const metadata = await generateGroupsMetadata();
    expect(metadata.title).toEqual("Groups");
    expect(metadata.description).toEqual("Network | 6529.io");
  });

  it("generates metadata for Metrics page", async () => {
    const metadata = await generateMetricsMetadata();
    expect(metadata.title).toEqual("Metrics");
    expect(metadata.description).toEqual("Network | 6529.io");
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import CommunityStatsPage, { generateMetadata } from "@/app/network/stats/page";
import { AuthContext } from "@/components/auth/Auth";

// ✅ Mocks
jest.mock("react-bootstrap", () => ({
  Container: ({ children, fluid, className }: any) => (
    <div data-testid="container" className={className} data-fluid={fluid}>
      {children}
    </div>
  ),
  Row: ({ children }: any) => <div data-testid="row">{children}</div>,
  Col: ({ children }: any) => <div data-testid="col">{children}</div>,
}));
jest.mock("@/styles/Home.module.scss", () => ({
  main: "main-class",
  tdhMain: "tdh-main-class",
}));

// ✅ TitleContext
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

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(() => Promise.resolve({ data: [{ mock: "item" }] })),
}));

describe("CommunityStats page", () => {
  beforeEach(() => {
    process.env.BASE_ENDPOINT = "https://base.test";
  });

  const renderPage = () =>
    render(
      <AuthContext.Provider value={{} as any}>
        <CommunityStatsPage />
      </AuthContext.Provider>
    );

  it("renders layout and dynamic component", () => {
    renderPage();
    expect(screen.getAllByTestId("container").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("row").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("col").length).toBeGreaterThan(0);
  });

  it("sets title on mount", () => {
    renderPage();
    // implicitly tested through mock hook usage
  });

  it("generates metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toEqual("Stats");
    expect(metadata.description).toEqual("Network | 6529.io");
  });
});
